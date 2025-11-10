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
        Schema::create('venue_admins', function (Blueprint $table) {
            $table->unsignedBigInteger('venue_id');
            $table->unsignedBigInteger('user_id');
            $table->timestamp('assigned_at')->useCurrent();
            $table->unsignedBigInteger('assigned_by')->nullable();
            $table->primary(['venue_id', 'user_id']);

            $table->foreign('venue_id')->references('venue_id')->on('venues')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('admin_users')->onDelete('cascade');
            $table->foreign('assigned_by')->references('id')->on('admin_users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('venue_admins');
    }
};
