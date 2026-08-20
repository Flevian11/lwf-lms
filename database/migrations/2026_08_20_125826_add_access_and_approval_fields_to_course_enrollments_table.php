<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('course_enrollments', function (Blueprint $table) {
            $table->enum('source', [
                'free',
                'payment',
                'admin',
            ])
                ->default('free')
                ->after('course_id');

            $table->foreignId('payment_id')
                ->nullable()
                ->after('source')
                ->constrained('payments')
                ->nullOnDelete();

            $table->foreignId('approved_by')
                ->nullable()
                ->after('payment_id')
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('approved_at')
                ->nullable()
                ->after('approved_by');

            $table->timestamp('access_granted_at')
                ->nullable()
                ->after('approved_at');

            $table->index([
                'user_id',
                'source',
            ]);

            $table->index([
                'course_id',
                'source',
            ]);

            $table->index([
                'approved_by',
                'approved_at',
            ]);

            $table->index([
                'access_granted_at',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('course_enrollments', function (Blueprint $table) {
            $table->dropForeign([
                'payment_id',
            ]);

            $table->dropForeign([
                'approved_by',
            ]);

            $table->dropIndex([
                'user_id',
                'source',
            ]);

            $table->dropIndex([
                'course_id',
                'source',
            ]);

            $table->dropIndex([
                'approved_by',
                'approved_at',
            ]);

            $table->dropIndex([
                'access_granted_at',
            ]);

            $table->dropColumn([
                'source',
                'payment_id',
                'approved_by',
                'approved_at',
                'access_granted_at',
            ]);
        });
    }
};