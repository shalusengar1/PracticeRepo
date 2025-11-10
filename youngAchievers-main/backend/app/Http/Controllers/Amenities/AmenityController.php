<?php

namespace App\Http\Controllers\Amenities;

use App\Http\Controllers\Controller;
use App\Models\Amenity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\Traits\LogsActivity; 

class AmenityController extends Controller
{
    use LogsActivity;
    /**
     * Display a listing of the amenities. 
     */
    public function index(Request $request)
    {
        $enabledOnly = $request->query('enabled');

        $query = Amenity::query()->select(['id', 'name', 'icon', 'category', 'enabled'])
        ->orderBy('created_at', 'desc'); 

        if ($enabledOnly === 'true') {
            $query->where('enabled', true);
        } 

        $amenities = $query->get();
        return response()->json($amenities);
    }

    /**
     * Store a newly created amenity.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:50',
            'icon' => 'nullable|string|max:255',
            'category' => 'required|string|in:basic,comfort,additional',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $amenity = Amenity::create($validator->validated());

        // Log activity
        $this->logAmenityAction(
            'Amenity Created',
            $amenity,
            "Amenity \"{$amenity->name}\" was created",
            null, // Old values are null for a new record
            $amenity->toArray() // New values are the attributes of the created amenity
        );

        return response()->json($amenity->only(['id', 'name', 'icon', 'category', 'enabled']), 201);
    }

    /**
     * Display the specified amenity.
     */
    public function show(Amenity $amenity)
    {
        return response()->json($amenity);
    }

    /**
     * Update the specified amenity (specifically for enabling/disabling).
     */
    public function update(Request $request, Amenity $amenity)
    {
        $validator = Validator::make($request->all(), [
            'enabled' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $originalData = $amenity->getOriginal();

        $amenity->update($validator->validated()); 
        $newStatus = $amenity->enabled ? 'enabled' : 'disabled';
        $oldStatus = $originalData['enabled'] ? 'enabled' : 'disabled';

        // Log activity
        $this->logAmenityAction(
            'Amenity Updated',
            $amenity,
            "Amenity \"{$amenity->name}\" changed from {$oldStatus} to {$newStatus}",
            ['enabled' => $originalData['enabled']], // Old value
            ['enabled' => $amenity->enabled]       // New value
        );

        return response()->json($amenity);
    }

    public function updateBulk(Request $request)
    {
        $validator = Validator::make($request->all(), [
            '*' => 'required|array', // Ensure the request body is an array of arrays
            '*.id' => 'required|integer|exists:amenities,id', // Validate each amenity ID
            '*.enabled' => 'required|boolean', // Validate the enabled status
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $updates = $validator->validated();
        $updatedAmenitiesResponse = [];

        DB::beginTransaction(); // Start a database transaction

        try {

            foreach ($updates as $update) {
                $amenity = Amenity::find($update['id']);
                if ($amenity) { // Ensure amenity exists
                    $originalEnabledStatus = $amenity->enabled;

                    $amenity->enabled = $update['enabled'];
                    // updated_by is handled by the model's boot method if you've set that up
                    // Otherwise, you might need to set it manually:
                    // $amenity->updated_by = Auth::id();
                    $amenity->save();

                    if ($originalEnabledStatus !== $amenity->enabled) {
                        $newStatus = $amenity->enabled ? 'enabled' : 'disabled';
                        $oldStatus = $originalEnabledStatus ? 'enabled' : 'disabled';
                        $this->logAmenityAction(
                            'Amenity Updated (Bulk)',
                            $amenity,
                            "Amenity \"{$amenity->name}\" changed from {$oldStatus} to {$newStatus}",
                            ['enabled' => $originalEnabledStatus],
                            ['enabled' => $amenity->enabled]
                        );
                    }
                    $updatedAmenitiesResponse[] = $amenity->only(['id', 'name', 'icon', 'category', 'enabled']);
                }
            }

            DB::commit(); // Commit the transaction if all updates succeed

            return response()->json($updatedAmenitiesResponse);
        } catch (\Exception $e) {
            DB::rollBack(); // Roll back the transaction if any update fails
            return response()->json(['message' => 'Failed to update amenities: ' . $e->getMessage()], 500);
        }
    }


    /**
     * Remove the specified amenity from storage (soft delete).
     *
     * @param  \App\Models\Amenity  $amenity
     * @return \Illuminate\Http\Response
     */
    public function destroy(Amenity $amenity)
    {
        try {

            $oldAttributes = $amenity->getAttributes(); // Get attributes before deletion for logging

            $amenity->delete(); // This will perform a soft delete 

            // Log activity
            $this->logAmenityAction(
                'Amenity Deleted',
                $amenity, // Pass the model instance (it will have the ID even after soft delete)
                "Amenity \"{$amenity->name}\" was deleted",
                $oldAttributes, // Old values
                ['deleted_at' => now()->toDateTimeString()] // New values indicating soft deletion
            );

            return response()->json(null, 204); // 204 No Content for successful deletion
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to delete amenity: ' . $e->getMessage()], 500);
        }
    }
}
