<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('payments')) {
            Schema::create('payments', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('course_id')->constrained()->restrictOnDelete();
                $table->decimal('amount', 12, 2);
                $table->char('currency', 3)->default('KES');
                $table->string('provider', 64);
                $table->string('payment_method', 64)->nullable();
                $table->string('status', 32)->default('pending');
                $table->string('provider_reference', 191)->nullable()->index();
                $table->string('description')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamp('requested_at')->nullable();
                $table->timestamp('processing_at')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->timestamp('failed_at')->nullable();
                $table->timestamp('cancelled_at')->nullable();
                $table->timestamp('refunded_at')->nullable();
                $table->timestamps();
                $table->index(['user_id', 'status']);
                $table->index(['course_id', 'status']);
                $table->index(['provider', 'status']);
                $table->index(['status', 'created_at']);
            });
        }

        if (! Schema::hasTable('payment_transactions')) {
            Schema::create('payment_transactions', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('payment_id')->constrained('payments')->cascadeOnDelete();
                $table->string('provider', 64);
                $table->string('transaction_reference', 191)->nullable()->index();
                $table->string('merchant_request_id', 191)->nullable()->index();
                $table->string('checkout_request_id', 191)->nullable()->index();
                $table->string('receipt_number', 191)->nullable()->index();
                $table->string('result_code', 64)->nullable();
                $table->string('result_description', 500)->nullable();
                $table->string('status', 32)->default('initiated');
                $table->json('request_payload')->nullable();
                $table->json('response_payload')->nullable();
                $table->timestamp('processed_at')->nullable();
                $table->timestamps();
                $table->index(['payment_id', 'status']);
                $table->index(['provider', 'status']);
                $table->index('processed_at');
            });
        }

        if (Schema::hasTable('course_enrollments') && ! Schema::hasColumn('course_enrollments', 'payment_id')) {
            Schema::table('course_enrollments', function (Blueprint $table): void {
                $table->foreignId('payment_id')->nullable()->after('source')->constrained('payments')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        // Deliberately non-destructive: payment data is financial history and
        // must not be dropped by rolling back this compatibility migration.
    }
};
