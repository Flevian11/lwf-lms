<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('course_modules', function (Blueprint $table) {
            $table->boolean('is_preview')
                ->default(false)
                ->after('position');

            $table->index([
                'course_id',
                'is_preview',
                'position',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('course_modules', function (Blueprint $table) {
            $table->dropIndex([
                'course_id',
                'is_preview',
                'position',
            ]);

            $table->dropColumn('is_preview');
        });
    }
};