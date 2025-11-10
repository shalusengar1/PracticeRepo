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
        Schema::create('action_logs', function (Blueprint $table) {
            $table->id();
            $table->string('action'); // Create, Update, Delete, Login, etc.
            $table->string('user'); // User who performed the action
            $table->string('target'); // Target entity (user name, venue name, etc.)
            $table->string('category'); // user_management, venue_management, etc.
            $table->text('details'); // Description of what was done
            $table->string('ip_address')->nullable();
            $table->json('old_values')->nullable(); // For update operations
            $table->json('new_values')->nullable(); // For update operations
            $table->unsignedBigInteger('performed_by')->nullable(); // Foreign key to admin_users
            $table->string('entity_type')->nullable(); // Model class name
            $table->unsignedBigInteger('entity_id')->nullable(); // ID of the affected entity
            $table->timestamps();

            $table->foreign('performed_by')->references('id')->on('admin_users')->onDelete('set null');
            $table->index(['category', 'created_at']);
            $table->index(['performed_by', 'created_at']);
            $table->index(['entity_type', 'entity_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('action_logs');
    }
};