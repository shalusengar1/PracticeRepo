<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Admin\VenueImageController;

// Public + auth routes (login, logout, me)
require __DIR__ . '/auth.php';

// AdminUser CRUD (protected)
require __DIR__ . '/admin.php';

// Venue CRUD (protected)
require __DIR__ . '/venue.php';

// Partner CRUD (protected)
require __DIR__ . '/partner.php';

// Program CRUD (protected)
require __DIR__ . '/program.php';

// Batch CRUD (protected)
require __DIR__ . '/batch.php';

// Amenities CRUD (protected)
require __DIR__ . '/amenities.php';

// Member CRUD (protected)
require __DIR__ . '/member.php';

// Attendance CRUD (protected)
require __DIR__ . '/attendance.php';

// Activity CRUD (protected)
require __DIR__ . '/activity-logs.php';

// Venue Image Routes
Route::post('/admin/venues/upload-image', [VenueImageController::class, 'uploadVenueImage']);
Route::post('/admin/venues/upload-spot-image', [VenueImageController::class, 'uploadSpotImage']);

Route::middleware('auth:sanctum')->group(function () {
    // Dashboard routes
    Route::get('/dashboard/stats', [DashboardController::class, 'getStats']);
    
    // Profile picture upload route
    Route::post('/admin/profile/upload-picture', [AdminUserController::class, 'uploadProfilePicture']);
    
    // Profile picture URL refresh route
    Route::get('/admin/profile/refresh-image-url', [AdminUserController::class, 'refreshProfileImageUrl']);
    
    // ... existing routes ...
});
