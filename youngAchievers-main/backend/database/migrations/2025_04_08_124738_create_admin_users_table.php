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
        Schema::create('admin_users', function (Blueprint $table) {
            $table->id();
            $table->string('first_name', 50);
            $table->string('last_name', 50)->nullable();
            $table->string('email', 100)->unique();
            $table->string('password')->nullable();
            $table->string('profile_image')->nullable(); 
            $table->string('profile_image_signed')->nullable(); 
            $table->string('profile_image_path')->nullable();
            $table->string('phone', 20)->nullable();
            $table->unsignedBigInteger('role_id')->nullable()->index('idx_admin_role');
            $table->enum('status', ['active', 'inactive', 'pending'])->default('pending')->index('idx_admin_status');
            $table->date('date_of_birth')->nullable();
            $table->string('employee_code', 20)->unique()->nullable();
            $table->date('joining_date')->nullable();
            $table->string('alternate_contact', 20)->nullable();
            $table->text('address')->nullable();
            $table->json('documents')->nullable();
            $table->timestamps();
            $table->unsignedBigInteger('created_by')->nullable(); // Make this unsigned
            $table->unsignedBigInteger('updated_by')->nullable(); // Make this unsigned

            $table->foreign('role_id')->references('id')->on('roles')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('admin_users')->onDelete('set null');
            $table->foreign('updated_by')->references('id')->on('admin_users')->onDelete('set null');
        });

        // DB::statement("ALTER TABLE admin_users ALTER joining_date SET DEFAULT CURRENT_DATE");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admin_users');
    }
};
