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
        Schema::create('venue_holidays', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('venue_id');
            $table->string('name', 255);
            $table->enum('holiday_type', ['specific', 'recurring']);
            $table->date('date')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->smallInteger('recurring_day')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();

            $table->foreign('venue_id')->references('venue_id')->on('venues')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('admin_users')->onDelete('set null');

            $table->unique(['venue_id', 'name', 'date'], 'unique_venue_holiday_date');
            $table->unique(['venue_id', 'name', 'start_date', 'end_date'], 'unique_venue_holiday_range');
            $table->unique(['venue_id', 'name', 'recurring_day'], 'unique_venue_holiday_recurring');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('venue_holidays');
    }
};
