<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('venues', function (Blueprint $table) {
            $table->bigIncrements('venue_id');
            $table->string('venue_name', 100);
            $table->text('address')->nullable();
            $table->text('description')->nullable();
            // $table->decimal('average_occupancy', 5, 2)->default(0.00);
            $table->decimal('peak_occupancy', 5, 2)->default(0.00);
            $table->integer('total_events')->default(0);
            $table->decimal('revenue_generated', 10, 2)->default(0.00);
            $table->enum('status', ['active', 'inactive',  'deleted'])->default('active');
            $table->string('venue_image_path')->nullable();
            $table->string('venue_image')->nullable();
            // Add latitude and longitude columns for geolocation
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->timestamps();
            $table->softDeletes(); // Adds deleted_at column
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->foreign('created_by')->references('id')->on('admin_users')->onDelete('set null');
            $table->foreign('updated_by')->references('id')->on('admin_users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('venues');
    }
};
