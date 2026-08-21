<?php

namespace App\Console\Commands;

use App\Models\QuizAttempt;
use App\Services\AuditLogService;
use App\Services\QuizAttemptService;
use Illuminate\Console\Command;

class ExpireQuizAttempts extends Command
{
    protected $signature = 'quiz:expire-attempts';

    protected $description = 'Automatically submit quiz attempts whose server-side time limit has expired.';

    public function handle(
        QuizAttemptService $quizAttemptService,
        AuditLogService $auditLogService,
    ): int {
        $expired = 0;

        QuizAttempt::query()
            ->with(['user', 'quiz'])
            ->where('status', 'in_progress')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->orderBy('id')
            ->chunkById(50, function ($attempts) use ($quizAttemptService, $auditLogService, &$expired): void {
                foreach ($attempts as $attempt) {
                    $result = $quizAttemptService->submit(
                        $attempt->user,
                        $attempt,
                        [],
                        'time_expired',
                    );

                    $auditLogService->systemEvent(
                        'quiz_time_expired',
                        null,
                        [
                            'resource_type' => 'quiz',
                            'resource_id' => $attempt->quiz_id,
                            'user_id' => $attempt->user_id,
                            'metadata' => [
                                'attempt_id' => $result->id,
                                'attempt_number' => $result->attempt_number,
                            ],
                        ],
                    );

                    $expired++;
                }
            });

        $this->info("Expired quiz attempts submitted: {$expired}.");

        return self::SUCCESS;
    }
}
