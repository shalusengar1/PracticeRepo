
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
        Schema::table('members', function (Blueprint $table) {
            $table->date('excused_until')->nullable()->after('status');
            $table->text('excuse_reason')->nullable()->after('excused_until');
        });

        Schema::table('partners', function (Blueprint $table) {
            $table->date('excused_until')->nullable()->after('status');
            $table->text('excuse_reason')->nullable()->after('excused_until');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->dropColumn(['excused_until', 'excuse_reason']);
        });

        Schema::table('partners', function (Blueprint $table) {
            $table->dropColumn(['excused_until', 'excuse_reason']);
        });
    }
};
