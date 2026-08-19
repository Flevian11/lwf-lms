<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('email_two_factor_codes', function (Blueprint $table): void {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            /*
             * Never store the actual OTP.
             * Only its SHA-256 hash is stored.
             */
            $table->string('code_hash', 64);

            $table->timestamp('expires_at');

            $table->timestamp('used_at')
                ->nullable();

            $table->unsignedTinyInteger('attempts')
                ->default(0);

            $table->timestamps();

            $table->index([
                'user_id',
                'expires_at',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('email_two_factor_codes');
    }
};