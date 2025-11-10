<?php

namespace App\Http\Controllers\Batch;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Batch;
use Carbon\Carbon;

class BatchReportController extends Controller
{
    /**
     * Get a comprehensive report for a specific batch
     */
    public function getBatchReport($batchId)
    {
        $batch = Batch::with(['program:id,name', 'venue:venue_id,venue_name', 'batchSessions'])
            ->findOrFail($batchId);
            
        $sessionCount = $batch->batchSessions->count();
        $studentCount = 2;
        $occupancyRate = $batch->capacity > 0 ? ($studentCount / $batch->capacity) * 100 : 0;
        
        // Calculate completed sessions
        $completedSessions = $batch->batchSessions->where('status', 'completed')->count();
        $completionRate = $sessionCount > 0 ? ($completedSessions / $sessionCount) * 100 : 0;
        
        // Calculate upcoming sessions
        $today = Carbon::today();
        $upcomingSessions = $batch->batchSessions->filter(function ($session) use ($today) {
            return Carbon::parse($session->date)->gte($today) && $session->status === 'scheduled';
        })->count();
        
        $report = [
            'batch_name' => $batch->name,
            'program_name' => $batch->program ? $batch->program->name : null,
            'venue_name' => $batch->venue ? $batch->venue->venue_name : null,
            'venue_spot_name' => $batch->spot ? $batch->spot->spot_name : null,
            'status' => $batch->status,
            'start_date' => $batch->start_date,
            'end_date' => $batch->end_date,
            'capacity' => $batch->capacity,
            'student_count' => $studentCount,
            'occupancy_rate' => round($occupancyRate, 2),
            'session_count' => $sessionCount,
            'completed_sessions' => $completedSessions,
            'completion_rate' => round($completionRate, 2),
            'upcoming_sessions' => $upcomingSessions,
            'amount' => $batch->amount,
            'currency' => $batch->currency,
        ];

        return response()->json([
            'status' => 'success',
            'data' => $report,
        ]);
    }
    
    /**
     * Get a summary of all batches for reporting purposes
     */
    public function getBatchesSummary()
    {
        $batches = Batch::with(['program:id,name', 'sessions'])
            ->select('id', 'name', 'program_id', 'capacity', 'start_date', 'end_date', 'status', 'amount')
            ->get();
            
        $summaries = $batches->map(function ($batch) {
            $sessionCount = $batch->batchSessions->count();
            $completedSessions = $batch->batchSessions->where('status', 'completed')->count();
            $completionRate = $sessionCount > 0 ? ($completedSessions / $sessionCount) * 100 : 0;
            
            return [
                'id' => $batch->id,
                'name' => $batch->name,
                'program_name' => $batch->program ? $batch->program->name : null,
                'status' => $batch->status,
                'session_count' => $sessionCount,
                'completed_sessions' => $completedSessions,
                'completion_rate' => round($completionRate, 2),
                'start_date' => $batch->start_date,
                'end_date' => $batch->end_date,
            ];
        });
        
        return response()->json([
            'status' => 'success',
            'data' => $summaries,
        ]);
    }
}
