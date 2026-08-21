<?php

namespace App\Http\Controllers;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\AssignmentAllocation;
use App\Models\User;
use App\Notifications\AssignmentSubmissionNotification;
use App\Services\AssignmentSubmissionRewardService;
use App\Services\AuditLogService;
use App\Services\CourseAccessService;
use App\Services\StudentDashboardService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class AssignmentController extends Controller
{
    public function __construct(
        protected CourseAccessService $courseAccessService,
        protected StudentDashboardService $studentDashboardService,
        protected AuditLogService $auditLogService,
        protected AssignmentSubmissionRewardService $assignmentSubmissionRewardService,
    ) {
    }

    /**
     * Show assignments belonging to courses where the student has
     * an active enrollment with granted learning access.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user instanceof User, 403);

        $now = now();

        $assignments = Assignment::query()
            ->with([
                'course:id,title,slug,thumbnail_path',
                'module:id,title',
                'lesson:id,title',
            ])
            ->where('status', 'published')
            ->where(function ($query) use ($now) {
                $query
                    ->whereNull('available_from')
                    ->orWhere('available_from', '<=', $now);
            })
            ->whereHas('allocations', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->whereHas('course.enrollments', function ($query) use ($user) {
                $query
                    ->where('user_id', $user->id)
                    ->whereIn('status', ['active', 'completed'])
                    ->whereNotNull('access_granted_at');
            })
            ->orderByRaw('CASE WHEN due_at IS NULL THEN 1 ELSE 0 END')
            ->orderBy('due_at')
            ->orderByDesc('id')
            ->get();

        $submissions = AssignmentSubmission::query()
            ->where('user_id', $user->id)
            ->whereIn('assignment_id', $assignments->pluck('id'))
            ->orderByDesc('attempt_number')
            ->get()
            ->groupBy('assignment_id')
            ->map(fn ($items) => $items->first());

        $items = $assignments->map(function (Assignment $assignment) use ($submissions, $now) {
            $submission = $submissions->get($assignment->id);
            $due = $assignment->due_at;

            return [
                'id' => $assignment->id,
                'title' => $assignment->title,
                'course' => $assignment->course?->title,
                'course_slug' => $assignment->course?->slug,
                'thumbnail_path' => $assignment->course?->thumbnail_path,
                'module' => $assignment->module?->title,
                'lesson' => $assignment->lesson?->title,
                'instructions' => $assignment->instructions,
                'max_points' => $assignment->max_points,
                'available_from' => $assignment->available_from?->toISOString(),
                'due_at' => $due?->toISOString(),
                'submission_type' => $assignment->submission_type,
                'max_file_size_mb' => $assignment->max_file_size_mb,
                'allowed_file_types' => $assignment->allowed_file_types ?? [],
                'assignment_status' => $assignment->status,
                'is_overdue' => $due !== null && $due->isPast(),
                'is_closed' => $assignment->status === 'closed',
                'submission' => $submission ? [
                    'id' => $submission->id,
                    'attempt_number' => $submission->attempt_number,
                    'status' => $submission->status,
                    'score' => $submission->score,
                    'submitted_at' => $submission->submitted_at?->toISOString(),
                    'graded_at' => $submission->graded_at?->toISOString(),
                    'feedback' => $submission->feedback,
                ] : null,
            ];
        })->values();

        $dashboard = $this->studentDashboardService->getDashboardData($user);

        $this->recordAudit('assignment_list_viewed', $request);

        return Inertia::render('Assignments', [
            'student' => $dashboard['student'],
            'stats' => $dashboard['stats'],
            'assignments' => $items->all(),
        ]);
    }

    /**
     * Show one assignment and the student's own submission history.
     */
    public function show(Request $request, int $assignment): Response
    {
        $user = $request->user();

        abort_unless($user instanceof User, 403);

        $item = Assignment::query()
            ->with([
                'course:id,title,slug,thumbnail_path',
                'module:id,title',
                'lesson:id,title',
            ])
            ->where('status', 'published')
            ->findOrFail($assignment);

        abort_unless(
            AssignmentAllocation::query()
                ->where('assignment_id', $item->id)
                ->where('user_id', $user->id)
                ->exists(),
            403,
            'This assignment has not been assigned to you.'
        );

        abort_unless(
            $this->courseAccessService->hasGrantedEnrollment($user, $item->course),
            403,
            'You do not have learning access to this course.'
        );

        $now = now();

        abort_unless(
            $item->available_from === null || $item->available_from->lte($now),
            404
        );

        $submissions = AssignmentSubmission::query()
            ->where('assignment_id', $item->id)
            ->where('user_id', $user->id)
            ->orderByDesc('attempt_number')
            ->get();

        $latest = $submissions->first();

        $dashboard = $this->studentDashboardService->getDashboardData($user);

        $this->recordAudit(
            'assignment_viewed',
            $request,
            $item,
        );

        return Inertia::render('Assignment', [
            'student' => $dashboard['student'],
            'stats' => $dashboard['stats'],
            'assignment' => [
                'id' => $item->id,
                'title' => $item->title,
                'instructions' => $item->instructions,
                'max_points' => $item->max_points,
                'available_from' => $item->available_from?->toISOString(),
                'due_at' => $item->due_at?->toISOString(),
                'submission_type' => $item->submission_type,
                'max_file_size_mb' => $item->max_file_size_mb,
                'allowed_file_types' => $item->allowed_file_types ?? [],
                'status' => $item->status,
                'is_overdue' => $item->due_at !== null && $item->due_at->isPast(),
                'is_closed' => $item->status === 'closed',
                'course' => [
                    'id' => $item->course->id,
                    'title' => $item->course->title,
                    'slug' => $item->course->slug,
                    'thumbnail_path' => $item->course->thumbnail_path,
                ],
                'module' => $item->module?->title,
                'lesson' => $item->lesson?->title,
                'latest_submission' => $latest ? $this->submissionPayload($latest) : null,
                'submissions' => $submissions->map(
                    fn (AssignmentSubmission $submission) => $this->submissionPayload($submission)
                )->values()->all(),
            ],
        ]);
    }

    /**
     * Save or submit a student attempt.
     *
     * Drafts may be saved without final submission. Final submission
     * creates/updates the current attempt and is marked late when the
     * due date has passed.
     */
    public function submit(
        Request $request,
        int $assignment,
    ): RedirectResponse {
        $user = $request->user();

        abort_unless($user instanceof User, 403);

        $item = Assignment::query()
            ->with('course')
            ->where('status', 'published')
            ->findOrFail($assignment);

        abort_unless(
            AssignmentAllocation::query()
                ->where('assignment_id', $item->id)
                ->where('user_id', $user->id)
                ->exists(),
            403,
            'This assignment has not been assigned to you.'
        );

        abort_unless(
            $this->courseAccessService->hasGrantedEnrollment($user, $item->course),
            403,
            'You do not have learning access to this course.'
        );

        abort_unless(
            $item->available_from === null || $item->available_from->lte(now()),
            422,
            'This assignment is not available yet.'
        );

        $mode = $request->input('mode', 'submit');
        abort_unless(in_array($mode, ['draft', 'submit'], true), 422);

        $latestSubmission = AssignmentSubmission::query()
            ->where('assignment_id', $item->id)
            ->where('user_id', $user->id)
            ->orderByDesc('attempt_number')
            ->first();

        // A final submission is immutable while it is awaiting grading. The
        // student must not create another attempt or edit the submitted work.
        if ($latestSubmission && in_array($latestSubmission->status, ['submitted', 'late'], true)) {
            throw ValidationException::withMessages([
                'submission' => 'This assignment has already been submitted and is now awaiting grading. It can no longer be edited.',
            ]);
        }

        if ($latestSubmission && $latestSubmission->status === 'graded') {
            throw ValidationException::withMessages([
                'submission' => 'This assignment has already been graded. Your recorded submission is read-only.',
            ]);
        }

        $isFinalSubmission = $mode === 'submit';

        $rules = [
            'text_content' => [
                in_array($item->submission_type, ['text', 'text_and_file'], true) && $isFinalSubmission
                    ? 'required'
                    : 'nullable',
                'string',
                'max:50000',
            ],
        ];

        if (in_array($item->submission_type, ['file', 'text_and_file'], true)) {
            // A final submit may reuse the file already persisted in the draft.
            $hasPersistedFile = $latestSubmission?->file_path !== null;
            $fileRequired = $isFinalSubmission && ! $hasPersistedFile;
            $fileRules = [$fileRequired ? 'required' : 'nullable', 'file'];

            if ($item->max_file_size_mb !== null) {
                $fileRules[] = 'max:' . ($item->max_file_size_mb * 1024);
            }

            $allowed = $item->allowed_file_types ?? [];

            if ($allowed !== []) {
                $extensions = array_values(array_filter(
                    $allowed,
                    fn ($type) => is_string($type) && !str_contains($type, '/'),
                ));

                if ($extensions !== []) {
                    $fileRules[] = 'mimes:' . implode(',', $extensions);
                }
            }

            $rules['file'] = $fileRules;
        } else {
            $rules['file'] = ['nullable', 'file'];
        }

        $validated = $request->validate($rules);

        $submission = $latestSubmission;
        if ($submission === null) {
            $attempt = ((int) AssignmentSubmission::query()
                ->where('assignment_id', $item->id)
                ->where('user_id', $user->id)
                ->max('attempt_number')) + 1;

            $submission = new AssignmentSubmission([
                'assignment_id' => $item->id,
                'user_id' => $user->id,
                'attempt_number' => $attempt,
            ]);
        }

        $oldFilePath = $submission->file_path;
        $newFilePath = null;
        $reward = [
            'awarded' => false,
            'achievement_id' => null,
            'points' => 0,
        ];
        $emailSent = false;
        $emailFailed = false;
        $emailError = null;

        try {
            DB::transaction(function () use (
                &$submission,
                &$newFilePath,
                &$reward,
                &$emailSent,
                &$emailFailed,
                &$emailError,
                $request,
                $item,
                $user,
                $validated,
                $mode,
            ): void {
                $submission->text_content = $validated['text_content'] ?? null;

                if ($request->hasFile('file')) {
                    $uploaded = $request->file('file');
                    $extension = $uploaded->getClientOriginalExtension();
                    $filename = (string) \Illuminate\Support\Str::uuid() . ($extension ? '.' . $extension : '');

                    $newFilePath = $uploaded->storeAs(
                        "assignments/{$user->id}/{$item->id}",
                        $filename,
                        'local',
                    );

                    $submission->file_path = $newFilePath;
                    $submission->original_filename = $uploaded->getClientOriginalName();
                    $submission->mime_type = $uploaded->getMimeType();
                    $submission->file_size = $uploaded->getSize();
                }

                if ($mode === 'draft') {
                    $submission->status = 'draft';
                    $submission->submitted_at = null;
                } else {
                    $submission->status = $item->due_at !== null && $item->due_at->isPast()
                        ? 'late'
                        : 'submitted';
                    $submission->submitted_at = now();
                }

                $submission->save();

                if ($mode === 'submit') {
                    $reward = $this->assignmentSubmissionRewardService
                        ->awardFirstSubmissionIfEligible($user, $submission->fresh(['assignment']));

                    // Email is a post-submission side effect. A mail transport
                    // failure must never invalidate the student's submission,
                    // uploaded file, lock, or achievement reward.
                    try {
                        Notification::send(
                            $user,
                            new AssignmentSubmissionNotification($submission->fresh(['assignment.course'])),
                        );
                        $emailSent = true;
                    } catch (Throwable $exception) {
                        $emailFailed = true;
                        $emailError = $exception->getMessage();
                        report($exception);
                    }
                }
            });
        } catch (Throwable $exception) {
            if ($newFilePath !== null) {
                Storage::disk('local')->delete($newFilePath);
            }

            throw $exception;
        }

        // Only remove a superseded file after the database transaction has
        // committed. If the database operation fails, the previous draft file
        // remains intact.
        if ($isFinalSubmission && $oldFilePath && $newFilePath && $oldFilePath !== $newFilePath) {
            Storage::disk('local')->delete($oldFilePath);
        }

        $this->recordAudit(
            $mode === 'draft'
                ? 'assignment_draft_saved'
                : 'assignment_submitted',
            $request,
            $item,
            [
                'submission_id' => $submission->id,
                'attempt_number' => $submission->attempt_number,
                'status' => $submission->status,
                'has_file' => $submission->file_path !== null,
                'email_sent' => $emailSent,
                'email_failed' => $emailFailed,
                'achievement_id' => $reward['achievement_id'],
                'points_awarded' => $reward['points'],
            ],
        );

        if ($isFinalSubmission) {
            $this->recordAudit(
                $emailSent
                    ? 'assignment_submission_email_sent'
                    : 'assignment_submission_email_failed',
                $request,
                $item,
                [
                    'submission_id' => $submission->id,
                    'recipient' => $user->email,
                    'has_file' => $submission->file_path !== null,
                    ...($emailFailed ? ['error' => $emailError] : []),
                ],
            );

            if ($reward['awarded']) {
                $this->recordAudit(
                    'assignment_first_submission_achievement_awarded',
                    $request,
                    $item,
                    [
                        'submission_id' => $submission->id,
                        'achievement_id' => $reward['achievement_id'],
                        'points_awarded' => $reward['points'],
                    ],
                );
            }
        }

        return to_route('assignments.show', $item->id)
            ->with(
                'success',
                $mode === 'draft'
                    ? 'Your assignment draft has been saved.'
                    : (
                        $submission->status === 'late'
                            ? 'Your assignment was submitted late and is awaiting grading.'
                            : 'Your assignment has been submitted and is awaiting grading.'
                    )
            );
    }

    /**
     * Download a student's own uploaded submission.
     */
    public function download(
        Request $request,
        int $assignment,
        int $submission,
    ) {
        $user = $request->user();

        abort_unless($user instanceof User, 403);

        $item = Assignment::query()
            ->with('course')
            ->findOrFail($assignment);

        abort_unless(
            AssignmentAllocation::query()
                ->where('assignment_id', $item->id)
                ->where('user_id', $user->id)
                ->exists(),
            403,
            'This assignment has not been assigned to you.'
        );

        abort_unless(
            $this->courseAccessService->hasGrantedEnrollment($user, $item->course),
            403
        );

        $record = AssignmentSubmission::query()
            ->where('id', $submission)
            ->where('assignment_id', $item->id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        abort_unless($record->file_path !== null, 404);

        abort_unless(
            Storage::disk('local')->exists($record->file_path),
            404
        );

        $this->recordAudit(
            'assignment_submission_downloaded',
            $request,
            $item,
            ['submission_id' => $record->id],
        );

        return Storage::disk('local')->download(
            $record->file_path,
            $record->original_filename ?: basename($record->file_path),
            $record->mime_type
                ? ['Content-Type' => $record->mime_type]
                : [],
        );
    }

    /**
     * Direct download endpoint used by the signed submission email link.
     */
    public function downloadFromEmail(
        Request $request,
        int $assignment,
        int $submission,
    ) {
        abort_unless($request->hasValidSignature(), 403);

        $item = Assignment::query()->findOrFail($assignment);
        $record = AssignmentSubmission::query()
            ->whereKey($submission)
            ->where('assignment_id', $item->id)
            ->firstOrFail();

        abort_unless($record->file_path !== null, 404);
        abort_unless(Storage::disk('local')->exists($record->file_path), 404);

        return Storage::disk('local')->download(
            $record->file_path,
            $record->original_filename ?: basename($record->file_path),
            $record->mime_type
                ? ['Content-Type' => $record->mime_type]
                : [],
        );
    }

    /**
     * Render the generated transcript for a graded submission.
     */
    public function transcript(
        Request $request,
        int $assignment,
        int $submission,
    ) {
        $user = $request->user();

        abort_unless($user instanceof User, 403);

        $item = Assignment::query()
            ->with('course')
            ->findOrFail($assignment);

        abort_unless(
            AssignmentAllocation::query()
                ->where('assignment_id', $item->id)
                ->where('user_id', $user->id)
                ->exists(),
            403,
        );

        abort_unless(
            $this->courseAccessService->hasGrantedEnrollment($user, $item->course),
            403,
        );

        $record = AssignmentSubmission::query()
            ->whereKey($submission)
            ->where('assignment_id', $item->id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        abort_unless($record->status === 'graded', 404);
        abort_unless($record->transcript_path !== null, 404);
        abort_unless(Storage::disk('local')->exists($record->transcript_path), 404);

        $this->recordAudit(
            'assignment_transcript_downloaded',
            $request,
            $item,
            ['submission_id' => $record->id],
        );

        $filename = 'Learn-With-Flevian-Assignment-Transcript-' . $record->id . '.pdf';

        return response()->download(
            Storage::disk('local')->path($record->transcript_path),
            $filename,
            ['Content-Type' => 'application/pdf'],
        );
    }

    protected function submissionPayload(
        AssignmentSubmission $submission,
    ): array {
        return [
            'id' => $submission->id,
            'attempt_number' => $submission->attempt_number,
            'status' => $submission->status,
            'score' => $submission->score,
            'feedback' => $submission->feedback,
            'text_content' => $submission->text_content,
            'submitted_at' => $submission->submitted_at?->toISOString(),
            'graded_at' => $submission->graded_at?->toISOString(),
            'original_filename' => $submission->original_filename,
            'mime_type' => $submission->mime_type,
            'file_size' => $submission->file_size,
            'has_file' => $submission->file_path !== null,
            'download_url' => $submission->file_path
                ? route('assignments.submissions.download', [
                    'assignment' => $submission->assignment_id,
                    'submission' => $submission->id,
                ])
                : null,
            'transcript_url' => $submission->transcript_path
                ? route('assignments.submissions.transcript', [
                    'assignment' => $submission->assignment_id,
                    'submission' => $submission->id,
                ])
                : null,
            'transcript_ready' => $submission->transcript_path !== null && $submission->status === 'graded',
        ];
    }

    protected function recordAudit(
        string $eventType,
        Request $request,
        ?Assignment $assignment = null,
        array $metadata = [],
    ): void {
        try {
            $this->auditLogService->resourceEvent(
                $eventType,
                'assignment',
                $assignment?->id ?? 0,
                $request,
                [
                    'action' => $eventType,
                    'metadata' => $metadata,
                ],
            );
        } catch (Throwable) {
            // Audit logging must never block assignment work.
        }
    }
}
