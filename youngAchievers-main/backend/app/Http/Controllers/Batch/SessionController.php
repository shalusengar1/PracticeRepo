<?php

namespace App\Http\Controllers\Batch;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Batch;
use App\Models\BatchSession;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;
use App\Traits\LogsActivity;

class SessionController extends Controller
{
    use LogsActivity;

    /**
     * Get sessions by batch ID with detailed information
     */
    public function getByBatchId($batchId)
    {
        $batch = Batch::with(['program:id,name', 'venue:venue_id,venue_name', 'venueSpot:venue_spot_id,spot_name'])
            ->findOrFail($batchId);
        
        $sessions = $batch->batchSessions()->orderBy('date', 'asc')->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'batch' => [
                    'id' => $batch->id,
                    'name' => $batch->name,
                    'program_name' => $batch->program ? $batch->program->name : null,
                    'venue_name' => $batch->venue ? $batch->venue->venue_name : null,
                    'venue_image' => $batch->venue ? $batch->venue->venue_image : null,
                    'venue_spot_name' => $batch->venueSpot ? $batch->venueSpot->spot_name : null,
                    'spot_image' => $batch->venueSpot ? $batch->venueSpot->spot_image : null,
                ],
                'sessions' => $sessions
            ],
        ]);
    }

    /**
     * Add a new session
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'batch_id' => 'required|exists:batches,id',
            'title' => 'required|string|max:255',
            'date' => 'required|date',
            'start_time' => 'required|date_format:H:i:s',
            'end_time' => 'required|date_format:H:i:s|after:start_time',
            'description' => 'nullable|string',
            'status' => 'required|in:scheduled,completed,cancelled'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $session = BatchSession::create($request->all());

        // Log session creation
        $this->logBatchSessionAction(
            'Session Created',
            $session,
            "Session \"{$session->title}\" was created for batch #{$session->batch_id}",
            null,
            $session->toArray()
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Session created successfully',
            'data' => $session
        ], 201);
    }

    /**
     * Update a session
     */
    public function update(Request $request, $sessionId)
    {
        $session = BatchSession::findOrFail($sessionId);

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'date' => 'sometimes|required|date',
            'start_time' => 'sometimes|required|date_format:H:i:s',
            'end_time' => 'sometimes|required|date_format:H:i:s|after:start_time',
            'description' => 'nullable|string',
            'status' => 'sometimes|required|in:scheduled,completed,cancelled'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Store original data for logging
        $originalData = $session->toArray();

        $session->update($request->all());

        // Log session update
        $this->logBatchSessionAction(
            'Session Updated',
            $session,
            "Session \"{$session->title}\" was updated",
            $originalData,
            $session->toArray()
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Session updated successfully',
            'data' => $session
        ]);
    }

    /**
     * Delete a session
     */
    public function destroy($sessionId)
    {
        $session = BatchSession::findOrFail($sessionId);
        
        // Store session data for logging
        $sessionData = $session->toArray();
        $sessionTitle = $session->title;

        $session->delete();

        // Log session deletion
        $this->logBatchSessionAction(
            'Session Deleted',
            $session,
            "Session \"{$sessionTitle}\" was deleted",
            $sessionData,
            null
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Session deleted successfully'
        ]);
    }
    
    /**
     * Reschedule a session
     */
    public function reschedule(Request $request, $sessionId)
    {
        $session = BatchSession::findOrFail($sessionId);

        $validator = Validator::make($request->all(), [
            'date' => 'required|date',
            'start_time' => 'required|date_format:H:i:s',
            'end_time' => 'required|date_format:H:i:s|after:start_time',
            'notes' => 'required|string',
            'status' => 'sometimes|string|in:scheduled,completed,cancelled,rescheduled'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check for time conflicts with other sessions on the same date
        $conflictingSession = BatchSession::where('batch_id', $session->batch_id)
            ->where('id', '!=', $sessionId) // Exclude current session
            ->where('date', $request->date)
            ->where(function ($query) use ($request) {
                // Check if the new time range overlaps with existing sessions
                // Overlap occurs when:
                // 1. New start time is before existing end time AND new end time is after existing start time
                $query->where(function ($q) use ($request) {
                    $q->where('start_time', '<', $request->end_time)
                      ->where('end_time', '>', $request->start_time);
                });
            })
            ->first();

        if ($conflictingSession) {
            // Get the session number for better user experience
            $sessionNumber = BatchSession::where('batch_id', $session->batch_id)
                ->where('id', '<=', $conflictingSession->id)
                ->count();
            
            return response()->json([
                'status' => 'error',
                'message' => 'Time conflict detected',
                'description' => "This time conflicts with Session {$sessionNumber} ({$conflictingSession->start_time} - {$conflictingSession->end_time}) on the same day. Please choose a different time.",
                'conflicting_session' => [
                    'id' => $conflictingSession->id,
                    'session_number' => $sessionNumber,
                    'start_time' => $conflictingSession->start_time,
                    'end_time' => $conflictingSession->end_time
                ]
            ], 422);
        }

        // Store original data for logging
        $originalData = $session->toArray();

        // Update session with new schedule and status
        $session->update([
            'date' => $request->date,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'notes' => $request->notes,
            'status' => $request->status ?? 'rescheduled' // Default to 'rescheduled' if not provided
        ]);

        // Log session rescheduling with detailed message
        $this->logBatchSessionAction(
            'Session Rescheduled',
            $session,
            "Session \"{$session->title}\" was rescheduled. " . 
            "Previous schedule: {$originalData['date']} ({$originalData['start_time']} - {$originalData['end_time']}) " .
            "New schedule: {$request->date} ({$request->start_time} - {$request->end_time}). " .
            "Reason: {$request->notes}",
            $originalData,
            $session->toArray()
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Session rescheduled successfully',
            'data' => $session
        ]);
    }
}
