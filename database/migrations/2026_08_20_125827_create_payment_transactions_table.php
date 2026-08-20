<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('payment_id')
                ->constrained('payments')
                ->cascadeOnDelete();

            $table->string('provider', 64);

            $table->string('transaction_reference', 191)
                ->nullable();

            $table->string('merchant_request_id', 191)
                ->nullable();

            $table->string('checkout_request_id', 191)
                ->nullable();

            $table->string('receipt_number', 191)
                ->nullable();

            $table->string('result_code', 64)
                ->nullable();

            $table->string('result_description', 500)
                ->nullable();

            $table->enum('status', [
                'initiated',
                'pending',
                'successful',
                'failed',
                'cancelled',
            ])->default('initiated');

            $table->json('request_payload')
                ->nullable();

            $table->json('response_payload')
                ->nullable();

            $table->timestamp('processed_at')
                ->nullable();

            $table->timestamps();

            $table->index([
                'payment_id',
                'status',
            ]);

            $table->index([
                'provider',
                'status',
            ]);

            $table->index([
                'transaction_reference',
            ]);

            $table->index([
                'merchant_request_id',
            ]);

            $table->index([
                'checkout_request_id',
            ]);

            $table->index([
                'receipt_number',
            ]);

            $table->index([
                'processed_at',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
    }
};