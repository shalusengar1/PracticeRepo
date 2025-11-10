<?php
namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\Batch;
use App\Models\Member;
use App\Models\Program;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use App\Traits\LogsActivity;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class MemberController extends Controller
{
    use LogsActivity;

    /**
     * Display a listing of the members with optimized loading.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        $perPage = request()->query('per_page', 10);
        $page = request()->query('page', 1);
        $paginate = filter_var(request()->query('paginate', true), FILTER_VALIDATE_BOOLEAN);

        $query = Member::with([
            'batches' => function ($query) {
                $query->where('batches.status', 'active')
                      ->select('batches.id', 'batches.name', 'batches.program_id');
            },
            'batches.program:id,name'
        ])
        ->select('members.id', 'members.name', 'members.email', 'members.mobile', 'members.status', 'members.created_at', 'members.updated_at');

        // Add filtering by search term
        if ($search = request()->query('search')) {
            $query->where(function($q) use ($search) {
                $q->where('members.name', 'like', "%{$search}%")
                  ->orWhere('members.email', 'like', "%{$search}%")
                  ->orWhere('members.mobile', 'like', "%{$search}%");
            });
        }

        // Filter by batch or program
        if ($batchId = request()->query('batch_id')) {
            $query->whereHas('batches', function ($q) use ($batchId) {
                $q->where('batches.id', $batchId);
            });
        } elseif ($programId = request()->query('program_id')) {
            $query->whereHas('batches', function ($q) use ($programId) {
                $q->where('program_id', $programId);
            });
        }
        
        $query->orderBy('members.created_at', 'desc');

        if ($paginate) {
            $members = $query->paginate($perPage, ['*'], 'page', $page);
            $members->getCollection()->transform(function ($member) {
                return [
                    'id' => $member->id,
                    'name' => $member->name,
                    'email' => $member->email,
                    'mobile' => $member->mobile,
                    'status' => $member->status,
                    'created_at' => $member->created_at,
                    'updated_at' => $member->updated_at,
                    'batches' => $member->batches->map(function ($batch) {
                        return [
                            'id' => $batch->id,
                            'name' => $batch->name,
                            'program' => $batch->program ? [
                                'id' => $batch->program->id,
                                'name' => $batch->program->name,
                            ] : null,
                        ];
                    }),
                ];
            });
            return response()->json($members);
        } else {
            $members = $query->get();
            $formattedMembers = $members->map(function ($member) {
                return [
                    'id' => $member->id,
                    'name' => $member->name,
                    'email' => $member->email,
                    'mobile' => $member->mobile,
                    'status' => $member->status,
                    'created_at' => $member->created_at,
                    'updated_at' => $member->updated_at,
                    'batches' => $member->batches->map(function ($batch) {
                        return [
                            'id' => $batch->id,
                            'name' => $batch->name,
                            'program' => $batch->program ? [
                                'id' => $batch->program->id,
                                'name' => $batch->program->name,
                            ] : null,
                        ];
                    }),
                ];
            });
            return response()->json(['data' => $formattedMembers]);
        }
    }

    public function getMembersForStudentList(Request $request)
    {
        try {
            $query = Member::query();

            // Default fields required by StudentList.tsx for the Member model itself
            $defaultMemberFields = [
                'id', 'name', 'email', 'mobile', 'status', 
                'excused_until', 'excuse_reason', 'created_at', 'updated_at'
                // Add any other direct columns from the 'members' table needed by StudentList
            ];

            $fieldsToSelect = $defaultMemberFields;

            if ($request->has('fields')) {
                $requestedFieldsParam = $request->input('fields');
                // Ensure it's a string before exploding, in case an array is somehow passed via query params
                $requestedFields = is_string($requestedFieldsParam) ? explode(',', $requestedFieldsParam) : [];
                
                if (!empty($requestedFields)) {
                    $memberTable = (new Member())->getTable();
                    $availableColumns = Schema::getColumnListing($memberTable);
                    
                    $validRequestedFields = array_filter($requestedFields, function ($field) use ($availableColumns) {
                        return in_array(trim($field), $availableColumns);
                    });

                    if (!empty($validRequestedFields)) {
                        // Merge with defaults to ensure critical fields are always there, then make unique
                        $fieldsToSelect = array_unique(array_merge($defaultMemberFields, $validRequestedFields));
                    }
                }
            }
            
            $query->select($fieldsToSelect);

            // Eager load batches (and their program) with specific fields
            $query->with([
                'batches' => function ($batchQuery) {
                    $batchQuery->where('status', 'active') // Filter for active batches
                               ->select(['batches.id', 'batches.name', 'batches.program_id']); // Select specific fields for batches
                               // Ensure 'batch_member.member_id' and 'batch_member.batch_id' are implicitly handled by belongsToMany
                },
                'batches.program' => function ($programQuery) {
                    $programQuery->select(['programs.id', 'programs.name']); // Select specific fields for programs
                }
            ]);
            
            // Order by created_at in descending order to get latest first
            $query->orderBy('created_at', 'desc');
            
            $members = $query->get();

            return response()->json($members); // Laravel wraps collections in 'data' key by default

        } catch (\Exception $e) {
            Log::error('Error in getMembersForStudentList: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to retrieve members for student list', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Store a newly created member in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:40',
            'email' => 'required|email|unique:members,email',
            'mobile' => 'required|string|min:10|max:15|unique:members,mobile',
            'batch_ids' => 'nullable|array',
            'batch_ids.*' => [
                'exists:batches,id',
                Rule::exists('batches', 'id')->where(function ($query) {
                    $query->where('status', 'active');
                }),
            ],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $member = new Member([
            'name' => $request->name,
            'email' => $request->email,
            'mobile' => $request->mobile,
            'status' => 'active',
            'created_by' => Auth::id(),
        ]);

        $member->save();

        if ($request->has('batch_ids') && is_array($request->batch_ids)) {
            $member->batches()->attach($request->batch_ids);
        }

        // Log the member creation
        $this->logMemberAction(
            'Member Created',
            $member,
            "Member \"{$member->name}\" was created",
            null,
            $member->load('batches')->toArray()
        );

        // Reload the member with its active batches, qualifying column names
        $member->load([
            'batches' => function ($query) {
                $query->where('batches.status', 'active')
                      ->select('batches.id', 'batches.name', 'batches.program_id');
            },
            'batches.program:id,name'
        ]);

        $formattedMember = [
            'id' => $member->id,
            'name' => $member->name,
            'email' => $member->email,
            'mobile' => $member->mobile,
            'status' => $member->status,
            'created_at' => $member->created_at,
            'updated_at' => $member->updated_at,
            'batches' => $member->batches->map(function ($batch) {
                return [
                    'id' => $batch->id,
                    'name' => $batch->name,
                    'program' => $batch->program ? [
                        'id' => $batch->program->id,
                        'name' => $batch->program->name,
                    ] : null,
                ];
            }),
        ];

        return response()->json(['message' => 'Member created successfully', 'data' => $formattedMember], 201);
    }

    /**
     * Display the specified member with optimized loading.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        $member = Member::with([
            'batches' => function ($query) {
                // Qualify column names
                $query->where('batches.status', 'active')
                      ->select('batches.id', 'batches.name', 'batches.program_id');
            },
            'batches.program:id,name'
        ])
        ->select('members.id', 'members.name', 'members.email', 'members.mobile', 'members.status', 'members.created_at', 'members.updated_at') // Qualify member columns
        ->find($id);
        
        if (!$member) {
            return response()->json(['message' => 'Member not found'], 404);
        }

        $formattedMember = [
            'id' => $member->id,
            'name' => $member->name,
            'email' => $member->email,
            'mobile' => $member->mobile,
            'status' => $member->status,
            'created_at' => $member->created_at,
            'updated_at' => $member->updated_at,
            'batches' => $member->batches->map(function ($batch) {
                return [
                    'id' => $batch->id,
                    'name' => $batch->name,
                    'program' => $batch->program ? [
                        'id' => $batch->program->id,
                        'name' => $batch->program->name,
                    ] : null,
                ];
            }),
        ];

        return response()->json(['data' => $formattedMember]);
    }

    /**
     * Update the specified member in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        $member = Member::find($id);
        
        if (!$member) {
            return response()->json(['message' => 'Member not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:40',
            'email' => [
                'sometimes', 
                'email',
                'max:100',
                Rule::unique('members')->ignore($id)
            ],
            'mobile' => [
                'sometimes',
                'string',
                'min:10',
                'max:15',
                Rule::unique('members')->ignore($id)
            ],
            'status' => [
                'sometimes',
                'string',
                Rule::in(['active', 'inactive', 'blacklisted'])
            ],
            'batch_ids' => 'nullable|array',
            'batch_ids.*' => [
                'exists:batches,id',
                Rule::exists('batches', 'id')->where(function ($query) {
                    $query->where('status', 'active');
                }),
            ],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        // Store original data for logging
        $originalData = $member->load('batches')->toArray();
        $originalBatchIds = $member->batches->pluck('id')->toArray();
        $originalBatchNames = $member->batches->pluck('name')->implode(', ');
        if (empty($originalBatchNames)) $originalBatchNames = 'N/A';

        if ($request->has('name')) {
            $member->name = $request->name;
        }
        if ($request->has('email')) {
            $member->email = $request->email;
        }
        if ($request->has('mobile')) {
            $member->mobile = $request->mobile;
        }
        if ($request->has('status')) {
            $member->status = $request->status;
        }
        $member->updated_by = Auth::id();
        $member->save();

        $newBatchIds = [];
        if ($request->has('batch_ids')) {
            $newBatchIds = $request->batch_ids;
            $member->batches()->sync($request->batch_ids);
        }

        // Reload the member with updated data
        $member->load('batches');

        // Prepare logging data
        $changedAttributes = $member->getChanges();
        $logDetailsParts = [];
        $oldValuesForLog = [];
        $newValuesForLog = [];

        // Exclude certain fields from generic message generation
        $excludedFromGenericLogMessage = ['updated_at', 'created_at', 'updated_by', 'created_by'];

        foreach ($changedAttributes as $key => $newValue) {
            // Always log old/new values for the structured log
            if (array_key_exists($key, $originalData)) {
                $oldValuesForLog[$key] = $originalData[$key];
                $newValuesForLog[$key] = $newValue;
            } else {
                $oldValuesForLog[$key] = null;
                $newValuesForLog[$key] = $newValue;
            }

            if (in_array($key, $excludedFromGenericLogMessage)) {
                continue;
            }

            $oldValue = $originalData[$key] ?? null;
            $oldValueString = is_array($oldValue) ? json_encode($oldValue) : (string) $oldValue;
            $newValueString = is_array($newValue) ? json_encode($newValue) : (string) $newValue;
            $logDetailsParts[] = "{$key} changed from \"{$oldValueString}\" to \"{$newValueString}\"";
        }

        // Handle batch changes
        if ($request->has('batch_ids') && (array_diff($originalBatchIds, $newBatchIds) || array_diff($newBatchIds, $originalBatchIds))) {
            $currentBatchNames = $member->batches->pluck('name')->implode(', ');
            if (empty($currentBatchNames)) $currentBatchNames = 'N/A';
            $logDetailsParts[] = "Batches changed from [{$originalBatchNames}] to [{$currentBatchNames}]";
            
            $oldValuesForLog['batch_ids'] = $originalBatchIds;
            $newValuesForLog['batch_ids'] = $newBatchIds;
        }

        $detailsMessage = "Member \"{$member->name}\" was updated";
        if (!empty($logDetailsParts)) {
            $detailsMessage .= ', ' . implode(', ', $logDetailsParts);
        }

        // Log the member update
        $this->logMemberAction(
            'Member Updated',
            $member,
            $detailsMessage,
            $oldValuesForLog,
            $newValuesForLog
        );

        // Reload the member with its active batches, qualifying column names
        $member->load([
            'batches' => function ($query) {
                $query->where('batches.status', 'active')
                      ->select('batches.id', 'batches.name', 'batches.program_id');
            },
            'batches.program:id,name'
        ]);

        $formattedMember = [
            'id' => $member->id,
            'name' => $member->name,
            'email' => $member->email,
            'mobile' => $member->mobile,
            'status' => $member->status,
            'created_at' => $member->created_at,
            'updated_at' => $member->updated_at,
            'batches' => $member->batches->map(function ($batch) {
                return [
                    'id' => $batch->id,
                    'name' => $batch->name,
                    'program' => $batch->program ? [
                        'id' => $batch->program->id,
                        'name' => $batch->program->name,
                    ] : null,
                ];
            }),
        ];

        return response()->json(['message' => 'Member updated successfully', 'data' => $formattedMember]);
    }

    /**
     * Remove the specified member from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        $member = Member::with('batches')->find($id);
        
        if (!$member) {
            return response()->json(['message' => 'Member not found'], 404);
        }

        // Store member data for logging
        $memberData = $member->toArray();
        $memberName = $member->name;

        $member->batches()->detach();
        $member->delete();

        // Log the member deletion
        $this->logMemberAction(
            'Member Deleted',
            $member,
            "Member \"{$memberName}\" was deleted",
            $memberData,
            null
        );

        return response()->json(['message' => 'Member deleted successfully']);
    }
    
    /**
     * Get all active batches for a specific program.
     *
     * @param int $programId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getBatchesByProgram($programId)
    {
        $batches = Batch::select('id', 'name', 'program_id') // No ambiguity here as it's a direct query on Batch
            ->where('program_id', $programId)
            ->where('status', 'active')
            ->get();
        
        if ($batches->isEmpty()) {
            $programExists = Program::where('id', $programId)->exists();
            if (!$programExists) {
                return response()->json(['message' => 'Program not found'], 404);
            }
        }
        
        return response()->json(['data' => $batches]);
    }

    public function togglePauseAttendance(Request $request, Member $member) // Using route model binding
    {
        $validator = Validator::make($request->all(), [
            'action' => 'required|in:pause,resume',
            'pause_reason' => 'nullable|string|max:500|required_if:action,pause',
            'pause_end_date' => 'nullable|date_format:Y-m-d|after_or_equal:today|required_if:action,pause',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            $oldValues = [
                'excused_until' => $member->excused_until ? Carbon::parse($member->excused_until)->format('Y-m-d') : null,
                'excuse_reason' => $member->excuse_reason,
            ];
            $logAction = '';
            $logDetails = '';

            if ($request->action === 'pause') {
                $member->excused_until = Carbon::parse($request->pause_end_date)->format('Y-m-d');
                $member->excuse_reason = $request->pause_reason;
                $logAction = 'Member Attendance Paused';
                $logDetails = "Attendance for member \"{$member->name}\" paused until " . Carbon::parse($request->pause_end_date)->format('Y-m-d') . " due to: \"{$request->pause_reason}\".";
            } else { // Resuming
                $member->excused_until = null;
                $member->excuse_reason = null;
                $logAction = 'Member Attendance Resumed';
                $logDetails = "Attendance for member \"{$member->name}\" resumed.";
            }
            $member->updated_by = Auth::id();
            $member->save();

            $newValues = [
                'excused_until' => $member->excused_until ? Carbon::parse($member->excused_until)->format('Y-m-d') : null,
                'excuse_reason' => $member->excuse_reason,
            ];

            $this->logAttendanceAction(
                $logAction,
                $member,
                $logDetails,
                $oldValues,
                $newValues
            );

            DB::commit();

            $member->load(['batches.program']);

            // Constructing an 'effective_status' for the response.
            // The frontend will primarily use the 'excused_until' date for its logic.
            $responseData = $member->toArray(); // Convert model to array to add custom key

            if ($member->excused_until) {
                // If excused_until is today or any future date, consider them paused for display.
                // Carbon::parse($member->excused_until)->endOfDay() ensures the entire day is covered.
                if (Carbon::now()->lte(Carbon::parse($member->excused_until)->endOfDay())) {
                    $responseData['effective_display_status'] = 'paused';
                } else {
                    // If excused_until is in the past, they are no longer paused by this excuse.
                    $responseData['effective_display_status'] = $member->status;
                }
            } else {
                $responseData['effective_display_status'] = $member->status;
            }


            return response()->json([
                'message' => 'Member attendance pause status updated successfully.',
                'data' => $responseData
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating member attendance pause for member ID ' . $member->id . ': ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['message' => 'Failed to update member pause status. Please try again.', 'error' => $e->getMessage()], 500);
        }
    }


    
}
