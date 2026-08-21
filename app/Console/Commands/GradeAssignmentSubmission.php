<?php

namespace App\Console\Commands;

use App\Models\AssignmentSubmission;
use App\Services\AssignmentGradingService;
use Illuminate\Console\Command;
use Throwable;

class GradeAssignmentSubmission extends Command
{
    protected $signature = 'assignment:grade
        {submission : Submission ID}
        {score : Score awarded}
        {--feedback= : Instructor feedback}
        {--graded-by= : Admin/instructor user ID}';

    protected $description = 'Grade an assignment submission and generate its transcript';

    public function handle(AssignmentGradingService $gradingService): int
    {
        $submission = AssignmentSubmission::query()
            ->with('assignment')
            ->find($this->argument('submission'));

        if (! $submission) {
            $this->error('Submission not found.');
            return self::FAILURE;
        }

        $score = filter_var($this->argument('score'), FILTER_VALIDATE_INT);
        if ($score === false) {
            $this->error('Score must be a whole number.');
            return self::FAILURE;
        }

        $gradedBy = $this->option('graded-by');
        if ($gradedBy !== null && ! is_numeric($gradedBy)) {
            $this->error('--graded-by must be a user ID.');
            return self::FAILURE;
        }

        try {
            $graded = $gradingService->grade(
                $submission,
                (int) $score,
                $this->option('feedback'),
                $gradedBy !== null ? (int) $gradedBy : null,
            );
        } catch (Throwable $e) {
            $this->error('Grading failed: ' . $e->getMessage());
            return self::FAILURE;
        }

        $this->info(
            "Submission {$graded->id} graded: {$graded->score}/{$graded->assignment->max_points}. " .
            'PDF transcript generated automatically.'
        );

        return self::SUCCESS;
    }
}
