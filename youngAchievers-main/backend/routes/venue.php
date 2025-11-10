<?php

use App\Http\Controllers\Venue\AssetController;
use App\Http\Controllers\Venue\VenueController;
use App\Http\Controllers\Venue\VenueHolidayController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->middleware('auth:sanctum')->group(function () {
    Route::get('venues', [VenueController::class, 'index']);
    Route::get('venues/names', [VenueController::class, 'getVenueNames']);
    Route::post('venues', [VenueController::class, 'store']);
    Route::get('venues/{venue}', [VenueController::class, 'show']);
    Route::put('venues/{venue}', [VenueController::class, 'update']);
    Route::delete('venues/{venue}', [VenueController::class, 'destroy']);

    Route::get('venues/{venue}/spots', [VenueController::class, 'getSpots']);
    // route for updating a single spot
    Route::patch('venues/{venue}/spots/{venueSpot}', [VenueController::class, 'updateSpot']);
    // route for adding a single spot
    Route::post('venues/{venue}/spots', [VenueController::class, 'addSpot']);
    // route for updating multiple spots
    Route::put('venues/{venue}/spots', [VenueController::class, 'updateSpots']);
    Route::delete('venues/{venue}/spots/{venueSpot}', [VenueController::class, 'destroySpot']);

    //route for handling venue holidays
    Route::post('venue-holidays', [VenueHolidayController::class, 'store']);
    Route::post('venue-holidays/bulk', [VenueHolidayController::class, 'storeMultiple']);
    Route::delete('venue-holidays/{id}', [VenueHolidayController::class, 'destroy']);
    Route::get('venue-names-and-holidays', [VenueHolidayController::class, 'getVenueNamesAndHolidays']);

    //route for handling the fixed assets
    Route::get('assets', [AssetController::class, 'index']);
    Route::post('assets', [AssetController::class, 'store']);
    Route::get('assets/{asset}', [AssetController::class, 'show']);
    Route::put('assets/{asset}', [AssetController::class, 'update']);
    Route::delete('assets/{asset}', [AssetController::class, 'destroy']); // Soft delete

});
