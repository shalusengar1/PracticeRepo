<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('venue_spot_amenities', function (Blueprint $table) {
            $table->id(); // Optional: If you want an ID for the relationship itself
            $table->unsignedBigInteger('venue_spot_id');
            $table->unsignedBigInteger('amenity_id');
            $table->timestamps(); // Optional: If you want timestamps for when the relationship was created/updated

            $table->foreign('venue_spot_id')->references('venue_spot_id')->on('venue_spots')->onDelete('cascade');
            $table->foreign('amenity_id')->references('id')->on('amenities')->onDelete('cascade');

            $table->unique(['venue_spot_id', 'amenity_id']); // Prevent duplicate relationships
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('venue_spot_amenities');
    }
};
