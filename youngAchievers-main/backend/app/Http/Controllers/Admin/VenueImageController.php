<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\GoogleCloudStorageService;
use App\Models\Venue;
use App\Models\VenueSpot;
use Illuminate\Support\Facades\Log;

class VenueImageController extends Controller
{
    protected $gcsService;

    public function __construct(GoogleCloudStorageService $gcsService)
    {
        $this->gcsService = $gcsService;
    }

    public function uploadVenueImage(Request $request)
    {
        $request->validate([
            'venue_image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
            'venue_id' => 'required|exists:venues,venue_id'
        ]);

        try {
            $file = $request->file('venue_image');
            $venueId = $request->input('venue_id');
            $venue = Venue::find($venueId);
            
            // Store original data for logging
            $originalData = $venue->toArray();
            
            // Upload to GCS
            $gcsPath = "venues/{$venueId}/images";
            $uploadResult = $this->gcsService->uploadFile($file, $gcsPath);

            // Delete old venue image if exists
            if ($venue->venue_image_path) {
                $this->gcsService->deleteFile($venue->venue_image_path);
            }

            // Store the object path and current signed URL
            $venue->venue_image_path = $uploadResult['object_name'];
            $venue->venue_image = $uploadResult['public_url'];
            $venue->save();

            return response()->json([
                'message' => 'Venue image updated successfully',
                'venue_image' => $uploadResult['public_url']
            ]);

        } catch (\Exception $e) {
            Log::error('Venue image upload failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to upload venue image',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function uploadSpotImage(Request $request)
    {
        $request->validate([
            'spot_image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
            'venue_id' => 'required|exists:venues,venue_id',
            'spot_id' => 'required|exists:venue_spots,venue_spot_id'
        ]);

        try {
            $file = $request->file('spot_image');
            $venueId = $request->input('venue_id');
            $spotId = $request->input('spot_id');
            $spot = VenueSpot::find($spotId);
            
            // Store original data for logging
            $originalData = $spot->toArray();
            
            // Upload to GCS
            $gcsPath = "venues/{$venueId}/spots/{$spotId}/images";
            $uploadResult = $this->gcsService->uploadFile($file, $gcsPath);

            // Delete old spot image if exists
            if ($spot->spot_image_path) {
                $this->gcsService->deleteFile($spot->spot_image_path);
            }

            // Store the object path and current signed URL
            $spot->spot_image_path = $uploadResult['object_name'];
            $spot->spot_image = $uploadResult['public_url'];
            $spot->save();

            return response()->json([
                'message' => 'Spot image updated successfully',
                'spot_image' => $uploadResult['public_url']
            ]);

        } catch (\Exception $e) {
            Log::error('Spot image upload failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to upload spot image',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 