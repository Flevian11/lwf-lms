<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_modules', function (Blueprint $table) {
            $table->id();

            $table->foreignId('course_id')
                ->constrained('courses')
                ->cascadeOnDelete();

            $table->string('title', 200);
            $table->text('description')->nullable();

            $table->unsignedInteger('position');

            $table->timestamps();

            $table->unique([
                'course_id',
                'position',
            ]);

            $table->index([
                'course_id',
                'position',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_modules');
    }
};