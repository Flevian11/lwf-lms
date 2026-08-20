<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->enum('access_type', [
                'free',
                'paid',
            ])
                ->default('free')
                ->after('status');

            $table->decimal('price', 12, 2)
                ->default(0)
                ->after('access_type');

            $table->char('currency', 3)
                ->default('KES')
                ->after('price');

            $table->index([
                'access_type',
                'status',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropIndex([
                'access_type',
                'status',
            ]);

            $table->dropColumn([
                'access_type',
                'price',
                'currency',
            ]);
        });
    }
};