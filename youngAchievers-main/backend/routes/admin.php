<?php

use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Admin\AdminPasswordResetController;
use App\Http\Controllers\Admin\FileUploadController; 
use App\Http\Controllers\Admin\BulkImportController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->middleware('auth:sanctum')->group(function () {
    //for venue-admins
    Route::get('users/venue-admins', [AdminUserController::class, 'indexByPermission']);

    // File Upload Route
    Route::post('upload', [FileUploadController::class, 'upload']);

    // Bulk User Import Route
    Route::post('users/bulk-import', [BulkImportController::class, 'importUsers']);
    
    //for all admins
    Route::get('users',        [AdminUserController::class, 'index']);
    Route::get('users/{id}',   [AdminUserController::class, 'show']);
    Route::post('users',       [AdminUserController::class, 'store']);
    Route::put('users/{id}',   [AdminUserController::class, 'update']);
    Route::delete('users/{id}',[AdminUserController::class, 'destroy']);    

    // Password reset route
    Route::post('users/{id}/reset-password', [AdminPasswordResetController::class, 'resetPassword']);
    
    // Toggle status route
    Route::patch('users/{id}/toggle-status', [AdminUserController::class, 'toggleStatus']);

    // Authenticated Admin's own profile update (textual data)
    Route::put('/profile', [AdminUserController::class, 'updateAuthenticatedUserProfile']);
});
