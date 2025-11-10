<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Google\Cloud\Storage\StorageClient;

class GoogleCloudStorageServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->singleton(StorageClient::class, function ($app) {
            return new StorageClient([
                'projectId' => config('filesystems.disks.gcs.project_id'),
                'keyFilePath' => config('filesystems.disks.gcs.key_file'),
            ]);
        });
    }

    public function boot()
    {
        //
    }
} 