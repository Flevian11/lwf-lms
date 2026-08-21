<?php

namespace App\Console\Commands;

use App\Models\Assignment;
use App\Models\AssignmentAllocation;
use App\Models\User;
use App\Services\CourseAccessService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Throwable;
use App\Enums\UserStatus;

class AssignStudentToAssignment extends Command
{
    protected $signature = 'assignment:assign
        {assignment : Assignment ID}
        {student : Student user ID or email}
        {--assigned-by= : Admin/user ID performing the allocation}';

    protected $description = 'Explicitly allocate an assignment to an eligible student';

    public function handle(CourseAccessService $courseAccessService): int
    {
        $assignment = Assignment::query()->with('course')->find($this->argument('assignment'));

        if (! $assignment) {
            $this->error('Assignment not found.');
            return self::FAILURE;
        }

        $student = User::query()
            ->where(function ($query): void {
                $value = (string) $this->argument('student');
                $query->whereKey(is_numeric($value) ? (int) $value : 0)
                    ->orWhere('email', $value);
            })
            ->first();

        if (! $student) {
            $this->error('Student not found by ID or email.');
            return self::FAILURE;
        }

      if ($student->status !== UserStatus::ACTIVE) {
    $this->error('The selected student is not active.');
    return self::FAILURE;
}

        if (! $courseAccessService->hasGrantedEnrollment($student, $assignment->course)) {
            $this->error('Student does not have granted access to the assignment course.');
            return self::FAILURE;
        }

        $assignedBy = $this->option('assigned-by');
        if ($assignedBy !== null) {
            $assigner = User::query()->find($assignedBy);
            if (! $assigner) {
                $this->error('The --assigned-by user was not found.');
                return self::FAILURE;
            }
        }

        try {
            $allocation = DB::transaction(function () use ($assignment, $student, $assignedBy): AssignmentAllocation {
                return AssignmentAllocation::query()->firstOrCreate(
                    [
                        'assignment_id' => $assignment->id,
                        'user_id' => $student->id,
                    ],
                    [
                        'assigned_by' => $assignedBy !== null ? (int) $assignedBy : null,
                        'assigned_at' => now(),
                    ],
                );
            });
        } catch (Throwable $e) {
            $this->error('Allocation failed: ' . $e->getMessage());
            return self::FAILURE;
        }

        if ($allocation->wasRecentlyCreated) {
            $this->info("Assigned '{$assignment->title}' to {$student->name} ({$student->email}).");
        } else {
            $this->warn('That assignment is already allocated to this student.');
        }

        return self::SUCCESS;
    }
}
