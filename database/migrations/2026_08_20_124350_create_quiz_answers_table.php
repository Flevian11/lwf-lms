<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_answers', function (Blueprint $table) {
            $table->id();

            $table->foreignId('attempt_id')
                ->constrained('quiz_attempts')
                ->cascadeOnDelete();

            $table->foreignId('question_id')
                ->constrained('quiz_questions')
                ->cascadeOnDelete();

            $table->foreignId('selected_option_id')
                ->nullable()
                ->constrained('quiz_options')
                ->nullOnDelete();

            $table->text('answer_text')
                ->nullable();

            $table->boolean('is_correct')
                ->nullable();

            $table->unsignedInteger('points_awarded')
                ->default(0);

            $table->timestamp('answered_at')
                ->nullable();

            $table->timestamps();

            $table->unique([
                'attempt_id',
                'question_id',
            ]);

            $table->index([
                'question_id',
                'is_correct',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_answers');
    }
};