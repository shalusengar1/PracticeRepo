<?php

use App\Http\Controllers\Attendance\AttendanceController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    // Attendance management routes
    Route::get('attendance/batches', [AttendanceController::class, 'getBatches']);
    Route::post('attendance/mark', [AttendanceController::class, 'markAttendance']);
    Route::get('attendance/by-date', [AttendanceController::class, 'getAttendanceByDate']);
    
    //ROUTE for fetching all attendance for a batch
    Route::get('attendance/batch/{batch_id}/all', [AttendanceController::class, 'getAllAttendanceForBatch']);

    
    Route::get('attendance/partner/{partnerId}/recent', [AttendanceController::class, 'getPartnerRecentAttendance']);
    // Route::post('attendance/excuse', [AttendanceController::class, 'excusePerson']);
    // Route::post('attendance/resume', [AttendanceController::class, 'resumeAttendance']);
});
