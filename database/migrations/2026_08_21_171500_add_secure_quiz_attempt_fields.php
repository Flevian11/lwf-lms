<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quiz_attempts', function (Blueprint $table): void {
            $table->timestamp('expires_at')->nullable()->after('started_at');
            $table->unsignedTinyInteger('violation_count')->default(0)->after('expires_at');
            $table->timestamp('last_autosaved_at')->nullable()->after('violation_count');
            $table->timestamp('auto_submitted_at')->nullable()->after('last_autosaved_at');
            $table->string('termination_reason', 64)->nullable()->after('auto_submitted_at');
            $table->index(['quiz_id', 'user_id', 'status'], 'quiz_attempt_user_status_index');
        });

        Schema::table('quiz_answers', function (Blueprint $table): void {
            $table->json('selected_option_ids')->nullable()->after('selected_option_id');
        });

        Schema::create('quiz_attempt_violations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('attempt_id')->constrained('quiz_attempts')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('violation_type', 64);
            $table->unsignedTinyInteger('sequence');
            $table->string('detail', 255)->nullable();
            $table->timestamp('occurred_at');
            $table->timestamps();

            $table->unique(['attempt_id', 'sequence'], 'quiz_attempt_violation_sequence_unique');
            $table->index(['attempt_id', 'occurred_at'], 'quiz_attempt_violation_attempt_time_index');
            $table->index(['user_id', 'occurred_at'], 'quiz_attempt_violation_user_time_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_attempt_violations');

        Schema::table('quiz_answers', function (Blueprint $table): void {
            $table->dropColumn('selected_option_ids');
        });

        Schema::table('quiz_attempts', function (Blueprint $table): void {
            $table->dropIndex('quiz_attempt_user_status_index');
            $table->dropColumn([
                'expires_at',
                'violation_count',
                'last_autosaved_at',
                'auto_submitted_at',
                'termination_reason',
            ]);
        });
    }
};
