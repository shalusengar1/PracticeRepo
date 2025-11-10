<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->string('email', 100)->unique();
            $table->string('password')->nullable();
            $table->string('mobile', 20);
            $table->string('name', 40);
            $table->enum('status', ['active', 'inactive', 'pending', 'blacklisted'])->default('active');
            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable(); // Make this unsigned
            $table->unsignedBigInteger('updated_by')->nullable(); // Make this unsigned

            $table->foreign('created_by')->references('id')->on('admin_users')->onDelete('cascade');
            $table->foreign('updated_by')->references('id')->on('admin_users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('members');
    }
};
