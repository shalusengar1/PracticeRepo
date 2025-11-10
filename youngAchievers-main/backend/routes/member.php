<?php

use App\Http\Controllers\Member\MemberController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    Route::get('members', [MemberController::class, 'index']);
    Route::post('members', [MemberController::class, 'store']);
    Route::get('/members/members-for-studentlist', [MemberController::class, 'getMembersForStudentList'])->middleware('auth:sanctum');

    
    Route::get('members/{id}', [MemberController::class, 'show']);
    Route::put('members/{id}', [MemberController::class, 'update']);
    Route::delete('members/{id}', [MemberController::class, 'destroy']);
    Route::put('/members/{member}/toggle-pause', [MemberController::class, 'togglePauseAttendance']); // For pausing/resuming

    
    // Batch management for members
    // Route::post('members/{id}/batches', [MemberController::class, 'attachBatch']);
    // Route::delete('members/{id}/batches/{batchId}', [MemberController::class, 'detachBatch']);
    Route::get('programs/{programId}/batches', [MemberController::class, 'getBatchesByProgram']);
    
    // Optimized endpoint for statistics
    // Route::get('members/stats', [MemberController::class, 'getStats']);
    
});