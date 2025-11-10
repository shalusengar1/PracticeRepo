<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partners', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('specialization', 255)->nullable();
            $table->enum('status', ['Active', 'Inactive', 'Pending', 'Blacklisted'])->default('Active');
            $table->enum('pay_type', ['Fixed', 'Revenue Share']);
            $table->decimal('pay_amount', 10, 2)->nullable();
            $table->decimal('pay_percentage', 5, 2)->nullable();
            $table->enum('payment_terms', ['Monthly','After each batch','Before batch commencement','15 days after batch completion','30 days after batch completion'])->nullable();
            $table->string('email', 100)->unique();
            // $table->string('password');
            $table->string('mobile', 20)->unique();
            $table->timestamps();
            $table->softDeletes(); 
            $table->unsignedBigInteger('created_by')->nullable(); // Make this unsigned
            $table->unsignedBigInteger('updated_by')->nullable(); // Make this unsigned

            $table->foreign('created_by')->references('id')->on('admin_users')->onDelete('cascade');
            $table->foreign('updated_by')->references('id')->on('admin_users')->onDelete('cascade');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partners');
    }
};
