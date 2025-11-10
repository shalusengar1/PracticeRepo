<?php

namespace App\Http\Controllers;

use App\Models\ActionLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ActivityLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ActionLog::with('performedBy');

        // Handle sort order
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy('created_at', $sortOrder);

        // Filter by category
        if ($request->filled('category') && $request->category !== 'all') {
            $query->byCategory($request->category);
        }

        // Filter by date range
        if ($request->filled('date_range') && $request->date_range !== 'all') {
            $dateRange = $this->getDateRange($request->date_range);
            if ($dateRange) {
                $query->byDateRange($dateRange['start'], $dateRange['end']);
            }
        }

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('action', 'like', "%{$search}%")
                  ->orWhere('user', 'like', "%{$search}%")
                  ->orWhere('target', 'like', "%{$search}%")
                  ->orWhere('details', 'like', "%{$search}%");
            });
        }

        $logs = $query->paginate($request->get('per_page', 15));

        return response()->json($logs);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'action' => 'required|string',
            'user' => 'required|string',
            'target' => 'required|string',
            'category' => 'required|string',
            'details' => 'required|string',
            'old_values' => 'nullable|array',
            'new_values' => 'nullable|array',
            'entity_type' => 'nullable|string',
            'entity_id' => 'nullable|integer'
        ]);

        $log = ActionLog::create([
            'action' => $request->action,
            'user' => $request->user,
            'target' => $request->target,
            'category' => $request->category,
            'details' => $request->details,
            'ip_address' => $request->ip(),
            'old_values' => $request->old_values,
            'new_values' => $request->new_values,
            'performed_by' => auth('sanctum')->id(),
            'entity_type' => $request->entity_type,
            'entity_id' => $request->entity_id
        ]);

        return response()->json($log, 201);
    }

    private function getDateRange(string $range): ?array
    {
        $now = now();
        
        return match ($range) {
            'today' => [
                'start' => $now->copy()->startOfDay(),
                'end' => $now->copy()->endOfDay()
            ],
            'yesterday' => [
                'start' => $now->copy()->subDay()->startOfDay(),
                'end' => $now->copy()->subDay()->endOfDay()
            ],
            'week' => [
                'start' => $now->copy()->subWeek(),
                'end' => $now
            ],
            'month' => [
                'start' => $now->copy()->subMonth(),
                'end' => $now
            ],
            default => null
        };
    }
}