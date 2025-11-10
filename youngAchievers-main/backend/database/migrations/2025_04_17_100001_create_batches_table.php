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
        Schema::create('batches', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('program_id')->constrained('programs')->onDelete('cascade');
            $table->string('type')->default('fixed'); // fixed or recurring
            $table->unsignedBigInteger('venue_id')->nullable(); // Change to unsignedBigInteger
            $table->foreign('venue_id')->references('venue_id')->on('venues')->onDelete('set null'); // Correct foreign key
            $table->foreignId('venue_spot_id')->nullable()->constrained('venue_spots', 'venue_spot_id')->onDelete('set null'); // Specify foreign key column
            $table->integer('capacity')->default(0);
            $table->text('description')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->time('session_start_time')->nullable();
            $table->time('session_end_time')->nullable();
            $table->integer('no_of_sessions')->default(0);
            $table->string('schedule_pattern')->nullable();
            $table->decimal('amount', 10, 2)->default(0);
            $table->string('currency', 3)->default('INR');
            $table->boolean('discount_available')->default(false);
            $table->integer('discount_percentage')->default(0);
            $table->string('status')->default('active');
            $table->integer('progress')->default(0);
            $table->json('fee_configuration')->nullable();
            $table->json('selected_session_dates')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('batch_partner', function (Blueprint $table) {
            $table->id();
            $table->foreignId('batch_id')->constrained('batches')->onDelete('cascade');
            $table->foreignId('partner_id')->constrained('partners')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('batch_partner');
        Schema::dropIfExists('batches');
    }
};
