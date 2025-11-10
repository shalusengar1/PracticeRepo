<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileUploadController extends Controller
{
    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:jpeg,png,jpg,gif,svg,pdf,doc,docx,csv|max:20480', // Max 20MB, adjust as needed
            'folder' => 'nullable|string|max:255',
        ]);

        try {
            $file = $request->file('file');
            $folder = $request->input('folder', 'uploads'); // Default to 'uploads' folder

            // Generate a unique name for the file to avoid conflicts
            $fileName = Str::uuid() . '.' . $file->getClientOriginalExtension();
            
            // Store the file in GCS. Ensure your .env and filesystems.php are configured for GCS.
            // The 'gcs' disk must be configured in config/filesystems.php
            $path = $file->storeAs($folder, $fileName, 'gcs');

            // Get the public URL of the uploaded file
            $url = Storage::disk('gcs')->url($path);

            return response()->json([
                'message' => 'File uploaded successfully',
                'url' => $url,
                'path' => $path, // Optionally return the path
            ], 200);

        } catch (\Exception $e) {
            \Log::error('File upload failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'File upload failed.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
