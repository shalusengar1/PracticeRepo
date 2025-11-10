
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
        Schema::create('partner_attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained('partners')->onDelete('cascade');
            $table->foreignId('batch_session_id')->constrained('batch_sessions')->onDelete('cascade');
            $table->enum('status', ['present', 'absent', 'not marked', 'excused'])->default('not marked');
            $table->text('notes')->nullable();
            $table->timestamp('marked_at')->nullable();
            $table->foreignId('marked_by')->nullable()->constrained('admin_users')->onDelete('set null');
            $table->timestamps();
            
            // Ensure unique attendance record per partner per session
            $table->unique(['partner_id', 'batch_session_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partner_attendances');
    }
};
