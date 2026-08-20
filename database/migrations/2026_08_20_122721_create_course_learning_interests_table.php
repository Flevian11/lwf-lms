<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_learning_interest', function (Blueprint $table) {
            $table->foreignId('course_id')
                ->constrained('courses')
                ->cascadeOnDelete();

            $table->foreignId('learning_interest_id')
                ->constrained('learning_interests')
                ->cascadeOnDelete();

            $table->primary([
                'course_id',
                'learning_interest_id',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_learning_interest');
    }
};