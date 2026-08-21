<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assignment_submissions', function (Blueprint $table): void {
            $table->string('transcript_path')->nullable()->after('graded_at');
            $table->timestamp('transcript_generated_at')->nullable()->after('transcript_path');
        });
    }

    public function down(): void
    {
        Schema::table('assignment_submissions', function (Blueprint $table): void {
            $table->dropColumn(['transcript_path', 'transcript_generated_at']);
        });
    }
};
