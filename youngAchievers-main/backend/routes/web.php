<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;


// Catch-all route for the frontend, but exclude static assets
Route::get('{any?}', function ($any = null ) {

    $path = public_path('frontend/' . $any);

    return file_get_contents(public_path('frontend/index.html'));

    if (File::exists($path)) {
        // If the file exists in the frontend directory, serve it directly
        return response()->file($path);
    } else {
        // Otherwise, serve the frontend's index.html
    }
})->where('any', '^(?!api\/|storage\/).*');
