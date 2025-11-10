<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('user_permissions', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->primary();
            $table->json('permissions');
            $table->timestamp('assigned_at')->useCurrent();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('admin_users')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('admin_users')->onDelete('set null');
            $table->foreign('updated_by')->references('id')->on('admin_users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_permissions');
    }
};
