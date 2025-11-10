<?php

namespace App\Services;

use Google\Cloud\Storage\StorageClient;
use Illuminate\Support\Facades\Log;

class GoogleCloudStorageService
{
    protected $storage;
    protected $bucketName;
    protected $bucket;

    public function __construct()
    {
        $this->bucketName = config('filesystems.disks.gcs.bucket');
        $this->storage = new StorageClient([
            'projectId' => config('filesystems.disks.gcs.project_id'),
            'keyFilePath' => config('filesystems.disks.gcs.key_file'),
        ]);
        $this->bucket = $this->storage->bucket($this->bucketName);
    }

    public function uploadFile($file, $path)
    {
        try {
            // Generate a unique filename
            $filename = $path . '/' . uniqid() . '_' . $file->getClientOriginalName();
            
            // Upload the file and make it publicly accessible
            $object = $this->bucket->upload(
                file_get_contents($file->getRealPath()),
                [
                    'name' => $filename,
                    'predefinedAcl' => 'publicRead', // This makes the file public
                ]
            );
    
            // Construct public URL manually
            $publicUrl = sprintf("https://storage.googleapis.com/%s/%s", $this->bucketName, $filename);
    
            return [
                'public_url' => $publicUrl,
                'object_name' => $filename,
                'bucket_name' => $this->bucketName
            ];
    
        } catch (\Exception $e) {
            Log::error('GCS Upload failed: ' . $e->getMessage());
            throw $e;
        }
    }
    

    public function getSignedUrl($objectName, $expirationDays = 7)
    {
        try {
            $object = $this->bucket->object($objectName);
            if ($object->exists()) {
                return $object->signedUrl(
                    new \DateTime("+ {$expirationDays} days"),
                    [
                        'version' => 'v4',
                    ]
                );
            }
            return null;
        } catch (\Exception $e) {
            Log::error('GCS Signed URL generation failed: ' . $e->getMessage());
            throw $e;
        }
    }

    public function deleteFile($objectName)
    {
        try {
            if ($objectName) {
                // If the objectName is a full URL, extract just the path
                $objectName = $this->getObjectNameFromUrl($objectName);
                $object = $this->bucket->object($objectName);
                if ($object->exists()) {
                    $object->delete();
                }
            }
        } catch (\Exception $e) {
            Log::error('GCS Delete failed: ' . $e->getMessage());
            throw $e;
        }
    }

    private function getObjectNameFromUrl($url)
    {
        // Extract the object name from a GCS URL
        $pattern = "/storage\.googleapis\.com\/" . $this->bucketName . "\/(.*)/";
        if (preg_match($pattern, $url, $matches)) {
            return $matches[1];
        }
        return $url; // Return as is if it's already just the object name
    }
} 