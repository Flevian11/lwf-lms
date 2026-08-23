<?php

namespace App\Http\Controllers;

use App\Models\CourseEnrollment;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AdminEnrollmentController extends Controller
{
    public function __construct(protected AuditLogService $auditLogService) {}

    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $status = (string) $request->string('status', 'all');
        $courseId = (int) $request->integer('course_id');

        $base = CourseEnrollment::query()
            ->with([
                'user:id,name,email,avatar_path',
                'course:id,title',
            ])
            ->when($search !== '', fn ($q) => $q->where(function ($searchQuery) use ($search) {
                $searchQuery
                    ->whereHas('user', fn ($u) => $u
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%"))
                    ->orWhereHas('course', fn ($c) => $c
                        ->where('title', 'like', "%{$search}%"));
            }))
            ->when(in_array($status, ['active', 'completed', 'paused', 'cancelled'], true), fn ($q) => $q->where('status', $status))
            ->when($courseId > 0, fn ($q) => $q->where('course_id', $courseId));

        $pending = (clone $base)
            ->whereNull('access_granted_at')
            ->whereNotIn('status', ['cancelled', 'paused'])
            ->latest('enrolled_at')
            ->paginate(8, ['*'], 'pending_page')
            ->withQueryString()
            ->through(fn ($e) => $this->enrollmentPayload($e));

        $fullAccess = (clone $base)
            ->whereNotNull('access_granted_at')
            ->whereNotIn('status', ['cancelled'])
            ->latest('access_granted_at')
            ->paginate(8, ['*'], 'access_page')
            ->withQueryString()
            ->through(fn ($e) => $this->enrollmentPayload($e));

        return Inertia::render('Admin/Enrollments', [
            'admin' => $this->adminPayload($request),
            'pending' => $pending,
            'full_access' => $fullAccess,
            'courses' => DB::table('courses')->select('id', 'title')->orderBy('title')->get(),
            'filters' => [
                'search' => $search,
                'status' => $status,
                'course_id' => $courseId,
            ],
            'stats' => [
                'total' => CourseEnrollment::count(),
                'active' => CourseEnrollment::where('status', 'active')->count(),
                'completed' => CourseEnrollment::where('status', 'completed')->count(),
                'pending' => CourseEnrollment::whereNull('access_granted_at')->whereNotIn('status', ['cancelled'])->count(),
                'full_access' => CourseEnrollment::whereNotNull('access_granted_at')->whereNotIn('status', ['cancelled'])->count(),
                'awaiting_access' => CourseEnrollment::whereNull('access_granted_at')->whereNotIn('status', ['cancelled', 'paused'])->count(),
                'paused' => CourseEnrollment::where('status', 'paused')->count(),
                'cancelled' => CourseEnrollment::where('status', 'cancelled')->count(),
            ],
        ]);
    }

    private function enrollmentPayload(CourseEnrollment $e): array
    {
        return [
            'id' => $e->id,
            'status' => $e->status,
            'enrolled_at' => $e->enrolled_at?->toISOString(),
            'approved_at' => $e->approved_at?->toISOString(),
            'access_granted_at' => $e->access_granted_at?->toISOString(),
            'user' => [
                'id' => $e->user?->id,
                'name' => $e->user?->name,
                'email' => $e->user?->email,
                'avatar_path' => $e->user?->avatar_path,
            ],
            'course' => [
                'id' => $e->course?->id,
                'title' => $e->course?->title,
            ],
        ];
    }

    public function approve(Request $request, int $enrollment)
    {
        $record = CourseEnrollment::with(['user', 'course'])->findOrFail($enrollment);
        $record->forceFill(['status' => 'active', 'approved_by' => $request->user()->id, 'approved_at' => now(), 'access_granted_at' => now(), 'started_at' => $record->started_at ?: now()])->save();
        $this->auditLogService->resourceEvent('enrollment_approved', 'course_enrollment', $record->id, ['action' => 'approve_enrollment', 'metadata' => ['user_id' => $record->user_id, 'course_id' => $record->course_id, 'access_granted' => true]]);
        return back()->with('success', 'Enrollment approved and course access granted.');
    }

    public function revokeAccess(Request $request, int $enrollment)
    {
        $record = CourseEnrollment::with(['user', 'course'])->findOrFail($enrollment);

        $record->forceFill([
            'access_granted_at' => null,
        ])->save();

        $this->auditLogService->resourceEvent('enrollment_access_revoked', 'course_enrollment', $record->id, [
            'action' => 'revoke_course_access',
            'metadata' => [
                'user_id' => $record->user_id,
                'course_id' => $record->course_id,
            ],
        ]);

        return back()->with('success', 'Course access revoked. The enrollment remains on record.');
    }

    public function suspend(Request $request, int $enrollment)
    {
        $record = CourseEnrollment::findOrFail($enrollment);
        $record->update(['status' => 'paused']);
        $this->auditLogService->resourceEvent('enrollment_suspended', 'course_enrollment', $record->id, ['action' => 'suspend_enrollment']);
        return back()->with('success', 'Enrollment paused.');
    }

    public function cancel(Request $request, int $enrollment)
    {
        $record = CourseEnrollment::findOrFail($enrollment);
        $record->update(['status' => 'cancelled']);
        $this->auditLogService->resourceEvent('enrollment_cancelled', 'course_enrollment', $record->id, ['action' => 'cancel_enrollment']);
        return back()->with('success', 'Enrollment cancelled.');
    }

    public function grantAccess(Request $request, int $enrollment)
    {
        $record = CourseEnrollment::findOrFail($enrollment);
        $record->forceFill(['access_granted_at' => now(), 'approved_by' => $record->approved_by ?: $request->user()->id, 'approved_at' => $record->approved_at ?: now(), 'status' => $record->status === 'cancelled' ? 'active' : $record->status])->save();
        $this->auditLogService->resourceEvent('enrollment_access_granted', 'course_enrollment', $record->id, ['action' => 'grant_course_access', 'metadata' => ['user_id' => $record->user_id, 'course_id' => $record->course_id]]);
        return back()->with('success', 'Course access granted.');
    }

    private function adminPayload(Request $request): array
    {
        $admin = $request->user();
        return ['id' => $admin->id, 'name' => $admin->name, 'email' => $admin->email, 'avatar_path' => $admin->avatar_path, 'email_two_factor_enabled' => (bool) $admin->email_two_factor_enabled];
    }
}
