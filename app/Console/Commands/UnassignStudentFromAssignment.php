<?php

namespace App\Console\Commands;

use App\Models\Assignment;
use App\Models\AssignmentAllocation;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class UnassignStudentFromAssignment extends Command
{
    protected $signature = 'assignment:unassign
        {assignment : Assignment ID}
        {student : Student user ID or email}';

    protected $description = 'Remove an assignment allocation from a student';

    public function handle(): int
    {
        $assignment = Assignment::query()->find($this->argument('assignment'));
        if (! $assignment) {
            $this->error('Assignment not found.');
            return self::FAILURE;
        }

        $value = (string) $this->argument('student');
        $student = User::query()
            ->where(function ($query) use ($value): void {
                $query->whereKey(is_numeric($value) ? (int) $value : 0)
                    ->orWhere('email', $value);
            })
            ->first();

        if (! $student) {
            $this->error('Student not found by ID or email.');
            return self::FAILURE;
        }

        $deleted = DB::transaction(fn (): int => AssignmentAllocation::query()
            ->where('assignment_id', $assignment->id)
            ->where('user_id', $student->id)
            ->delete());

        if ($deleted === 0) {
            $this->warn('No allocation exists for this student and assignment.');
            return self::SUCCESS;
        }

        $this->info("Removed '{$assignment->title}' from {$student->name} ({$student->email}).");

        return self::SUCCESS;
    }
}
