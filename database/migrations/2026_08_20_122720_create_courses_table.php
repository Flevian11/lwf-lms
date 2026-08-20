<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->id();

            $table->foreignId('category_id')
                ->constrained('course_categories')
                ->restrictOnDelete();

            $table->foreignId('created_by')
                ->constrained('users')
                ->restrictOnDelete();

            $table->string('title', 200);
            $table->string('slug', 220)->unique();

            $table->string('short_description', 500)->nullable();
            $table->longText('description')->nullable();

            $table->string('thumbnail_path')->nullable();

            $table->enum('level', [
                'beginner',
                'intermediate',
                'advanced',
            ])->default('beginner');

            $table->enum('status', [
                'draft',
                'published',
                'archived',
            ])->default('draft')->index();

            $table->timestamp('published_at')->nullable();

            $table->timestamps();

            $table->index(['category_id', 'status']);
            $table->index(['created_by', 'status']);
            $table->index(['status', 'published_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};