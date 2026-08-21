<?php

namespace App\Http\Controllers;

use App\Models\CourseEnrollment;
use App\Models\User;
use App\Services\AuditLogService;
use App\Services\CertificateService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class CertificateController extends Controller
{
    public function __construct(
        protected CertificateService $certificateService,
        protected AuditLogService $auditLogService,
    ) {
    }

    public function download(Request $request, int $enrollment): SymfonyResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        $record = CourseEnrollment::query()
            ->with(['course', 'user'])
            ->whereKey($enrollment)
            ->where('user_id', $user->id)
            ->where('status', 'completed')
            ->whereNotNull('completed_at')
            ->firstOrFail();

        $pdf = $this->certificateService->render($record);

        $this->auditLogService->resourceEvent(
            'certificate_downloaded',
            'course_enrollment',
            $record->id,
            $request,
            [
                'user_id' => $user->id,
                'actor_type' => 'user',
                'action' => 'download_certificate',
                'metadata' => [
                    'course_id' => $record->course_id,
                    'course_title' => $record->course?->title,
                    'completed_at' => $record->completed_at?->toISOString(),
                ],
            ],
        );

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $this->certificateService->filename($record) . '"',
            'Content-Length' => strlen($pdf),
        ]);
    }
}
