<?php

namespace App\Http\Controllers\Attendance;

use App\Http\Controllers\Controller;
use App\Models\Batch;
use App\Models\BatchSession;
use App\Models\Member;
use App\Models\MemberAttendance;
use App\Models\Partner;
use App\Models\PartnerAttendance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log; // Added for logging
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;
use App\Traits\LogsActivity; // Import the trait

class AttendanceController extends Controller
{
    use LogsActivity; // Use the trait

    public function getBatches()
    {
        try {
            // Eager load members and partners with necessary fields including excused_until
            $batches = Batch::select('id', 'name', 'status', 'start_date', 'end_date') // Added start_date, end_date
                ->where('status', 'active') // Consider if other statuses should be included
                ->with([
                    'members:id,name,email,status,excused_until,excuse_reason', // Added excuse_reason
                    'partners:id,name,email,status,excused_until,excuse_reason' // Added excuse_reason
                ])
                ->orderBy('name', 'asc') // Optional: order batches
                ->get();

            return response()->json([
                'message' => 'Batches retrieved successfully',
                'data' => $batches
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to retrieve batches: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to retrieve batches',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all attendance records for all sessions of a given batch.
     * Optimized to minimize queries and data transfer.
     * Note: 'excused' is now handled as a display state based on excused_until date,
     * while maintaining the actual attendance status in the database.
     * 
     * @param Request $request
     * @param int $batchId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAllAttendanceForBatch(Request $request, $batchId)
    {
        $validator = Validator::make(['batch_id' => $batchId] + $request->all(), [
            'batch_id' => 'required|exists:batches,id',
            'type' => 'required|in:member,partner',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Define model and relationship names based on type
            $attendanceModel = $request->type === 'member' ? MemberAttendance::class : PartnerAttendance::class;
            $personModel = $request->type === 'member' ? Member::class : Partner::class;
            $personIdColumn = $request->type === 'member' ? 'member_id' : 'partner_id';
            $relationName = $request->type;
            $personTable = $request->type === 'member' ? 'members' : 'partners';
            $batchPersonTable = $request->type === 'member' ? 'batch_members' : 'batch_partners';

            // Get current date for comparison
            $today = Carbon::now()->startOfDay();

            // 1. Get batch data with sessions
            $batchData = Batch::select('batches.id', 'batches.name')
                ->with(['batchSessions' => function ($query) {
                    $query->select('batch_sessions.id', 'batch_sessions.batch_id', 'batch_sessions.date')
                        ->orderBy('batch_sessions.date', 'asc');
                }])
                ->findOrFail($batchId);

            // 2. Get active persons for this batch with proper table qualification
            $activePersons = $personModel::select(
                    "{$personTable}.id",
                    "{$personTable}.name",
                    "{$personTable}.email",
                    "{$personTable}.excused_until",
                    "{$personTable}.excuse_reason"
                )
                ->where("{$personTable}.status", 'active')
                ->whereHas('batches', function ($query) use ($batchId, $batchPersonTable, $personTable) {
                    $query->where('batches.id', $batchId);
                })
                ->get();

            // Early returns for empty data

            if ($activePersons->isEmpty()) {
                DB::commit();
                return response()->json([
                    'error' => 'No active ' . $request->type . 's found for this batch.',
                    'data' => []
                ], 404);
            }
            
            if ($batchData->batchSessions->isEmpty()) {
                DB::commit();
                return response()->json([
                    'error' => 'No sessions found for this batch.',
                    'data' => []
                ], 404);
            }

            

            // 3. Get existing attendance records only for past and current dates
            $attendanceTable = (new $attendanceModel)->getTable();
            $existingAttendance = $attendanceModel::select(
                    "{$attendanceTable}.id",
                    "{$attendanceTable}.batch_session_id",
                    "{$attendanceTable}.{$personIdColumn}",
                    "{$attendanceTable}.status",
                    "{$attendanceTable}.marked_at",
                    "{$attendanceTable}.notes"
                )
                ->join('batch_sessions', "{$attendanceTable}.batch_session_id", '=', 'batch_sessions.id')
                ->where('batch_sessions.date', '<=', $today)
                ->whereIn("{$attendanceTable}.batch_session_id", $batchData->batchSessions->pluck('id'))
                ->whereIn("{$attendanceTable}.{$personIdColumn}", $activePersons->pluck('id'))
                ->get()
                ->keyBy(function ($item) use ($personIdColumn) {
                    return "{$item->batch_session_id}_{$item->$personIdColumn}";
                });

            // 4. Prepare and create missing records only for past and current dates
            $now = now();
            $recordsToCreate = [];

            foreach ($batchData->batchSessions as $session) {
                $sessionDate = Carbon::parse($session->date)->startOfDay();
                if ($sessionDate->lte($today)) {
                    foreach ($activePersons as $person) {
                        $key = "{$session->id}_{$person->id}";
                        if (!isset($existingAttendance[$key])) {
                            $recordsToCreate[] = [
                                'batch_session_id' => $session->id,
                                $personIdColumn => $person->id,
                                'status' => 'not marked',
                                'created_at' => $now,
                                'updated_at' => $now
                            ];
                        }
                    }
                }
            }

            if (!empty($recordsToCreate)) {
                $attendanceModel::insert($recordsToCreate);
            }

            // 5. Build response data efficiently using collections
            $formattedRecords = [];

            foreach ($batchData->batchSessions as $session) {
                $sessionDate = Carbon::parse($session->date);
                $isPastOrPresent = $sessionDate->startOfDay()->lte($today);

                foreach ($activePersons as $person) {
                    $key = "{$session->id}_{$person->id}";
                    $record = $existingAttendance[$key] ?? null;

                    // For future dates, we don't need to create records in the database
                    $formattedRecords[] = [
                        'id' => $record ? $record->id : null,
                        'status' => $isPastOrPresent ? ($record ? $record->status : 'not marked') : 'not marked',
                        'display_status' => $isPastOrPresent ? ($record ? $record->status : 'not marked') : 'not marked',
                        'marked_at' => $record && $record->marked_at ? Carbon::parse($record->marked_at)->toIso8601String() : null,
                        'notes' => $record ? $record->notes : null,
                        'is_editable' => $isPastOrPresent,
                        'batch_session' => [
                            'id' => $session->id,
                            'date' => $sessionDate->format('Y-m-d'),
                            'batch' => [
                                'id' => $batchData->id,
                                'name' => $batchData->name,
                            ]
                        ],
                        $relationName => [
                            'id' => $person->id,
                            'name' => $person->name,
                            'email' => $person->email,
                            'excused_until' => $person->excused_until ? Carbon::parse($person->excused_until)->format('Y-m-d') : null,
                            'excuse_reason' => $person->excuse_reason,
                        ]
                    ];
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Attendance data retrieved successfully.',
                'data' => $formattedRecords,
                'current_date' => $today->format('Y-m-d')
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error in getAllAttendanceForBatch: ' . $e->getMessage() . ' for batch_id: ' . $batchId . ' and type: ' . $request->type);
            return response()->json([
                'message' => 'Failed to retrieve or create attendance data.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark attendance for a member/partner.
     * Note: When a person is excused, we only allow marking them as excused,
     * but we maintain their actual attendance status in the database.
     */
    public function markAttendance(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:member,partner',
            'person_id' => 'required|integer',
            'batch_id' => 'required|exists:batches,id',
            'date' => 'required|date_format:Y-m-d',
            'status' => 'required|in:present,absent,excused,not marked',
            'notes' => 'nullable|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $date = Carbon::parse($request->date)->format('Y-m-d');
            
            // Prevent marking attendance for future dates
            if (Carbon::parse($date)->startOfDay()->gt(Carbon::now()->startOfDay())) {
                DB::rollBack();
                return response()->json([
                    'message' => 'Cannot mark attendance for future dates',
                    'error' => 'Future date restriction'
                ], 422);
            }

            // Check if person is excused for this date
            $personModel = $request->type === 'member' ? Member::class : Partner::class;
            $person = $personModel::findOrFail($request->person_id);
            
            // Store original data for logging if attendance record exists
            $oldAttendanceData = null;

            $isExcused = $person->excused_until && 
                        Carbon::parse($person->excused_until)->startOfDay()
                        ->gte(Carbon::parse($date)->startOfDay());

            if ($isExcused && $request->status !== 'excused') {
                DB::rollBack();
                return response()->json([
                    'message' => 'Cannot mark attendance as ' . $request->status . '. ' . ucfirst($request->type) . 
                                ' is excused until ' . Carbon::parse($person->excused_until)->format('Y-m-d') . 
                                '. Can only mark as excused during excused period.',
                    'excused_until' => $person->excused_until
                ], 422);
            }

            $batchSession = BatchSession::where('batch_id', $request->batch_id)
                ->where('date', $date)
                ->first();

            if (!$batchSession) {
                DB::rollBack();
                return response()->json([
                    'message' => 'No session found for the given date.',
                ], 404);
            }

            $attendanceModel = $request->type === 'member' ? MemberAttendance::class : PartnerAttendance::class;
            $personIdColumn = $request->type === 'member' ? 'member_id' : 'partner_id';

            // Fetch existing record to log old values if it exists
            $existingAttendanceRecord = $attendanceModel::where([
                $personIdColumn => $request->person_id,
                'batch_session_id' => $batchSession->id
            ])->first();
            if ($existingAttendanceRecord) {
                $oldAttendanceData = ['status' => $existingAttendanceRecord->status];
            }

            $attendance = $attendanceModel::updateOrCreate(
                [
                    $personIdColumn => $request->person_id,
                    'batch_session_id' => $batchSession->id
                ],
                [
                    'status' => $request->status,
                    'notes' => $request->notes,
                    'marked_at' => now(),
                    'marked_by' => Auth::id()
                ]
            );

            // Log the attendance marking action
            $logDetails = "Attendance for {$person->name} on {$date} for batch \"{$batchSession->batch->name}\" marked as {$request->status}.";

            $this->logAttendanceAction(
                'Attendance Marked',
                $person,
                $logDetails,
                $oldAttendanceData,
                ['status' => $attendance->status]
            );

            // Format response to match getAllAttendanceForBatch structure
            $formattedResponse = [
                'id' => $attendance->id,
                'status' => $attendance->status,
                'display_status' => $attendance->status,
                'marked_at' => $attendance->marked_at ? Carbon::parse($attendance->marked_at)->toIso8601String() : null,
                'notes' => $attendance->notes,
                'batch_session' => [
                    'id' => $batchSession->id,
                    'date' => Carbon::parse($batchSession->date)->format('Y-m-d'),
                    'batch' => [
                        'id' => $request->batch_id,
                        'name' => $batchSession->batch->name,
                    ]
                ],
                $request->type => [
                    'id' => $person->id,
                    'name' => $person->name,
                    'email' => $person->email,
                    'excused_until' => $person->excused_until ? Carbon::parse($person->excused_until)->format('Y-m-d') : null,
                    'excuse_reason' => $person->excuse_reason,
                ]
            ];

            DB::commit();

            return response()->json([
                'message' => 'Attendance marked successfully',
                'data' => $formattedResponse
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to mark attendance: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to mark attendance',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // getAttendanceByDate might be deprecated by getAllAttendanceForBatch for the main attendance tracker,
    // but could still be useful for other specific lookups.
    public function getAttendanceByDate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'batch_id' => 'required|exists:batches,id',
            'date' => 'required|date_format:Y-m-d',
            'type' => 'required|in:member,partner'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $date = Carbon::parse($request->date)->format('Y-m-d');
            // $batch = Batch::findOrFail($request->batch_id); // Not strictly needed

            $batchSession = BatchSession::where('batch_id', $request->batch_id)
                ->where('date', $date)
                ->first();

            if (!$batchSession) {
                // If no session, it implies no attendance can be recorded or fetched for this specific date.
                // We should return an empty array for data, consistent with frontend expectations.
                return response()->json([
                    'error' => 'No session found for this batch on the specified date.',
                    'data' => []
                ], 404);
            }
            
            $attendanceData = [];
            if ($request->type === 'member') {
                $attendanceRecords = MemberAttendance::where('batch_session_id', $batchSession->id)
                    ->with(['member:id,name,email,status,excused_until,excuse_reason', 'batchSession.batch:id,name'])
                    ->get();
            } else {
                $attendanceRecords = PartnerAttendance::where('batch_session_id', $batchSession->id)
                    ->with(['partner:id,name,email,status,excused_until,excuse_reason', 'batchSession.batch:id,name'])
                    ->get();
            }

            // Format the response to be consistent
            foreach($attendanceRecords as $record) {
                $personData = $request->type === 'member' ? $record->member : $record->partner;
                $attendanceData[] = [
                    'id' => $record->id,
                    'status' => $record->status,
                    'marked_at' => $record->marked_at ? Carbon::parse($record->marked_at)->toIso8601String() : null,
                    'notes' => $record->notes,
                    'batch_session' => [
                        'id' => $record->batchSession->id,
                        'date' => Carbon::parse($record->batchSession->date)->format('Y-m-d'),
                        'batch' => [
                            'id' => $record->batchSession->batch->id,
                            'name' => $record->batchSession->batch->name,
                        ]
                    ],
                    $request->type => [
                        'id' => $personData->id,
                        'name' => $personData->name,
                        'email' => $personData->email,
                        'excused_until' => $personData->excused_until ? Carbon::parse($personData->excused_until)->format('Y-m-d') : null,
                        'excuse_reason' => $personData->excuse_reason,
                    ]
                ];
            }


            return response()->json([
                'message' => 'Attendance retrieved successfully',
                'data' => $attendanceData
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to retrieve attendance by date: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to retrieve attendance',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getPartnerRecentAttendance($partnerId)
    {
        $validator = Validator::make(['partner_id' => $partnerId], [
            'partner_id' => 'required|exists:partners,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed: Invalid Partner ID.',
                'errors' => $validator->errors()
            ], 422);
        }
        
        try {
            // Get partner details first to ensure they exist and are active
            $partner = Partner::findOrFail($partnerId);
            
            if ($partner->status !== 'Active') {
                return response()->json([
                    'message' => 'Partner is not active',
                    'data' => []
                ]);
            }

            $today = Carbon::today()->endOfDay();

            $recentAttendanceRecords = PartnerAttendance::select(
                'partner_attendances.id',
                'partner_attendances.status',
                'partner_attendances.marked_at',
                'partner_attendances.notes',
                'partner_attendances.batch_session_id',
                'batch_sessions.date as session_date',
                'batches.id as batch_id',
                'batches.name as batch_name'
            )
            ->join('batch_sessions', 'partner_attendances.batch_session_id', '=', 'batch_sessions.id')
            ->join('batches', 'batch_sessions.batch_id', '=', 'batches.id')
            ->where('partner_attendances.partner_id', $partnerId)
            ->where('batch_sessions.date', '<=', $today)
            ->orderBy('batch_sessions.date', 'desc')
            ->orderBy('partner_attendances.marked_at', 'desc')
            ->limit(10)
            ->get();
            
            $formattedAttendance = $recentAttendanceRecords->map(function ($record) {
                return [
                    'id' => $record->id,
                    'status' => $record->status ?? 'not marked',
                    'marked_at' => $record->marked_at ? Carbon::parse($record->marked_at)->toIso8601String() : null,
                    'notes' => $record->notes,
                    'batch_session' => [
                        'id' => $record->batch_session_id,
                        'date' => Carbon::parse($record->session_date)->format('Y-m-d'),
                        'batch' => [
                            'id' => $record->batch_id,
                            'name' => $record->batch_name,
                        ]
                    ]
                ];
            });

            return response()->json([
                'message' => 'Recent attendance retrieved successfully',
                'data' => $formattedAttendance
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to retrieve recent partner attendance: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to retrieve recent attendance',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // public function excusePerson(Request $request)
    // {
    //     $validator = Validator::make($request->all(), [
    //         'type' => 'required|in:member,partner',
    //         'person_id' => 'required|integer',
    //         'excused_until' => 'required|date_format:Y-m-d|after_or_equal:today', // Ensure Y-m-d
    //         'excuse_reason' => 'required|string|max:500'
    //     ]);

    //     if ($validator->fails()) {
    //         return response()->json([
    //             'message' => 'Validation failed',
    //             'errors' => $validator->errors()
    //         ], 422);
    //     }

    //     try {
    //         DB::beginTransaction();
    //         $personModel = $request->type === 'member' ? Member::class : Partner::class;
    //         $person = $personModel::findOrFail($request->person_id);

    //         $oldValues = [
    //             'excused_until' => $person->excused_until ? Carbon::parse($person->excused_until)->format('Y-m-d') : null,
    //             'excuse_reason' => $person->excuse_reason,
    //         ];

    //         // In excusePerson method
    //         $person->update([
    //             'excused_until' => Carbon::parse($request->excused_until)->format('Y-m-d'),
    //             'excuse_reason' => $request->excuse_reason // Corrected
    //         ]);

    //         $newValues = [
    //             'excused_until' => Carbon::parse($person->excused_until)->format('Y-m-d'),
    //             'excuse_reason' => $person->excuse_reason,
    //         ];

    //         $this->logAttendanceAction(
    //             ucfirst($request->type) . ' Excused',
    //             $person,
    //             ucfirst($request->type) . " \"{$person->name}\" excused until " . Carbon::parse($request->excused_until)->format('Y-m-d') . " due to: \"{$request->excuse_reason}\".",
    //             $oldValues,
    //             $newValues
    //         );
    //         DB::commit();

    //         return response()->json([
    //             'message' => ucfirst($request->type) . ' excused successfully until ' . Carbon::parse($request->excused_until)->format('Y-m-d'),
    //             'data' => $person->fresh() // Return fresh data
    //         ]);

    //     } catch (\Exception $e) {
    //         DB::rollBack();
    //         Log::error('Failed to excuse ' . $request->type . ': ' . $e->getMessage());
    //         return response()->json([
    //             'message' => 'Failed to excuse ' . $request->type,
    //             'error' => $e->getMessage()
    //         ], 500);
    //     }
    // }

    // public function resumeAttendance(Request $request)
    // {
    //     $validator = Validator::make($request->all(), [
    //         'type' => 'required|in:member,partner',
    //         'person_id' => 'required|integer'
    //     ]);

    //     if ($validator->fails()) {
    //         return response()->json([
    //             'message' => 'Validation failed',
    //             'errors' => $validator->errors()
    //         ], 422);
    //     }

    //     try {
    //         DB::beginTransaction();
    //         $personModel = $request->type === 'member' ? Member::class : Partner::class;
    //         $person = $personModel::findOrFail($request->person_id);

    //         $oldValues = [
    //             'excused_until' => $person->excused_until ? Carbon::parse($person->excused_until)->format('Y-m-d') : null,
    //             'excuse_reason' => $person->excuse_reason,
    //         ];

    //         $person->update([
    //             'excused_until' => null,
    //             'excuse_reason' => null
    //         ]);

    //         $newValues = [
    //             'excused_until' => null,
    //             'excuse_reason' => null,
    //         ];

    //         $this->logAttendanceAction(
    //             ucfirst($request->type) . ' Attendance Resumed',
    //             $person,
    //             "Attendance resumed for " . ucfirst($request->type) . " \"{$person->name}\".",
    //             $oldValues,
    //             $newValues
    //         );
    //         DB::commit();

    //         return response()->json([
    //             'message' => ucfirst($request->type) . ' attendance resumed successfully',
    //             'data' => $person->fresh() // Return fresh data
    //         ]);

    //     } catch (\Exception $e) {
    //         DB::rollBack();
    //         Log::error('Failed to resume ' . $request->type . ' attendance: ' . $e->getMessage());
    //         return response()->json([
    //             'message' => 'Failed to resume ' . $request->type . ' attendance',
    //             'error' => $e->getMessage()
    //         ], 500);
    //     }
    // }
}
