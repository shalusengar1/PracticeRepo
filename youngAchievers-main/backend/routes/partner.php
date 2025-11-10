<?php

use App\Http\Controllers\Partner\PartnerController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->middleware('auth:sanctum')->group(function () {
    Route::get('partners', [PartnerController::class, 'index']);
    Route::post('partners', [PartnerController::class, 'store']);
    Route::get('partners/{partner}', [PartnerController::class, 'show']);
    Route::put('partners/{id}', [PartnerController::class, 'update']);
    Route::delete('partners/{partner}', [PartnerController::class, 'destroy']);
});
