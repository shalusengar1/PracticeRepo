<?php

use App\Http\Controllers\ActivityLogController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->middleware('auth:sanctum')->group(function () {
    Route::get('/activity-logs', [ActivityLogController::class, 'index']);
    Route::post('/activity-logs', [ActivityLogController::class, 'store']);
});