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
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['instrument', 'equipment']);
            $table->integer('quantity');
            $table->integer('in_use')->default(0);
            $table->enum('condition', ['excellent', 'good', 'fair', 'poor'])->default('good');
            $table->foreignId('venue_id')->references('venue_id')->on('venues')->onDelete('cascade'); // Foreign key
            $table->date('last_service_date')->nullable();
            $table->timestamps();
            $table->softDeletes(); // Adds deleted_at column
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
