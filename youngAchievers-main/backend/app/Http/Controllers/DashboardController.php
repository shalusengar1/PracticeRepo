<?php

namespace App\Http\Controllers;

use App\Models\Batch;
use App\Models\Member;
use App\Models\Venue;
use App\Models\Program;
use App\Models\Partner;
use App\Models\BatchSession;
use App\Models\ActionLog;
use App\Models\AdminUser;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function getStats(): JsonResponse
    {
        $now = Carbon::now();

        // Get basic counts
        $stats = [
            'total_users' => AdminUser::count(),
            'total_batches' => Batch::count(),
            'active_venues' => Venue::where('status', 'active')->count(),
            'upcoming_events' => BatchSession::where('date', '>=', $now->format('Y-m-d'))->count(),
            
            'total_programs' => Program::count(),
            'active_partners' => Partner::where('status', 'active')->count(),
            'total_sessions' => BatchSession::count(),
            'completed_sessions' => BatchSession::where('date', '<', $now->format('Y-m-d'))->count(),
                        
            // Activity metrics
            'recent_activities' => ActionLog::with('performedBy')
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get()
        ];

        // Define month boundaries for growth calculation
        $currentMonthStart = $now->copy()->startOfMonth();
        $previousMonthStart = $now->copy()->subMonthNoOverflow()->startOfMonth(); // Use subMonthNoOverflow to handle month ends correctly
        $previousMonthEnd = $now->copy()->subMonthNoOverflow()->endOfMonth();
        
        // Calculate trends
        $currentMonthUsers = AdminUser::where('created_at', '>=' , $currentMonthStart)->count();
        $previousMonthUsers = AdminUser::whereBetween('created_at', [$previousMonthStart, $previousMonthEnd])->count();
        
        $currentMonthBatches = Batch::whereBetween('created_at', [$currentMonthStart, $now])->count();
        $previousMonthBatches = Batch::whereBetween('created_at', [$previousMonthStart, $previousMonthEnd])->count();

        // Add new member and batch counts for the current month to stats
        // $stats['new_members'] = $currentMonthUsers;
        $stats['new_batches'] = $currentMonthBatches;

        // Calculate percentage changes
        $stats['user_growth'] = $previousMonthUsers > 0 
            ? (($currentMonthUsers - $previousMonthUsers) / $previousMonthUsers) * 100 
            : 0;
        
        $stats['batch_growth'] = $previousMonthBatches > 0 
            ? (($currentMonthBatches - $previousMonthBatches) / $previousMonthBatches) * 100 
            : 0;

        return response()->json($stats);
    }
} 