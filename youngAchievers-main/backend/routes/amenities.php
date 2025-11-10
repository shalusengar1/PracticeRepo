<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Amenities\AmenityController;

Route::group(['middleware' => 'auth:sanctum', 'prefix' => 'admin'], function () {
    Route::put('amenities/bulk', [AmenityController::class, 'updateBulk']); // Add the bulk update route
    Route::apiResource('amenities', AmenityController::class);

});
