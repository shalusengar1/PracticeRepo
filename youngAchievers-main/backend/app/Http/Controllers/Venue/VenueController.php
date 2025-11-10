<?php

namespace App\Http\Controllers\Venue;

use App\Http\Controllers\Controller;
use App\Models\Venue;
use App\Models\VenueSpot;
use App\Http\Requests\VenueRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use App\Traits\LogsActivity; 

class VenueController extends Controller
{
    use LogsActivity;
    /**
     * Display a listing of the venues.
     */
    public function index(): JsonResponse
    {
        try {
            $fields = request()->query('fields');
            $query = Venue::with(['venueAdmins', 'venueSpots' => function ($query) {
                $query->with(['amenities' => function ($query) {
                    $query->select('amenities.id')->where('enabled', true);
                }]);
            }]);

            if ($fields) {
                $fieldsArray = array_filter(explode(',', $fields));
                if (!in_array('venue_id', $fieldsArray)) {
                    array_unshift($fieldsArray, 'venue_id');
                }
                if (!in_array('venue_name', $fieldsArray)) {
                    array_unshift($fieldsArray, 'venue_name');
                }
                $query->select($fieldsArray);
                if (count(array_diff($fieldsArray, ['venue_id', 'venue_name'])) > 0) {
                    $query->with(['createdBy', 'updatedBy', 'venueAdmins', 'venueSpots']);
                }
            } else {
                $query->with(['createdBy', 'updatedBy', 'venueAdmins', 'venueSpots']);
            }

            // Search filter
            if ($search = request()->query('search')) {
                $query->where(function($q) use ($search) {
                    $q->where('venue_name', 'like', "%{$search}%")
                      ->orWhere('address', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }
            // Status filter
            if (request()->filled('status')) {
                $query->where('status', request()->query('status'));
            }

            // Pagination
            $paginate = filter_var(request()->query('paginate', true), FILTER_VALIDATE_BOOLEAN);
            if ($paginate) {
                $perPage = request()->query('per_page', 10);
                $venues = $query->orderBy('created_at', 'desc')->paginate($perPage);
                $venues->getCollection()->each(function ($venue) {
                    $venue->venueSpots->each(function ($spot) {
                        $spot->setRelation('amenities', $spot->amenities->pluck('id'));
                    });
                });
                return response()->json($venues);
            } else {
                $venues = $query->orderBy('created_at', 'desc')->get();
                $venues->each(function ($venue) {
                    $venue->venueSpots->each(function ($spot) {
                        $spot->setRelation('amenities', $spot->amenities->pluck('id'));
                    });
                });
                return response()->json([
                    'message' => 'Venues retrieved successfully',
                    'data' => $venues,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to fetch venues', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Something went wrong while retrieving venues',
            ], 500);
        }
    }

    public function getVenueNames()
    {
        $venues = Venue::select('venue_id', 'venue_name')->get();
        return response()->json(['message' => 'Venues retrieved successfully', 'data' => $venues]);
    }

    /**
     * Store a newly created venue in storage.
     */
    public function store(VenueRequest $request): JsonResponse
    {
        try {
            $venue = Venue::create([
                'venue_name' => $request->venue_name,
                'address' => $request->address,
                'description' => $request->description,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'created_by' => Auth::id(),
                'updated_by' => Auth::id(),
            ]);

            if ($request->has('venue_admin_ids')) {
                $venue->venueAdmins()->attach($request->venue_admin_ids, ['assigned_by' => Auth::id()]);
            }

            $this->logVenueAction(
                'Venue Created',
                $venue,
                "Venue \"{$venue->venue_name}\" was created",
                null,
                $venue->load('venueAdmins')->toArray() // Log with assigned admins
            );
            $venue->load(['venueAdmins', 'venueSpots' => function ($query) {
                $query->with(['amenities' => function ($query) {
                    $query->select('amenities.id')
                          ->where('enabled', true); // Only get enabled amenities
                }]);
            }]);

            $venue->venueSpots->each(function ($spot) {
                $spot->setRelation('amenities', $spot->amenities->pluck('id'));
            });

            return response()->json([
                'message' => 'Venue created successfully',
                'data' => $venue,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to create venue', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Something went wrong while creating the venue',
            ], 500);
        }
    }

    /**
     * Display the specified venue.
     */
    public function show(Venue $venue): JsonResponse
    {
        try {
            $venue->load(['venueAdmins', 'venueSpots' => function ($query) {
                $query->with(['amenities' => function ($query) {
                    $query->select('amenities.id')
                          ->where('enabled', true); // Only get enabled amenities
                }]);
            }]);

            $venue->venueSpots->each(function ($spot) {
                $spot->setRelation('amenities', $spot->amenities->pluck('id'));
            });

            return response()->json([
                'message' => 'Venue retrieved successfully',
                'data' => $venue,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch venue', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Something went wrong while retrieving the venue',
            ], 500);
        }
    }

    /**
     * Update the specified venue in storage.
     */
    public function update(VenueRequest $request, Venue $venue): JsonResponse
    {
        try {
            $originalVenueData = $venue->toArray();
            $originalAdminIds = $venue->venueAdmins()->pluck('admin_users.id')->toArray();

            $venue->update([
                'venue_name' => $request->venue_name,
                'address' => $request->address,
                'description' => $request->description,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'status' => $request->status,
                'updated_by' => Auth::id(),
            ]);

            // $venue->venueAdmins()->detach();
            // if ($request->has('venue_admin_ids')) {
            //     $venue->venueAdmins()->attach($request->venue_admin_ids, ['assigned_by' => Auth::id()]);
            // }


            $newAdminIds = $request->input('venue_admin_ids', []);
            $venue->venueAdmins()->sync($newAdminIds, ['assigned_by' => Auth::id()]);

            $changes = $venue->getChanges();
            $logDetails = [];
            $oldValuesLog = [];
            $newValuesLog = [];

            foreach ($changes as $key => $newValue) {
                if ($key === 'updated_at') continue;
                $oldValue = $originalVenueData[$key] ?? null;
                $logDetails[] = "{$key} changed from \"{$oldValue}\" to \"{$newValue}\"";
                $oldValuesLog[$key] = $oldValue;
                $newValuesLog[$key] = $newValue;
            }

            if (array_diff($originalAdminIds, $newAdminIds) || array_diff($newAdminIds, $originalAdminIds)) {
                $logDetails[] = "Venue admins updated.";
                $oldValuesLog['venue_admin_ids'] = $originalAdminIds;
                $newValuesLog['venue_admin_ids'] = $newAdminIds;
            }

            if (!empty($logDetails)) {
                $this->logVenueAction(
                    'Venue Updated',
                    $venue,
                    "Venue \"{$venue->venue_name}\" updated , " . implode(', ', $logDetails),
                    $oldValuesLog,
                    $newValuesLog
                );
            }

            $venue->load(['venueAdmins', 'venueSpots' => function ($query) {
                $query->with(['amenities' => function ($query) {
                    $query->select('amenities.id')
                          ->where('enabled', true); // Only get enabled amenities
                }]);
            }]);

            $venue->venueSpots->each(function ($spot) {
                $spot->setRelation('amenities', $spot->amenities->pluck('id'));
            });

            return response()->json([
                'message' => 'Venue updated successfully',
                'data' => $venue,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update venue', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Something went wrong while updating the venue',
            ], 500);
        }
    }

    /**
     * Update the specified venue spot in storage.
     */
    public function updateSpot(Request $request, Venue $venue, VenueSpot $venueSpot): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'spot_name' => 'required|string',
                'capacity' => 'required|integer|min:1',
                'area' => 'required|integer|min:1',
                'start_time' => 'required|string',
                'end_time' => 'required|string',
                'operative_days' => 'required|array',
                'operative_days.*' => 'integer|distinct|min:1|max:7',
                'amenities' => 'nullable|array',
                'amenities.*' => 'integer',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $originalSpotData = $venueSpot->toArray();
            $originalAmenityIds = $venueSpot->amenities()->pluck('amenities.id')->toArray();

            $venueSpot->update([
                'spot_name' => $request->spot_name,
                'capacity' => $request->capacity,
                'area' => $request->area,
                'start_time' => $request->start_time,
                'end_time' => $request->end_time,
                'operative_days' => $request->operative_days,
                'updated_by' => Auth::id(),
            ]);

            $newAmenityIds = $request->input('amenities', []);
            $venueSpot->amenities()->sync($newAmenityIds);

            $changes = $venueSpot->getChanges();
            $logDetails = [];
            $oldValuesLog = [];
            $newValuesLog = [];

            foreach ($changes as $key => $newValue) {
                if ($key === 'updated_at') continue;
                $oldValue = $originalSpotData[$key] ?? null;
                
                // Handle array values
                if (is_array($oldValue)) {
                    $oldValue = json_encode($oldValue);
                }
                if (is_array($newValue)) {
                    $newValue = json_encode($newValue);
                }
                
                $logDetails[] = "{$key} changed from {$oldValue} to {$newValue}";
                $oldValuesLog[$key] = $oldValue;
                $newValuesLog[$key] = $newValue;
            }

            if (array_diff($originalAmenityIds, $newAmenityIds) || array_diff($newAmenityIds, $originalAmenityIds)) {
                $logDetails[] = "Amenities updated from [" . implode(', ', $originalAmenityIds) . "] to [" . implode(', ', $newAmenityIds) . "]";
                $oldValuesLog['amenities'] = $originalAmenityIds;
                $newValuesLog['amenities'] = $newAmenityIds;
            }

            if (!empty($logDetails)) {
                $this->logVenueAction(
                    'Venue Spot Updated',
                    $venue, // Log against the parent venue
                    "Spot \"{$venueSpot->spot_name}\" in venue \"{$venue->venue_name}\" updated: " . implode('; ', $logDetails),
                    $oldValuesLog,
                    $newValuesLog
                );
            }

            $venue->load(['venueSpots' => function ($query) {
                $query->with(['amenities' => function ($query) {
                    $query->select('amenities.id')
                          ->where('enabled', true); // Only get enabled amenities
                }]);
            }]);

            $venue->venueSpots->each(function ($spot) {
                $spot->setRelation('amenities', $spot->amenities->pluck('id'));
            });

            return response()->json([
                'message' => 'Venue spot updated successfully',
                'data' => $venue,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update venue spot', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Something went wrong while updating the venue spot',
            ], 500);
        }
    }

    /**
     * Add the specified venue spot in storage.
     */
    public function addSpot(Request $request, Venue $venue): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'spot_name' => 'required|string',
                'capacity' => 'required|integer|min:1',
                'area' => 'required|integer|min:1',
                'start_time' => 'required|string',
                'end_time' => 'required|string',
                'operative_days' => 'required|array',
                'operative_days.*' => 'integer|distinct|min:1|max:7',
                'amenities' => 'nullable|array',
                'amenities.*' => 'integer|exists:amenities,id',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $spot = $venue->venueSpots()->create([
                'spot_name' => $request->spot_name,
                'capacity' => $request->capacity,
                'area' => $request->area,
                'start_time' => $request->start_time,
                'end_time' => $request->end_time,
                'operative_days' => $request->operative_days,
                'created_by' => Auth::id(),
                'updated_by' => Auth::id(),
            ]);

            if ($request->has('amenities')) {
                $spot->amenities()->attach($request->input('amenities'));
            }

            $this->logVenueAction(
                'Venue Spot Added',
                $venue,
                "Spot \"{$spot->spot_name}\" was added to venue \"{$venue->venue_name}\"",
                null,
                $spot->load('amenities')->toArray()
            );

            $venue->load(['venueSpots' => function ($query) {
                $query->with(['amenities' => function ($query) {
                    $query->select('amenities.id')
                          ->where('enabled', true); // Only get enabled amenities
                }]);
            }]);

            $venue->venueSpots->each(function ($spot) {
                $spot->setRelation('amenities', $spot->amenities->pluck('id'));
            });

            return response()->json([
                'message' => 'Venue spot added successfully',
                'data' => $venue,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to add venue spot', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Something went wrong while adding the venue spot',
            ], 500);
        }
    }

    /**
     * Update the specified venue spots in storage.
     */
    public function updateSpots(Request $request, Venue $venue): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'venue_spots' => 'nullable|array',
                'venue_spots.*.venue_spot_id' => 'nullable|integer',
                'venue_spots.*.spot_name' => 'required|string',
                'venue_spots.*.capacity' => 'required|integer|min:1',
                'venue_spots.*.area' => 'required|integer|min:1',
                'venue_spots.*.start_time' => 'required|string',
                'venue_spots.*.end_time' => 'required|string',
                'venue_spots.*.operative_days' => 'required|array',
                'venue_spots.*.operative_days.*' => 'integer|distinct|min:1|max:7',
                'venue_spots.*.amenities' => 'nullable|array',
                'venue_spots.*.amenities.*' => 'integer|exists:amenities,id',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            if ($request->has('venue_spots')) {
                // $existingSpotIds = $venue->venueSpots()->withTrashed()->pluck('venue_spot_id')->toArray();
                // $requestSpotIds = collect($request->venue_spots)->pluck('venue_spot_id')->filter()->toArray();
                // $spotsToDelete = array_diff($existingSpotIds, $requestSpotIds);

                // foreach ($spotsToDelete as $spotId) {
                //     $venue->venueSpots()->where('venue_spot_id', $spotId)->delete();
                // }

                $requestSpotIdsWithData = collect($request->venue_spots)->keyBy('venue_spot_id')->filter(function ($item) {
                    return !empty($item['venue_spot_id']);
                });
                $requestSpotIds = $requestSpotIdsWithData->keys()->toArray();

                // Delete spots not in the request
                $existingSpotIds = $venue->venueSpots()->pluck('venue_spot_id')->toArray();
                $spotsToDelete = array_diff($existingSpotIds, $requestSpotIds);

                foreach ($spotsToDelete as $spotIdToDelete) {
                    $spot = VenueSpot::find($spotIdToDelete);
                    if ($spot) {
                        $spotDataForLog = $spot->toArray();
                        $spot->delete();
                        $this->logVenueAction(
                            'Venue Spot Deleted',
                            $venue,
                            "Spot \"{$spotDataForLog['spot_name']}\" was deleted from venue \"{$venue->venue_name}\"",
                            $spotDataForLog,
                            null
                        );
                    }
                }

                foreach ($request->venue_spots as $spotData) {
                    if (isset($spotData['venue_spot_id']) && !empty($spotData['venue_spot_id'])) {
                        $venueSpot = $venue->venueSpots()->withTrashed()->find($spotData['venue_spot_id']);
                        if ($venueSpot) {
                            $originalSpotData = $venueSpot->toArray();
                            $originalAmenityIds = $venueSpot->amenities()->pluck('amenities.id')->toArray();

                            $venueSpot->update([
                                'spot_name' => $spotData['spot_name'],
                                'capacity' => $spotData['capacity'],
                                'area' => $spotData['area'],
                                'start_time' => $spotData['start_time'],
                                'end_time' => $spotData['end_time'],
                                'operative_days' => $spotData['operative_days'],
                                'updated_by' => Auth::id(),
                            ]);

                            $newAmenityIds = $spotData['amenities'] ?? [];
                            $venueSpot->amenities()->sync($newAmenityIds);

                            $changes = $venueSpot->getChanges();
                            $logDetails = []; $oldValuesLog = []; $newValuesLog = [];
                            foreach ($changes as $key => $newValue) {
                                if ($key === 'updated_at') continue;
                                $oldValue = $originalSpotData[$key] ?? null;
                                $logDetails[] = "{$key} changed";
                                $oldValuesLog[$key] = $oldValue; $newValuesLog[$key] = $newValue;
                            }
                            if (array_diff($originalAmenityIds, $newAmenityIds) || array_diff($newAmenityIds, $originalAmenityIds)) {
                            $logDetails[] = "amenities updated";
                            $oldValuesLog['amenities'] = $originalAmenityIds; $newValuesLog['amenities'] = $newAmenityIds;
                            }
                            if(!empty($logDetails)) {
                                $this->logVenueAction('Venue Spot Updated', $venue, "Spot \"{$venueSpot->spot_name}\" in venue \"{$venue->venue_name}\" updated ," . implode(', ', $logDetails), $oldValuesLog, $newValuesLog);
                            }
                        }
                    } else {

                        $spot = $venue->venueSpots()->create([
                            'spot_name' => $spotData['spot_name'],
                            'capacity' => $spotData['capacity'],
                            'area' => $spotData['area'],
                            'start_time' => $spotData['start_time'],
                            'end_time' => $spotData['end_time'],
                            'operative_days' => $spotData['operative_days'],
                            'created_by' => Auth::id(),
                            'updated_by' => Auth::id(),
                        ]);

                        if (isset($spotData['amenities'])) {
                            $spot->amenities()->attach($spotData['amenities']);
                        }

                        $this->logVenueAction('Venue Spot Added', $venue, "Spot \"{$spot->spot_name}\" was added to venue \"{$venue->venue_name}\"", null, $spot->load('amenities')->toArray());
                    }
                }
            }

            $venue->load(['venueSpots' => function ($query) {
                $query->with(['amenities' => function ($query) {
                    $query->select('amenities.id')
                          ->where('enabled', true); // Only get enabled amenities
                }]);
            }]);

            $venue->venueSpots->each(function ($spot) {
                $spot->setRelation('amenities', $spot->amenities->pluck('id'));
            });

            return response()->json([
                'message' => 'Venue spots updated successfully',
                'data' => $venue,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update venue spots', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Something went wrong while updating the venue spots',
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroySpot(Venue $venue, VenueSpot $venueSpot): JsonResponse
    {
        try {
            $spotDataForLog = $venueSpot->toArray();
            $venueSpot->delete();

            $this->logVenueAction(
                'Venue Spot Deleted',
                $venue, // Log against the parent venue
                "Spot \"{$spotDataForLog['spot_name']}\" was deleted from venue \"{$venue->venue_name}\"",
                $spotDataForLog,
                null
            );

            return response()->json([
                'message' => 'Venue spot deleted successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete venue spot', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Something went wrong while deleting the venue spot',
            ], 500);
        }
    }

    /**
     * Remove the specified venue from storage.
     */
    public function destroy(Venue $venue): JsonResponse
    {
        try {
            $venueDataForLog = $venue->toArray();
            $venue->delete();

            $this->logVenueAction(
                'Venue Deleted',
                $venue,
                "Venue \"{$venueDataForLog['venue_name']}\" was deleted",
                $venueDataForLog,
                ['status' => 'deleted'] // Representing the conceptual change
            );

            return response()->json([
                'message' => 'Venue marked as deleted successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete venue', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Something went wrong while deleting the venue',
            ], 500);
        }
    }

    /**
     * Get all spots for a specific venue.
     */
    public function getSpots(Venue $venue): JsonResponse
    {
        try {
            $fields = request()->query('fields');
            $query = $venue->venueSpots();

            if ($fields) {
                $fieldsArray = array_filter(explode(',', $fields));
                $query->select($fieldsArray);
            }

            $venueSpots = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'message' => 'Venue spots retrieved successfully',
                'data' => $venueSpots,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch venue spots', ['error' => $e->getMessage()]);

            return response()->json([
                'message' => 'Something went wrong while retrieving venue spots',
            ], 500);
        }
    }
}
