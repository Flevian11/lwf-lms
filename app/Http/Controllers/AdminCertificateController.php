<?php

namespace App\Http\Controllers;

use App\Models\CourseEnrollment;
use App\Services\AuditLogService;
use App\Services\CertificateService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class AdminCertificateController extends Controller
{
    public function __construct(
        protected CertificateService $certificateService,
        protected AuditLogService $auditLogService,
    ) {
    }

    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));

        $certificates = CourseEnrollment::query()
            ->with(['user:id,name,email,avatar_path', 'course:id,title'])
            ->where('status', 'completed')
            ->whereNotNull('completed_at')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->whereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"))
                        ->orWhereHas('course', fn ($c) => $c->where('title', 'like', "%{$search}%"));
                });
            })
            ->latest('completed_at')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('Admin/Certificates', [
            'admin' => $request->user()->only(['id', 'name', 'email', 'avatar_path', 'email_two_factor_enabled']),
            'certificates' => $certificates,
            'filters' => ['search' => $search],
            'stats' => [
                'eligible' => CourseEnrollment::where('status', 'completed')->whereNotNull('completed_at')->count(),
                'this_month' => CourseEnrollment::where('status', 'completed')->whereNotNull('completed_at')->whereMonth('completed_at', now()->month)->whereYear('completed_at', now()->year)->count(),
            ],
        ]);
    }

    public function download(Request $request, CourseEnrollment $enrollment): SymfonyResponse
    {
        abort_unless($enrollment->status === 'completed' && $enrollment->completed_at !== null, 404);

        $enrollment->load(['course', 'user']);
        $pdf = $this->certificateService->render($enrollment);

        $this->auditLogService->resourceEvent(
            'admin_certificate_downloaded',
            'course_enrollment',
            $enrollment->id,
            $request,
            [
                'action' => 'admin_download_certificate',
                'metadata' => [
                    'user_id' => $enrollment->user_id,
                    'course_id' => $enrollment->course_id,
                    'course_title' => $enrollment->course?->title,
                ],
            ],
        );

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $this->certificateService->filename($enrollment) . '"',
            'Content-Length' => strlen($pdf),
        ]);
    }
}
