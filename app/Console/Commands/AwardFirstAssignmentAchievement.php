<?php

namespace App\Console\Commands;

use App\Models\AssignmentSubmission;
use App\Services\AssignmentSubmissionRewardService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Throwable;

class AwardFirstAssignmentAchievement extends Command
{
    protected $signature = 'assignment:award-first-submission
        {submission : Submission ID to evaluate}';

    protected $description = 'Award the first-assignment achievement to an existing first submission';

    public function handle(AssignmentSubmissionRewardService $rewardService): int
    {
        $submission = AssignmentSubmission::query()
            ->with('assignment')
            ->find($this->argument('submission'));

        if (! $submission) {
            $this->error('Submission not found.');
            return self::FAILURE;
        }

        if (! in_array($submission->status, ['submitted', 'late', 'graded', 'returned'], true)) {
            $this->error('The submission is not a final submission.');
            return self::FAILURE;
        }

        try {
            $reward = DB::transaction(fn () => $rewardService->awardFirstSubmissionIfEligible(
                $submission->user,
                $submission,
            ));
        } catch (Throwable $e) {
            $this->error('Achievement award failed: '.$e->getMessage());
            return self::FAILURE;
        }

        if ($reward['awarded']) {
            $this->info("First assignment achievement awarded: +{$reward['points']} points.");
        } else {
            $this->warn('No first-assignment achievement was awarded; the student already has a qualifying submission or achievement.');
        }

        return self::SUCCESS;
    }
}
