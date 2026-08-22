<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quizzes', function (Blueprint $table): void {
            $table->enum('allocation_mode', ['course', 'targeted'])
                ->default('course')
                ->after('status')
                ->index('quizzes_allocation_mode_index');
        });

        Schema::create('quiz_allocations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('quiz_id')->constrained('quizzes')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('assigned_at')->useCurrent();
            $table->timestamps();

            $table->unique(['quiz_id', 'user_id'], 'quiz_allocations_quiz_user_unique');
            $table->index(['user_id', 'assigned_at'], 'quiz_allocations_user_assigned_at_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_allocations');
        Schema::table('quizzes', function (Blueprint $table): void {
            $table->dropIndex('quizzes_allocation_mode_index');
            $table->dropColumn('allocation_mode');
        });
    }
};
