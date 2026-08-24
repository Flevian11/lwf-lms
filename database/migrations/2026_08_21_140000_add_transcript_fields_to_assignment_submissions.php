<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('assignment_submissions', 'transcript_path')
            || ! Schema::hasColumn('assignment_submissions', 'transcript_generated_at')) {
            
            Schema::table('assignment_submissions', function (Blueprint $table): void {
                if (! Schema::hasColumn('assignment_submissions', 'transcript_path')) {
                    $table->string('transcript_path')->nullable()->after('graded_at');
                }

                if (! Schema::hasColumn('assignment_submissions', 'transcript_generated_at')) {
                    $table->timestamp('transcript_generated_at')
                        ->nullable()
                        ->after('transcript_path');
                }
            });
        }
    }

    public function down(): void
    {
        $columns = [];

        if (Schema::hasColumn('assignment_submissions', 'transcript_path')) {
            $columns[] = 'transcript_path';
        }

        if (Schema::hasColumn('assignment_submissions', 'transcript_generated_at')) {
            $columns[] = 'transcript_generated_at';
        }

        if ($columns !== []) {
            Schema::table('assignment_submissions', function (Blueprint $table) use ($columns): void {
                $table->dropColumn($columns);
            });
        }
    }
};
