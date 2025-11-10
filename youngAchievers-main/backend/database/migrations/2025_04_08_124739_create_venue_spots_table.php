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
        Schema::create('venue_spots', function (Blueprint $table) {
            $table->bigIncrements('venue_spot_id');
            $table->unsignedBigInteger('venue_id');
            $table->string('spot_name', 50);
            $table->integer('capacity');
            $table->integer('area')->nullable();
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->json('operative_days')->nullable();
            $table->string('spot_image_path')->nullable();
            $table->string('spot_image')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->foreign('venue_id')->references('venue_id')->on('venues')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('admin_users')->onDelete('set null');
            $table->foreign('updated_by')->references('id')->on('admin_users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('venue_spots');
    }
};
