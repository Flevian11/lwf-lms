<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class AdminStudentController extends Controller
{
    public function __construct(protected AuditLogService $auditLogService) {}

    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $status = (string) $request->string('status', 'all');

        $studentScope = function ($q) {
            $q->whereHas('roles', fn ($role) => $role->where('name', 'Student'))
                ->orWhereHas('courseEnrollments');
        };

        $query = User::query()
            ->where($studentScope)
            ->whereDoesntHave('roles', fn ($role) => $role->where('name', 'Admin'))
            ->withCount(['courseEnrollments', 'assignmentSubmissions', 'quizAttempts'])
            ->when($search !== '', fn ($q) => $q->where(function ($w) use ($search) {
                $w->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            }))
            ->when(in_array($status, ['active', 'inactive'], true), fn ($q) => $q->where('status', $status))
            ->latest('created_at');

        $scope = User::query()
            ->where($studentScope)
            ->whereDoesntHave('roles', fn ($role) => $role->where('name', 'Admin'));

        return Inertia::render('Admin/Students', [
            'admin' => $this->adminPayload($request),
            'students' => $query->paginate(10)->withQueryString()->through(fn (User $student) => [
                'id' => $student->id,
                'name' => $student->name,
                'email' => $student->email,
                'status' => $student->status?->value ?? (string) $student->status,
                'avatar_path' => $student->avatar_path,
                'email_verified_at' => $student->email_verified_at?->toISOString(),
                'created_at' => $student->created_at?->toISOString(),
                'course_enrollments_count' => $student->course_enrollments_count,
                'assignment_submissions_count' => $student->assignment_submissions_count,
                'quiz_attempts_count' => $student->quiz_attempts_count,
            ]),
            'filters' => ['search' => $search, 'status' => $status],
            'stats' => [
                'total' => (clone $scope)->count(),
                'active' => (clone $scope)->where('status', 'active')->count(),
                'inactive' => (clone $scope)->where('status', 'inactive')->count(),
                'verified' => (clone $scope)->whereNotNull('email_verified_at')->count(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:120'], 'email' => ['required', 'email', 'max:255', 'unique:users,email'], 'password' => ['required', 'string', 'min:8']]);
        $student = User::create(['name' => $data['name'], 'email' => $data['email'], 'password' => Hash::make($data['password']), 'status' => 'active']);
        $student->assignRole('Student');
        $this->auditLogService->resourceEvent('student_created', 'user', $student->id, ['action' => 'create_student', 'metadata' => ['email' => $student->email]]);
        return back()->with('success', 'Student account created.');
    }

    public function update(Request $request, int $student)
    {
        $record = User::query()->whereHas('roles', fn ($role) => $role->where('name', 'Student'))->findOrFail($student);
        $data = $request->validate(['name' => ['required', 'string', 'max:120'], 'email' => ['required', 'email', 'max:255', 'unique:users,email,'.$record->id]]);
        $record->update($data);
        $this->auditLogService->resourceEvent('student_updated', 'user', $record->id, ['action' => 'update_student', 'metadata' => ['email' => $record->email]]);
        return back()->with('success', 'Student updated.');
    }

    public function toggleStatus(Request $request, int $student)
    {
        $record = User::query()->whereHas('roles', fn ($role) => $role->where('name', 'Student'))->findOrFail($student);
        $next = $record->status->value === 'active' ? 'inactive' : 'active';
        $record->update(['status' => $next]);
        $this->auditLogService->resourceEvent('student_status_changed', 'user', $record->id, ['action' => 'change_student_status', 'metadata' => ['status' => $next]]);
        return back()->with('success', 'Student account status updated.');
    }

    public function destroy(Request $request, int $student)
    {
        $record = User::query()->whereHas('roles', fn ($role) => $role->where('name', 'Student'))->findOrFail($student);
        if ($record->courseEnrollments()->exists() || $record->assignmentSubmissions()->exists() || $record->quizAttempts()->exists()) {
            return back()->withErrors(['student' => 'This student has learning records. Deactivate the account instead of permanently deleting it.']);
        }
        $record->delete();
        $this->auditLogService->resourceEvent('student_deleted', 'user', $student, ['action' => 'delete_student']);
        return back()->with('success', 'Student account removed.');
    }

    private function adminPayload(Request $request): array
    {
        $admin = $request->user();
        return ['id' => $admin->id, 'name' => $admin->name, 'email' => $admin->email, 'avatar_path' => $admin->avatar_path, 'email_two_factor_enabled' => (bool) $admin->email_two_factor_enabled];
    }
}
