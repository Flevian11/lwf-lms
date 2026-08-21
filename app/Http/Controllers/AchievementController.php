<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AcademicTranscriptService;
use App\Services\AuditLogService;
use App\Services\StudentAchievementService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class AchievementController extends Controller
{
    public function __construct(
        protected StudentAchievementService $achievementService,
        protected AcademicTranscriptService $transcriptService,
        protected AuditLogService $auditLogService,
    ) {
    }

    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        $dashboard = app(\App\Services\StudentDashboardService::class)->getDashboardData($user);
        $payload = $this->achievementService->build($user);

        $this->auditLogService->userEvent('achievements_page_viewed', $request, [
            'action' => 'view_achievements',
            'metadata' => [
                'achievement_count' => $payload['stats']['achievements'],
                'completed_course_count' => $payload['stats']['completed_courses'],
            ],
        ]);

        return Inertia::render('Achievements', [
    ...$payload,
    'student' => $dashboard['student'],
    'stats' => array_merge(
        $dashboard['stats'],
        $payload['stats'] ?? [],
    ),
    'transcript_url' => route('achievements.transcript'),
]);
    }

    public function transcript(Request $request, AcademicTranscriptService $service): SymfonyResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        $pdf = $service->render($user);

        $this->auditLogService->userEvent('academic_transcript_downloaded', $request, [
            'action' => 'download_transcript',
            'metadata' => [
                'user_id' => $user->id,
            ],
        ]);

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="Learn-With-Flevian-Academic-Transcript.pdf"',
            'Content-Length' => strlen($pdf),
        ]);
    }
}
