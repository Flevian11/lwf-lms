<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('course_id')
                ->constrained('courses')
                ->restrictOnDelete();

            $table->decimal('amount', 12, 2);

            $table->char('currency', 3)
                ->default('KES');

            $table->string('provider', 64);

            $table->string('payment_method', 64)
                ->nullable();

            $table->enum('status', [
                'pending',
                'processing',
                'successful',
                'failed',
                'cancelled',
                'refunded',
                'partially_refunded',
            ])->default('pending');

            $table->string('provider_reference', 191)
                ->nullable();

            $table->string('description', 255)
                ->nullable();

            $table->json('metadata')
                ->nullable();

            $table->timestamp('requested_at')
                ->nullable();

            $table->timestamp('processing_at')
                ->nullable();

            $table->timestamp('completed_at')
                ->nullable();

            $table->timestamp('failed_at')
                ->nullable();

            $table->timestamp('cancelled_at')
                ->nullable();

            $table->timestamp('refunded_at')
                ->nullable();

            $table->timestamps();

            $table->index([
                'user_id',
                'status',
            ]);

            $table->index([
                'course_id',
                'status',
            ]);

            $table->index([
                'provider',
                'status',
            ]);

            $table->index([
                'status',
                'created_at',
            ]);

            $table->index([
                'provider_reference',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};