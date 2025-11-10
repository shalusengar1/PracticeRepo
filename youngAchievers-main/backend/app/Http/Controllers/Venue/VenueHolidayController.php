<?php

namespace App\Http\Controllers\Venue;

use App\Http\Controllers\Controller;
use App\Models\Venue;
use App\Models\VenueHoliday;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Log;
use App\Traits\LogsActivity;

class VenueHolidayController extends Controller
{
    use LogsActivity; 
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'venue_id' => 'required|exists:venues,venue_id',
                'name' => 'required|string|max:255',
                'holiday_type' => 'required|in:specific,recurring',
                'date' => 'nullable|date',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date',
                'recurring_day' => 'nullable|integer|between:0,6',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $data = $validator->validated();

            $venue = Venue::findOrFail($data['venue_id']);

            // Step 1: Check if a soft-deleted record exists
            $restored = $this->maybeRestoreSoftDeleted($data);

            if ($restored) {

                $this->logVenueAction(
                    'Venue Holiday Restored',
                    $venue,
                    "Holiday \"{$restored->name}\" was restored for venue \"{$venue->venue_name}\"",
                    ['status' => 'deleted'], // Conceptual old value
                    $restored->toArray()
                );

                return response()->json([
                    'message' => 'Existing holiday restored.',
                    'data' => $restored,
                ], 200);
            }

            // Step 2: Proceed with creation
            $holiday = VenueHoliday::safeCreate($data);

            $this->logVenueAction(
                'Venue Holiday Created',
                $venue,
                "Holiday \"{$holiday->name}\" ({$holiday->holiday_type}) was created for venue \"{$venue->venue_name}\"",
                null,
                $holiday->toArray()
            );

            return response()->json(['data' => $holiday], 201);

        } catch (\Exception $e) {
            Log::error('Error creating venue holiday: ' . $e->getMessage(), [
                'request' => $request->all(),
                'exception' => $e,
            ]);

            return response()->json([
                'message' => $e->getMessage() ?? 'Failed to create venue holiday. Please try again later.'
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * Store multiple holidays at once.
     */
    public function storeMultiple(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'venue_id' => 'required|exists:venues,venue_id',
                'holidays' => 'required|array|min:1|max:200', 
                'holidays.*.name' => 'required|string|max:255',
                'holidays.*.holiday_type' => 'required|in:specific,recurring',
                'holidays.*.date' => 'nullable|date',
                'holidays.*.start_date' => 'nullable|date',
                'holidays.*.end_date' => 'nullable|date',
                'holidays.*.recurring_day' => 'nullable|integer|between:0,6',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $data = $validator->validated();
            $venue = Venue::findOrFail($data['venue_id']);
            $holidays = $data['holidays'];
            $createdHolidays = [];
            $errors = [];
            $restoredCount = 0;

            foreach ($holidays as $index => $holidayData) {
                try {
                    // Add venue_id to each holiday
                    $holidayData['venue_id'] = $data['venue_id'];

                    // Check if a soft-deleted record exists
                    $restored = $this->maybeRestoreSoftDeleted($holidayData);

                    if ($restored) {
                        $createdHolidays[] = $restored;
                        $restoredCount++;
                    } else {
                        // Create new holiday
                        $holiday = VenueHoliday::safeCreate($holidayData);
                        $createdHolidays[] = $holiday;
                    }
                } catch (\Exception $e) {
                    $errors[] = [
                        'index' => $index,
                        'name' => $holidayData['name'],
                        'error' => $e->getMessage()
                    ];
                }
            }

            // Log the bulk action
            $actionDescription = count($createdHolidays) > 1 
                ? count($createdHolidays) . " holidays were created for venue \"{$venue->venue_name}\""
                : "1 holiday was created for venue \"{$venue->venue_name}\"";
            
            if ($restoredCount > 0) {
                $actionDescription .= " ({$restoredCount} restored from deleted state)";
            }

            $this->logVenueAction(
                'Venue Holidays Bulk Created',
                $venue,
                $actionDescription,
                null,
                ['created_count' => count($createdHolidays), 'restored_count' => $restoredCount]
            );

            $response = [
                'message' => count($createdHolidays) . ' holiday(s) created successfully.',
                'data' => $createdHolidays,
                'created_count' => count($createdHolidays),
                'restored_count' => $restoredCount
            ];

            if (!empty($errors)) {
                $response['errors'] = $errors;
                $response['partial_success'] = true;
            }

            return response()->json($response, 201);

        } catch (\Exception $e) {
            Log::error('Error creating multiple venue holidays: ' . $e->getMessage(), [
                'request' => $request->all(),
                'exception' => $e,
            ]);

            return response()->json([
                'message' => $e->getMessage() ?? 'Failed to create venue holidays. Please try again later.'
            ], $e->getCode() ?: 500);
        }
    }

    private function maybeRestoreSoftDeleted(array $data): ?VenueHoliday
    {
        $query = VenueHoliday::onlyTrashed()
            ->where('venue_id', $data['venue_id'])
            ->where('name', $data['name']);

        if (!empty($data['date'])) {
            $query->whereDate('date', $data['date']);
        } elseif (!empty($data['start_date']) && !empty($data['end_date'])) {
            $query->whereDate('start_date', $data['start_date'])
                ->whereDate('end_date', $data['end_date']);
        } elseif (isset($data['recurring_day'])) {
            $query->where('recurring_day', $data['recurring_day']);
        } else {
            return null;
        }

        $match = $query->first();

        if ($match) {
            $match->restore();
            $match->update($data); // Reapply data
            return $match;
        }

        return null;
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        try {

            $holiday = VenueHoliday::with('venue')->findOrFail($id);
            $venue = $holiday->venue; // Get the parent venue for logging
            $holidayDataForLog = $holiday->toArray();

            $holiday->delete(); // Soft delete

            // Log activity
            if ($venue) {
                $this->logVenueAction(
                    'Venue Holiday Deleted',
                    $venue,
                    "Holiday \"{$holidayDataForLog['name']}\" was deleted from venue \"{$venue->venue_name}\"",
                    $holidayDataForLog,
                    null // No new values for deletion
                );
            } else {
                // Fallback logging if venue relationship is somehow not loaded (should not happen with ::with('venue'))
                Log::warning('Venue relationship not loaded for holiday deletion logging.', ['holiday_id' => $id]);
                 $this->logActivity(
                    'Venue Holiday Deleted',
                    "Holiday ID: {$id}",
                    'venue_management', // General category
                    "Holiday \"{$holidayDataForLog['name']}\" was deleted.",
                    $holidayDataForLog,
                    null,
                    get_class($holiday),
                    $holiday->id
                );
            }

            return response()->json(null, 204); // 204 No Content for successful deletion
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Venue holiday not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error deleting venue holiday: ' . $e->getMessage(), [
                'holiday_id' => $id,
                'exception' => $e,
            ]);
            return response()->json(['message' => 'Failed to delete venue holiday. Please try again later.'], 500);
        }
    }

    /**
     * Get venue names and their associated holidays.
     */
public function getVenueNamesAndHolidays()
{
    try {
            $venuesWithHolidays = VenueHoliday::select('venue_holidays.*')
                ->whereHas('venue', function ($query) {
                    $query->where('status', 'active');
                })
                ->with(['venue' => function ($query) {
                    $query->select('venue_id', 'venue_name');
                }])
                ->get()
                ->groupBy('venue_id')
                ->map(function ($holidays) {
                    $venue = $holidays->first()?->venue;

                    if (!$venue) {
                        return null;
                    }

                    return [
                        'venue_id' => $venue->venue_id,
                        'venue_name' => $venue->venue_name,
                        'holidays' => $holidays->map(function ($holiday) {
                            return [
                                'id' => $holiday->id,
                                'venue_id' => $holiday->venue_id,
                                'name' => $holiday->name,
                                'holiday_type' => $holiday->holiday_type,
                                'date' => optional($holiday->date)->format('Y-m-d'),
                                'start_date' => optional($holiday->start_date)->format('Y-m-d'),
                                'end_date' => optional($holiday->end_date)->format('Y-m-d'),
                                'recurring_day' => $holiday->recurring_day,
                            ];
                        })->values()
                    ];
                })
                ->filter() // remove nulls
                ->values();


            return response()->json(['data' => $venuesWithHolidays]);
    } catch (\Exception $e) {
        Log::error('Error fetching venue names and holidays: ' . $e->getMessage(), [
            'exception' => $e,
        ]);
        return response()->json(['message' => 'Failed to retrieve venue information. Please try again later.'], 500);
    }
}

}
