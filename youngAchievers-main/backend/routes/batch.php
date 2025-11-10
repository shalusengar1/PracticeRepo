<?php
use App\Http\Controllers\Batch\BatchController;
use App\Http\Controllers\Batch\SessionController;
use App\Http\Controllers\Batch\BatchReportController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->middleware('auth:sanctum')->group(function () {

     // Batch with members and partners
    Route::get('batches/with-members-partners', [BatchController::class, 'getBatchesWithMembersPartners']);

    // Batch management
    Route::get('batches', [BatchController::class, 'index']);
    Route::post('batches', [BatchController::class, 'store']);
    Route::get('batches/programmed-batches', [BatchController::class, 'getProgramedBatches']);
    Route::get('batches/{id}', [BatchController::class, 'show']);
    Route::put('batches/{id}', [BatchController::class, 'update']);
    Route::delete('batches/{id}', [BatchController::class, 'destroy']);

    
    // Session management
    Route::get('batches/{batchId}/sessions', [SessionController::class, 'getByBatchId']);
    Route::post('sessions', [SessionController::class, 'store']);
    Route::put('sessions/{sessionId}', [SessionController::class, 'update']);
    Route::delete('sessions/{sessionId}', [SessionController::class, 'destroy']);
    Route::put('sessions/{sessionId}/reschedule', [SessionController::class, 'reschedule']);
    
    // Batch reporting
    Route::get('batches/{batchId}/report', [BatchReportController::class, 'getBatchReport']);
    Route::get('batches-summary', [BatchReportController::class, 'getBatchesSummary']);
});
