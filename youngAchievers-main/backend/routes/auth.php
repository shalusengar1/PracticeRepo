<?php

use App\Http\Controllers\AdminAuthController;
use Illuminate\Support\Facades\Route;

Route::middleware('api')->group(function () {
    
    
    Route::prefix('admin')->group(function () {
        // Login (no auth required)
        Route::post('login', [AdminAuthController::class, 'login']);
        
        // All these require a valid Sanctum token
        Route::middleware('auth:sanctum')->group(function () {
            Route::get('me', [AdminAuthController::class, 'me']);
            Route::post('logout', [AdminAuthController::class, 'logout']);
        });
    });
}
);
    
