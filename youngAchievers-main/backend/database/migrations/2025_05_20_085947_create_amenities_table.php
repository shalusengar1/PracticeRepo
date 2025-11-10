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
        Schema::create('amenities', function (Blueprint $table) {
            $table->id(); // Auto-incrementing BIGINT primary key, defaults to 'id'
            $table->string('name', 50);
            $table->string('icon', 255)->nullable();
            // $table->text('description')->nullable();
            $table->string('category', 20); 
            $table->boolean('enabled')->default(true); 
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('amenities');
    }
};
