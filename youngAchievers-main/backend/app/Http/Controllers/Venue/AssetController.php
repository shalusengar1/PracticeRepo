<?php

namespace App\Http\Controllers\Venue;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\Venue;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use App\Traits\LogsActivity;

class AssetController extends Controller
{
    use LogsActivity;

    public function index()
    {
        return Asset::with('venue')
            ->whereNull('deleted_at') // Optional: exclude soft-deleted
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($asset) {
                return $this->formatAsset($asset);
            });
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('assets')->where(function ($query) use ($request) {
                    return $query->where('venue_id', $request->venue_id)
                                 ->whereNull('deleted_at');
                }),
            ],
            'type' => 'required|in:instrument,equipment',
            'quantity' => 'required|integer|min:1',
            'in_use' => 'required|integer|min:0',
            'condition' => 'required|in:excellent,good,fair,poor',
            'venue_id' => 'required|exists:venues,venue_id',
            'last_service_date' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Check if asset exists but is soft-deleted
        $existing = Asset::onlyTrashed()
            ->where('name', $request->name)
            ->where('venue_id', $request->venue_id)
            ->first();

        if ($existing) {
            $existing->restore();
            $existing->update($request->all());
            
            // Log asset restoration and update
            $this->logFixedAssetAction(
                'Asset Restored and Updated',
                $existing,
                "Asset \"{$existing->name}\" was restored and updated",
                null,
                $existing->toArray()
            );
            
            return response()->json($this->formatAsset($existing->load('venue')), 200);
        }

        $asset = Asset::create($request->all());
        
        // Log asset creation
        $this->logFixedAssetAction(
            'Asset Created',
            $asset,
            "Asset \"{$asset->name}\" was created",
            null,
            $asset->toArray()
        );
        
        return response()->json($this->formatAsset($asset->load('venue')), 201);
    }

    public function show(Asset $asset)
    {
        return $this->formatAsset($asset->load('venue'));
    }

    public function update(Request $request, Asset $asset)
    {
        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('assets', 'name')
                    ->where(function ($query) use ($request) {
                        return $query->where('venue_id', $request->venue_id)
                                     ->whereNull('deleted_at'); // Exclude soft-deleted
                    })
                    ->ignore($asset->id, 'id'),
            ],
            'type' => 'required|in:instrument,equipment',
            'quantity' => 'required|integer|min:1',
            'in_use' => 'required|integer|min:0',
            'condition' => 'required|in:excellent,good,fair,poor',
            'venue_id' => 'required|exists:venues,venue_id',
            'last_service_date' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Store original data for logging
        $originalData = $asset->toArray();

        $asset->update($request->all());

        // Prepare change details
        $changes = [];
        $newData = $asset->toArray();
        $trackableFields = ['name', 'type', 'quantity', 'in_use', 'condition', 'venue_id', 'last_service_date'];
        
        foreach ($trackableFields as $field) {
            if (isset($originalData[$field]) && isset($newData[$field]) && $originalData[$field] !== $newData[$field]) {
                $oldValue = $originalData[$field];
                $newValue = $newData[$field];
                if ($field === 'last_service_date') {
                    $oldValue = $oldValue ? Carbon::parse($oldValue)->format('d M Y') : 'N/A';
                    $newValue = $newValue ? Carbon::parse($newValue)->format('d M Y') : 'N/A';
                }
                $changes[] = "$field changed from '{$oldValue}' to '{$newValue}'";
            }
        }

        $changeDetails = empty($changes) 
            ? "No fields were modified"
            : "Changes were made to the asset , " . implode(", ", $changes);

        // Log asset update with detailed changes
        $this->logFixedAssetAction(
            'Asset Updated',
            $asset,
            $changeDetails,
            $originalData,
            $newData
        );

        return response()->json($this->formatAsset($asset->load('venue')));
    }

    public function destroy(Asset $asset)
    {
        // Store asset data for logging
        $assetData = $asset->toArray();
        $assetName = $asset->name;

        $asset->delete();

        // Log asset deletion
        $this->logFixedAssetAction(
            'Asset Deleted',
            $asset,
            "Asset \"{$assetName}\" was deleted",
            $assetData,
            null
        );

        return response()->json(null, 204);
    }

    private function formatAsset(Asset $asset): array
    {
        return [
            'id' => (string) $asset->id,
            'name' => $asset->name,
            'type' => $asset->type,
            'quantity' => $asset->quantity,
            'inUse' => $asset->in_use,
            'condition' => $asset->condition,
            'venue_id' => $asset->venue_id,
            'location' => $asset->venue->venue_name,
            'lastServiceDate' => $asset->last_service_date ? $asset->last_service_date->format('Y-m-d') : null,
        ];
    }
}
