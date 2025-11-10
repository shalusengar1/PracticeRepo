<?php

namespace App\Http\Controllers\Batch;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Batch;
use App\Models\Program;
use App\Models\Partner;
use App\Models\Venue;
use App\Models\VenueSpot;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use App\Traits\LogsActivity;
use Illuminate\Support\Facades\Auth;

class BatchController extends Controller
{
    use LogsActivity;

    public function index()
    {
        try {
            $query = Batch::query()
                ->with([
                    'program:id,name',
                    'venue:venue_id,venue_name,venue_image',
                    'venueSpot:venue_spot_id,spot_name,spot_image',
                    'partners:id,name'
                ])
                ->withCount('members as member_count');

            // Handle search
            if ($search = request()->query('search')) {
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('type', 'like', "%{$search}%")
                      ->orWhere('status', 'like', "%{$search}%")
                      ->orWhereHas('program', function($q) use ($search) {
                          $q->where('name', 'like', "%{$search}%");
                      })
                      ->orWhereHas('partners', function($q) use ($search) {
                          $q->where('name', 'like', "%{$search}%");
                      });
                });
            }

            // Apply sorting
            $sortField = request()->query('sort_by', 'created_at');
            $sortOrder = request()->query('sort_order', 'desc');
            $query->orderBy($sortField, $sortOrder);

            // Check for pagination flag
            $paginate = filter_var(request()->query('paginate', true), FILTER_VALIDATE_BOOLEAN);

            if ($paginate) {
                // Apply pagination
                $perPage = request()->query('per_page', 10);
                $batches = $query->paginate($perPage);
                return response()->json($batches);
            } else {
                // Return all results
                $batches = $query->get();
                return response()->json($batches);
            }
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch batches',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getProgramedBatches(Request $request)
    {
        $batches = Batch::where('status', 'active')
        ->with('program:id,name') 
        ->select('id', 'name', 'program_id') 
        ->get();
        
        $formattedBatches = $batches->map(function ($batch) {
            return [
                'id' => $batch->id,
                'name' => $batch->name,
                'program_id' => $batch->program_id,
                'program_name' => $batch->program ? $batch->program->name : null,
            ];
        });
        
        return response()->json(['data' => $formattedBatches]);
    }

    public function store(Request $request)
    {
        $this->formatTimeWithSeconds($request, 'session_start_time');
        $this->formatTimeWithSeconds($request, 'session_end_time');

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'program_id' => 'required|exists:programs,id',
            'type' => 'required|in:fixed,recurring',
            'venue_id' => 'nullable|exists:venues,venue_id',
            'venue_spot_id' => 'nullable|exists:venue_spots,venue_spot_id',
            'capacity' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'session_start_time' => 'nullable|date_format:H:i:s',
            'session_end_time' => 'nullable|date_format:H:i:s|after:session_start_time',
            'no_of_sessions' => 'nullable|integer|min:0',
            'schedule_pattern' => 'nullable|string',
            'amount' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|size:3',
            'discount_available' => 'boolean',
            'discount_percentage' => 'nullable|integer|min:0|max:100',
            'status' => 'nullable|in:active,inactive,completed,cancelled',
            'progress' => 'nullable|integer|min:0|max:100',
            'fee_configuration' => 'nullable|array',
            'partner_ids' => 'nullable|array',
            'partner_ids.*' => 'exists:partners,id',
            'selected_session_dates' => 'nullable|array',
            'selected_session_dates.*' => 'date|after_or_equal:start_date|before_or_equal:end_date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }
        
        $batchData = $request->except('partner_ids');
        // Assuming created_by and updated_by are handled by model events or fillable
        // If not, set them here:
        // $batchData['created_by'] = Auth::id();
        // $batchData['updated_by'] = Auth::id();


        $batch = Batch::create($batchData);

        if ($request->has('partner_ids') && is_array($request->partner_ids)) {
            $batch->partners()->sync($request->partner_ids);
        }

        $this->_generateSessions($batch);

        $this->logBatchAction(
            'Batch Created',
            $batch,
            "Batch \"{$batch->name}\" was created",
            null, 
            $batch->load('partners')->toArray() 
        );

        $batch->load([
            'program:id,name',
            'venue:venue_id,venue_name,venue_image',
            'venueSpot:venue_spot_id,spot_name,spot_image',
            'partners:id,name',
            'batchSessions'
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Batch created successfully',
            'data' => $batch
        ], 201);
    }

    public function show($id)
    {
        $batch = Batch::with([
            'program:id,name',
            'venue:venue_id,venue_name,venue_image',
            'venueSpot:venue_spot_id,spot_name,spot_image',
            'partners:id,name,specialization',
            'batchSessions'
        ])->findOrFail($id);

        $venueSpots = [];
        if ($batch->venue_id) {
            $venueSpots = VenueSpot::where('venue_id', $batch->venue_id)
                ->select('venue_spot_id', 'spot_name', 'capacity', 'spot_image')
                ->orderBy('spot_name')
                ->get();
        }

        return response()->json([
            'status' => 'success',
            'data' => $batch,
            'venue_spots' => $venueSpots
        ]);
    }

    public function update(Request $request, $id)
    {
        $batch = Batch::with(['partners', 'program', 'venue', 'venueSpot'])->findOrFail($id);

        $originalBatchData = $batch->getOriginal();
        $originalPartnerIds = $batch->partners->pluck('id')->toArray();
        
        // Store original related models for name comparison
        $originalProgram = $batch->program;
        $originalVenue = $batch->venue;
        $originalVenueSpot = $batch->venueSpot;
        $originalPartnerNames = $batch->partners->pluck('name')->implode(', ');
        if (empty($originalPartnerNames)) $originalPartnerNames = 'N/A';


        $this->formatTimeWithSeconds($request, 'session_start_time');
        $this->formatTimeWithSeconds($request, 'session_end_time');

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'program_id' => 'sometimes|required|exists:programs,id',
            'type' => 'sometimes|required|in:fixed,recurring',
            'venue_id' => 'nullable|exists:venues,venue_id',
            'venue_spot_id' => 'nullable|exists:venue_spots,venue_spot_id',
            'capacity' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'session_start_time' => 'nullable|date_format:H:i:s',
            'session_end_time' => 'nullable|date_format:H:i:s|after:session_start_time',
            'no_of_sessions' => 'nullable|integer|min:0',
            'schedule_pattern' => 'nullable|string',
            'amount' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|size:3',
            'discount_available' => 'boolean',
            'discount_percentage' => 'nullable|integer|min:0|max:100',
            'status' => 'nullable|in:active,inactive,completed,cancelled',
            'progress' => 'nullable|integer|min:0|max:100',
            'fee_configuration' => 'nullable|array',
            'partner_ids' => 'nullable|array',
            'partner_ids.*' => 'exists:partners,id',
            'selected_session_dates' => 'nullable|array', 
            'selected_session_dates.*' => 'date|after_or_equal:start_date|before_or_equal:end_date', // Validate each date if array is present
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $batchData = $request->except('partner_ids');
        // Assuming updated_by is handled by model events or fillable
        // If not, set it here:
        // $batchData['updated_by'] = Auth::id();

        $venueChanged = $request->has('venue_id') && $batch->venue_id != $request->venue_id;

        if ($venueChanged && !$request->filled('venue_spot_id')) {
            $batchData['venue_spot_id'] = null;
        }

        $sessionFields = ['start_date', 'end_date', 'session_start_time', 'session_end_time', 'no_of_sessions', 'schedule_pattern', 'type'];

        $normalizeValue = function($value, $field) {
            if (is_null($value)) return null;
            
            return match(true) {
                in_array($field, ['start_date', 'end_date']) => date('Y-m-d', strtotime($value)),
                in_array($field, ['session_start_time', 'session_end_time']) => date('H:i:s', strtotime($value)),
                $field === 'no_of_sessions' => (int) $value,
                default => (string) $value
            };
        };

        // Check for session regeneration BEFORE updating the batch
        $shouldRegenerateSessions = false;
        foreach ($sessionFields as $field) {
            if ($request->has($field)) {
                $oldValue = $normalizeValue($batch->getAttribute($field), $field);
                $newValue = $normalizeValue($request->input($field), $field);
                
                if ($oldValue !== $newValue) {
                    $shouldRegenerateSessions = true;
                    break;
                }
            }
        }
        // Now perform the update
        $batch->update($batchData);

        // Then handle session regeneration if needed
        if ($shouldRegenerateSessions) {
            $batch->batchSessions()->delete();
            $this->_generateSessions($batch->fresh());
        }

        $newPartnerIds = $request->input('partner_ids', []);
        if ($request->has('partner_ids')) { 
            $batch->partners()->sync($newPartnerIds);
        }
        
        // Reload relations to get updated names
        $batch->load(['program', 'venue', 'venueSpot', 'partners']);

        // Logging
        $changedAttributes = $batch->getChanges();
        $logDetailsParts = [];
        $oldValuesForLog = [];
        $newValuesForLog = [];

        // Exclude IDs of related models and complex fields from generic message part generation,
        // as they will be handled specifically for name-based logging.
        $excludedFromGenericLogMessage = ['updated_at', 'created_at', 'updated_by', 'created_by', 'program_id', 'venue_id', 'venue_spot_id', 'fee_configuration', 'partner_ids'];

        foreach ($changedAttributes as $key => $newValue) {
            // Always log old/new values for the structured log
            if (array_key_exists($key, $originalBatchData)) {
                 $oldValuesForLog[$key] = $originalBatchData[$key];
                 $newValuesForLog[$key] = $newValue;
            } else { // Attribute was added
                 $oldValuesForLog[$key] = null;
                 $newValuesForLog[$key] = $newValue;
            }

            if (in_array($key, $excludedFromGenericLogMessage)) {
                continue;
            }
            
            $oldValue = $originalBatchData[$key] ?? null;
            $oldValueString = is_array($oldValue) ? json_encode($oldValue) : (string) $oldValue;
            $newValueString = is_array($newValue) ? json_encode($newValue) : (string) $newValue;
            $logDetailsParts[] = " {$key} changed from \"{$oldValueString}\" to \"{$newValueString}\"";
        }

        // Specific logging for related model name changes
        if (($originalBatchData['program_id'] ?? null) != $batch->program_id) {
            $logDetailsParts[] = "Program changed from \"".($originalProgram->name ?? 'N/A')."\" to \"".($batch->program->name ?? 'N/A')."\"";
        }
        if (($originalBatchData['venue_id'] ?? null) != $batch->venue_id) {
            $logDetailsParts[] = "Venue changed from \"".($originalVenue->venue_name ?? 'N/A')."\" to \"".($batch->venue->venue_name ?? 'N/A')."\"";
        }
        if (($originalBatchData['venue_spot_id'] ?? null) != $batch->venue_spot_id) {
            $logDetailsParts[] = "Venue Spot changed from \"".($originalVenueSpot->spot_name ?? 'N/A')."\"  to \"".($batch->venueSpot->spot_name ?? 'N/A')."\"";
        }

        // Only include partner information in logs if partners are being modified
        if ($request->has('partner_ids') && (array_diff($originalPartnerIds, $newPartnerIds) || array_diff($newPartnerIds, $originalPartnerIds))) {
            $currentPartnerNames = $batch->partners->pluck('name')->implode(', ');
            if (empty($currentPartnerNames)) $currentPartnerNames = 'N/A';
            $logDetailsParts[] = "Partners changed from [{$originalPartnerNames}] to [{$currentPartnerNames}]";
            // Ensure partner_ids are in the structured log if not already captured by getChanges()
            $oldValuesForLog['partner_ids'] = $originalPartnerIds;
            $newValuesForLog['partner_ids'] = $newPartnerIds;
        }
        
        // if (array_key_exists('fee_configuration', $changedAttributes)) {
        //     $originalFeeConfig = isset($originalBatchData['fee_configuration']) ? json_encode($originalBatchData['fee_configuration']) : 'N/A';
        //     $newFeeConfig = isset($batch->fee_configuration) ? json_encode($batch->fee_configuration) : 'N/A';
        //     $logDetailsParts[] = "Fee configuration updated from {$originalFeeConfig} to {$newFeeConfig}";
        // }


        // if ($shouldRegenerateSessions) {
        //     $logDetailsParts[] = "Sessions were regenerated due to schedule changes.";
        // }
        
        $detailsMessage = "Batch \"{$batch->name}\" was updated ,";
        if (!empty($logDetailsParts)) {
            $detailsMessage .= implode(', ', $logDetailsParts);
        }

        if (!empty($oldValuesForLog) || $shouldRegenerateSessions) {
            $this->logBatchAction(
                'Batch Updated',
                $batch,
                $detailsMessage,
                $oldValuesForLog,
                $newValuesForLog
            );
        }

        $updatedBatch = Batch::with([
            'program:id,name',
            'venue:venue_id,venue_name,venue_image',
            'venueSpot:venue_spot_id,spot_name,spot_image',
            'partners:id,name,specialization',
            'batchSessions'
        ])->find($batch->id);

        return response()->json([
            'status' => 'success',
            'message' => 'Batch updated successfully',
            'data' => $updatedBatch
        ]);
    }

    public function destroy($id)
    {
        $batch = Batch::with('partners')->findOrFail($id);
        $batchDataForLog = $batch->toArray(); 
        $batchName = $batch->name;
        
        $batch->batchSessions()->delete();
        $batch->partners()->detach();
        $batch->members()->detach(); 
        $batch->delete(); 

        $this->logBatchAction(
            'Batch Deleted',
            $batch, 
            "Batch \"{$batchName}\" was deleted",
            $batchDataForLog, 
            null 
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Batch deleted successfully'
        ]);
    }

    public function getPrograms()
    {
        $programs = Program::select('id', 'name')->orderBy('name')->get();
        return response()->json(['status' => 'success', 'data' => $programs]);
    }

    public function getPartners()
    {
        $partners = Partner::select('id', 'name', 'specialization')->orderBy('name')->get();
        return response()->json(['status' => 'success', 'data' => $partners]);
    }

    public function getVenues()
    {
        $venues = Venue::select('venue_id', 'venue_name')->orderBy('venue_name')->get();
        return response()->json(['status' => 'success', 'data' => $venues]);
    }

    public function getVenueSpots($venueId)
    {
        $spots = VenueSpot::where('venue_id', $venueId)
            ->select('venue_spot_id', 'spot_name', 'capacity')
            ->orderBy('spot_name')
            ->get();
        return response()->json(['status' => 'success', 'data' => $spots]);
    }


    public function getBatchesWithMembersPartners()
    {
        try {
            $batches = Batch::select('id', 'name', 'start_date', 'end_date', 'status') // Select specific fields
                ->where('status', 'active') // Or any other criteria for batches you want to fetch
                ->with([
                    'members:id,name,email,status,excused_until,excuse_reason', // Specify fields for members
                    'partners:id,name,email,status,excused_until,excuse_reason' // Specify fields for partners
                ])
                ->orderBy('name', 'asc')
                ->get();

            return response()->json([
                'message' => 'Batches with members and partners retrieved successfully.', // Optional message
                'data' => $batches
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching batches with members/partners: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to retrieve batches', 'error' => $e->getMessage()], 500);
        }
    }

    private function _generateSessions(Batch $batch)
    {
        if (!$batch->start_date) {
            Log::warning("Session generation skipped for batch {$batch->id}: Missing start date");
            return;
        }
        
        // The start_date is already cast to Carbon due to the date cast in the Batch model
        $startDate = $batch->start_date;
        // The end_date is already cast to Carbon or null due to the date cast in the Batch model
        $endDate = $batch->end_date;
        
        $startTime = $batch->session_start_time;
        $endTime = $batch->session_end_time;
        $sessionCount = $batch->no_of_sessions;
        $schedulePattern = $batch->schedule_pattern;

        if (is_null($sessionCount) || $sessionCount <= 0 || empty($startTime) || empty($endTime)) {
            Log::info("Session generation skipped for batch {$batch->id}: Missing required parameters (sessionCount, startTime, or endTime).");
            return;
        }

        // Handle manual session dates if they exist
        if ($schedulePattern === 'manual' && !empty($batch->selected_session_dates)) {
            foreach ($batch->selected_session_dates as $sessionDate) {
                $batch->batchSessions()->create([
                    'date' => $sessionDate,
                    'start_time' => $startTime,
                    'end_time' => $endTime,
                    'status' => 'scheduled',
                ]);
            }
            return;
        }

        // Handle recurring patterns
        $currentDate = $startDate->copy();
        $sessionsCreated = 0;
        $pattern = strtoupper($schedulePattern);

        while ($sessionsCreated < $sessionCount && (!$endDate || $currentDate->lte($endDate))) {
            $shouldCreateSession = false;
            if ($pattern === 'MWF' && ($currentDate->isMonday() || $currentDate->isWednesday() || $currentDate->isFriday())) {
                $shouldCreateSession = true;
            } elseif ($pattern === 'TTS' && ($currentDate->isTuesday() || $currentDate->isThursday() || $currentDate->isSaturday())) {
                $shouldCreateSession = true;
            } elseif ($pattern === 'WEEKEND' && ($currentDate->isSaturday() || $currentDate->isSunday())) {
                $shouldCreateSession = true;
            } elseif ($pattern === 'DAILY') {
                $shouldCreateSession = true;
            }
            elseif (strtoupper($currentDate->format('l')) === $pattern) {
                $shouldCreateSession = true;
            }

            if ($shouldCreateSession) {
                $batch->batchSessions()->create([
                    'date' => $currentDate->toDateString(),
                    'start_time' => $startTime,
                    'end_time' => $endTime,
                    'status' => 'scheduled',
                ]);
                $sessionsCreated++;
            }

            if ($sessionsCreated >= $sessionCount) {
                break;
            }
            $currentDate->addDay();
        }

        if ($sessionsCreated < $sessionCount) {
            Log::warning("Could not create the requested number of sessions for batch {$batch->id}. Requested: {$sessionCount}, Created: {$sessionsCreated}. End date: " . ($endDate ? $endDate->toDateString() : 'N/A') . ", Pattern: {$schedulePattern}. Check start/end dates and pattern.");
        }
    }

    private function formatTimeWithSeconds(Request $request, string $fieldName): void
    {
        if ($request->has($fieldName)) {
            $timeValue = $request->input($fieldName);
            if (is_string($timeValue) && preg_match('/^\d{2}:\d{2}$/', $timeValue)) {
                $request->merge([$fieldName => $timeValue . ':00']);
            }
        }
    }
}
