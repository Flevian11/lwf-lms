<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizQuestion;
use App\Models\User;
use App\Services\AuditLogService;
use App\Services\CourseAccessService;
use App\Services\QuizAttemptService;
use App\Services\StudentDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class QuizController extends Controller
{
    public function __construct(
        protected CourseAccessService $courseAccessService,
        protected StudentDashboardService $studentDashboardService,
        protected QuizAttemptService $quizAttemptService,
        protected AuditLogService $auditLogService,
    ) {
    }

    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        $courseIds = $user->courseEnrollments()
            ->whereIn('status', ['active', 'completed'])
            ->whereNotNull('access_granted_at')
            ->pluck('course_id');

        $quizzes = Quiz::query()
            ->with(['course:id,title,slug,thumbnail_path', 'questions:id,quiz_id'])
            ->whereIn('course_id', $courseIds)
            ->where('status', 'published')
            ->where(function ($query) {
                $query
                    ->whereNull('available_from')
                    ->orWhere('available_from', '<=', now());
            })
            ->orderByRaw('CASE WHEN due_at IS NULL THEN 1 ELSE 0 END')
            ->orderBy('due_at')
            ->orderByDesc('id')
            ->get();

        $attempts = QuizAttempt::query()
            ->where('user_id', $user->id)
            ->whereIn('quiz_id', $quizzes->pluck('id'))
            ->orderByDesc('attempt_number')
            ->get()
            ->groupBy('quiz_id')
            ->map(fn ($items) => $items->first());

        $attemptCounts = QuizAttempt::query()
            ->where('user_id', $user->id)
            ->whereIn('quiz_id', $quizzes->pluck('id'))
            ->whereIn('status', ['submitted', 'graded'])
            ->selectRaw('quiz_id, COUNT(*) as attempts_used')
            ->groupBy('quiz_id')
            ->pluck('attempts_used', 'quiz_id');

        $items = $quizzes->map(function (Quiz $quiz) use ($attempts, $attemptCounts): array {
            $latest = $attempts->get($quiz->id);
            $used = (int) ($attemptCounts[$quiz->id] ?? 0);

            $passed = $latest?->passed === true;
            $exhausted = $quiz->max_attempts !== null && $used >= $quiz->max_attempts;

            return [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'description' => $quiz->description,
                'course' => $quiz->course?->title,
                'course_slug' => $quiz->course?->slug,
                'thumbnail_path' => $quiz->course?->thumbnail_path,
                'question_count' => $quiz->questions->count(),
                'time_limit_minutes' => $quiz->time_limit_minutes,
                'passing_score' => $quiz->passing_score,
                'max_attempts' => $quiz->max_attempts,
                'attempts_used' => $used,
                'due_at' => $quiz->due_at?->toISOString(),
                'available_from' => $quiz->available_from?->toISOString(),
                'latest_attempt' => $latest ? $this->attemptSummary($latest) : null,
                'is_passed' => $passed,
                'attempts_exhausted' => $exhausted,
            ];
        })->values();

        $dashboard = $this->studentDashboardService->getDashboardData($user);

        $this->auditLogService->userEvent(
            'quiz_list_viewed',
            $request,
            [
                'resource_type' => 'quiz',
                'metadata' => ['count' => $items->count()],
            ],
        );

        return Inertia::render('Quizzes', [
            'student' => $dashboard['student'],
            'stats' => $dashboard['stats'],
            'quizzes' => $items->all(),
        ]);
    }

    public function show(Request $request, int $quiz): Response
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        $item = $this->accessibleQuiz($user, $quiz);
        $latest = QuizAttempt::query()
            ->where('quiz_id', $item->id)
            ->where('user_id', $user->id)
            ->orderByDesc('attempt_number')
            ->first();

        $attemptsUsed = QuizAttempt::query()
            ->where('quiz_id', $item->id)
            ->where('user_id', $user->id)
            ->whereIn('status', ['submitted', 'graded'])
            ->count();

        $active = QuizAttempt::query()
            ->where('quiz_id', $item->id)
            ->where('user_id', $user->id)
            ->where('status', 'in_progress')
            ->latest('id')
            ->first();

        if ($active && $this->quizAttemptService->hasExpired($active)) {
            $this->quizAttemptService->submit($user, $active, [], 'time_expired');
            $active = null;
            $latest = QuizAttempt::query()
                ->where('quiz_id', $item->id)
                ->where('user_id', $user->id)
                ->orderByDesc('attempt_number')
                ->first();
        }

        $dashboard = $this->studentDashboardService->getDashboardData($user);

        $this->auditLogService->userEvent(
            'quiz_viewed',
            $request,
            [
                'resource_type' => 'quiz',
                'resource_id' => $item->id,
            ],
        );

        return Inertia::render('Quiz', [
            'student' => $dashboard['student'],
            'stats' => $dashboard['stats'],
            'quiz' => $this->quizPayload($item),
            'latest_attempt' => $latest ? $this->attemptSummary($latest) : null,
            'active_attempt' => $active ? $this->attemptSummary($active) : null,
            'attempts_used' => $attemptsUsed,
            'violation_limit' => QuizAttemptService::VIOLATION_LIMIT,
        ]);
    }

    public function start(Request $request, int $quiz): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        $item = $this->accessibleQuiz($user, $quiz);

        if ($item->available_from !== null && $item->available_from->isFuture()) {
            throw ValidationException::withMessages([
                'quiz' => 'This quiz is not available yet.',
            ]);
        }

        $active = QuizAttempt::query()
            ->where('quiz_id', $item->id)
            ->where('user_id', $user->id)
            ->where('status', 'in_progress')
            ->latest('id')
            ->first();

        if (! $active && $item->due_at !== null && $item->due_at->isPast()) {
            throw ValidationException::withMessages([
                'quiz' => 'The deadline for this quiz has passed.',
            ]);
        }

        $attempt = $this->quizAttemptService->start($user, $item);

        $this->auditLogService->userEvent(
            $active ? 'quiz_attempt_resumed' : 'quiz_attempt_started',
            $request,
            [
                'resource_type' => 'quiz',
                'resource_id' => $item->id,
                'metadata' => [
                    'attempt_id' => $attempt->id,
                    'attempt_number' => $attempt->attempt_number,
                ],
            ],
        );

        return redirect()->route('quizzes.attempt', [
            'quiz' => $item->id,
            'attempt' => $attempt->id,
        ]);
    }

    public function attempt(Request $request, int $quiz, int $attempt): Response
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        $item = $this->accessibleQuiz($user, $quiz, true);
        $quizAttempt = QuizAttempt::query()
            ->with(['answers', 'violations'])
            ->whereKey($attempt)
            ->where('quiz_id', $item->id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        if ($quizAttempt->status !== 'in_progress') {
            return redirect()->route('quizzes.result', [
                'quiz' => $item->id,
                'attempt' => $quizAttempt->id,
            ]);
        }

        if ($this->quizAttemptService->hasExpired($quizAttempt)) {
            $this->quizAttemptService->submit($user, $quizAttempt, [], 'time_expired');

            return redirect()->route('quizzes.result', [
                'quiz' => $item->id,
                'attempt' => $quizAttempt->id,
            ]);
        }

        $questions = $item->questions()->with('options')->get();
        $answers = $quizAttempt->answers->keyBy('question_id');

        $dashboard = $this->studentDashboardService->getDashboardData($user);

        return Inertia::render('QuizAttempt', [
            'student' => $dashboard['student'],
            'stats' => $dashboard['stats'],
            'quiz' => $this->quizPayload($item),
            'attempt' => [
                'id' => $quizAttempt->id,
                'attempt_number' => $quizAttempt->attempt_number,
                'status' => $quizAttempt->status,
                'started_at' => $quizAttempt->started_at?->toISOString(),
                'expires_at' => $quizAttempt->expires_at?->toISOString(),
                'remaining_seconds' => $this->quizAttemptService->remainingSeconds($quizAttempt),
                'violation_count' => (int) $quizAttempt->violation_count,
                'violation_limit' => QuizAttemptService::VIOLATION_LIMIT,
                'last_autosaved_at' => $quizAttempt->last_autosaved_at?->toISOString(),
            ],
            'questions' => $questions->map(function (QuizQuestion $question) use ($answers): array {
                $answer = $answers->get($question->id);

                return [
                    'id' => $question->id,
                    'question' => $question->question,
                    'type' => $question->type,
                    'points' => $question->points,
                    'position' => $question->position,
                    'options' => $question->options->map(fn ($option) => [
                        'id' => $option->id,
                        'option_text' => $option->option_text,
                        'position' => $option->position,
                    ])->values()->all(),
                    'selected_option_id' => $answer?->selected_option_id,
                    'selected_option_ids' => $answer?->selected_option_ids ?? [],
                ];
            })->values()->all(),
        ]);
    }

    public function saveAnswers(Request $request, int $quiz, int $attempt): JsonResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        $item = $this->accessibleQuiz($user, $quiz, true);
        $quizAttempt = $this->ownedAttempt($user, $item, $attempt);

        $validated = $request->validate([
            'answers' => ['required', 'array', 'max:100'],
            'answers.*.question_id' => ['required', 'integer'],
            'answers.*.selected_option_id' => ['nullable', 'integer'],
            'answers.*.selected_option_ids' => ['nullable', 'array', 'max:20'],
            'answers.*.selected_option_ids.*' => ['integer'],
            'answers.*.answer_text' => ['nullable', 'string', 'max:10000'],
        ]);

        $updated = $this->quizAttemptService->saveAnswers(
            $user,
            $quizAttempt,
            $validated['answers'],
        );

        if ($updated->status !== 'in_progress') {
            return response()->json([
                'ok' => false,
                'auto_submitted' => true,
                'reason' => $updated->termination_reason,
                'attempt_id' => $updated->id,
            ], 409);
        }

        return response()->json([
            'ok' => true,
            'saved_at' => $updated->last_autosaved_at?->toISOString(),
            'remaining_seconds' => $this->quizAttemptService->remainingSeconds($updated),
        ]);
    }

    public function heartbeat(Request $request, int $quiz, int $attempt): JsonResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        $item = $this->accessibleQuiz($user, $quiz, true);
        $quizAttempt = $this->ownedAttempt($user, $item, $attempt);
        $state = $this->quizAttemptService->heartbeat($user, $quizAttempt);

        if ($state['auto_submitted']) {
            $this->auditLogService->userEvent(
                $state['reason'] === 'time_expired'
                    ? 'quiz_time_expired'
                    : 'quiz_attempt_closed',
                $request,
                [
                    'resource_type' => 'quiz',
                    'resource_id' => $item->id,
                    'metadata' => [
                        'attempt_id' => $quizAttempt->id,
                        'reason' => $state['reason'],
                    ],
                ],
            );
        }

        return response()->json($state);
    }

    public function violation(Request $request, int $quiz, int $attempt): JsonResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        $item = $this->accessibleQuiz($user, $quiz, true);
        $quizAttempt = $this->ownedAttempt($user, $item, $attempt);

        $validated = $request->validate([
            'type' => ['required', 'string', 'in:tab_hidden,window_blur,fullscreen_exit,page_exit'],
            'detail' => ['nullable', 'string', 'max:255'],
            'answers' => ['nullable', 'array', 'max:100'],
            'answers.*.question_id' => ['required', 'integer'],
            'answers.*.selected_option_id' => ['nullable', 'integer'],
            'answers.*.selected_option_ids' => ['nullable', 'array', 'max:20'],
            'answers.*.selected_option_ids.*' => ['integer'],
            'answers.*.answer_text' => ['nullable', 'string', 'max:10000'],
        ]);

        $result = $this->quizAttemptService->recordViolation(
            $user,
            $quizAttempt,
            $validated['type'],
            $validated['detail'] ?? null,
            $validated['answers'] ?? [],
        );

        $this->auditLogService->userEvent(
            'quiz_violation',
            $request,
            [
                'resource_type' => 'quiz',
                'resource_id' => $item->id,
                'metadata' => [
                    'attempt_id' => $quizAttempt->id,
                    'violation_type' => $validated['type'],
                    'violation_count' => $result['violation_count'],
                    'limit' => QuizAttemptService::VIOLATION_LIMIT,
                    'auto_submitted' => $result['auto_submitted'],
                ],
            ],
        );

        return response()->json([
            'ok' => true,
            'violation_count' => $result['violation_count'],
            'limit' => $result['limit'],
            'auto_submitted' => $result['auto_submitted'],
            'reason' => $result['reason'],
        ]);
    }

    public function submit(Request $request, int $quiz, int $attempt): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        $item = $this->accessibleQuiz($user, $quiz, true);
        $quizAttempt = $this->ownedAttempt($user, $item, $attempt);

        $validated = $request->validate([
            'answers' => ['nullable', 'array', 'max:100'],
            'answers.*.question_id' => ['required', 'integer'],
            'answers.*.selected_option_id' => ['nullable', 'integer'],
            'answers.*.selected_option_ids' => ['nullable', 'array', 'max:20'],
            'answers.*.selected_option_ids.*' => ['integer'],
            'answers.*.answer_text' => ['nullable', 'string', 'max:10000'],
        ]);

        $result = $this->quizAttemptService->submit(
            $user,
            $quizAttempt,
            $validated['answers'] ?? [],
            'manual_submit',
        );

        $this->auditLogService->userEvent(
            'quiz_submitted',
            $request,
            [
                'resource_type' => 'quiz',
                'resource_id' => $item->id,
                'metadata' => [
                    'attempt_id' => $result->id,
                    'attempt_number' => $result->attempt_number,
                    'score' => $result->score,
                    'max_score' => $result->max_score,
                    'percentage' => $result->percentage,
                    'passed' => $result->passed,
                    'termination_reason' => $result->termination_reason,
                ],
            ],
        );

        return redirect()->route('quizzes.result', [
            'quiz' => $item->id,
            'attempt' => $result->id,
        ]);
    }

    public function result(Request $request, int $quiz, int $attempt): Response
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        $item = $this->accessibleQuiz($user, $quiz, true);
        $quizAttempt = $this->ownedAttempt($user, $item, $attempt);

        abort_unless($quizAttempt->status !== 'in_progress', 409);

        $quizAttempt->load([
            'answers.question.options',
            'answers.selectedOption',
        ]);

        $dashboard = $this->studentDashboardService->getDashboardData($user);

        return Inertia::render('QuizResult', [
            'student' => $dashboard['student'],
            'stats' => $dashboard['stats'],
            'quiz' => $this->quizPayload($item),
            'attempt' => [
                'id' => $quizAttempt->id,
                'attempt_number' => $quizAttempt->attempt_number,
                'status' => $quizAttempt->status,
                'score' => $quizAttempt->score,
                'max_score' => $quizAttempt->max_score,
                'percentage' => $quizAttempt->percentage,
                'passed' => $quizAttempt->passed,
                'started_at' => $quizAttempt->started_at?->toISOString(),
                'submitted_at' => $quizAttempt->submitted_at?->toISOString(),
                'graded_at' => $quizAttempt->graded_at?->toISOString(),
                'violation_count' => (int) $quizAttempt->violation_count,
                'termination_reason' => $quizAttempt->termination_reason,
            ],
            'answers' => $quizAttempt->answers->map(function ($answer): array {
                return [
                    'question_id' => $answer->question_id,
                    'question' => $answer->question?->question,
                    'type' => $answer->question?->type,
                    'points' => $answer->question?->points,
                    'selected_option_id' => $answer->selected_option_id,
                    'selected_option_ids' => $answer->selected_option_ids ?? [],
                    'selected_option_text' => $answer->selectedOption?->option_text,
                    'selected_option_texts' => $answer->selected_option_ids
                        ? $answer->question?->options
                            ->whereIn('id', $answer->selected_option_ids)
                            ->sortBy('position')
                            ->pluck('option_text')
                            ->values()
                            ->all()
                        : ($answer->selectedOption?->option_text ? [$answer->selectedOption->option_text] : []),
                    'is_correct' => $answer->is_correct,
                    'points_awarded' => $answer->points_awarded,
                    'explanation' => $answer->question?->explanation,
                ];
            })->values()->all(),
        ]);
    }

    protected function accessibleQuiz(User $user, int $quizId, bool $allowClosed = false): Quiz
    {
        $quiz = Quiz::query()
            ->with(['course:id,title,slug,thumbnail_path', 'questions.options'])
            ->whereKey($quizId)
            ->when(
                $allowClosed,
                fn ($query) => $query->whereIn('status', ['published', 'closed']),
                fn ($query) => $query->where('status', 'published'),
            )
            ->firstOrFail();

        if (! $allowClosed) {
            abort_unless(
                $quiz->available_from === null || $quiz->available_from->lte(now()),
                404,
            );
        }

        abort_unless(
            $this->courseAccessService->hasGrantedEnrollment($user, $quiz->course),
            403,
            'You do not have learning access to this course.',
        );

        return $quiz;
    }

    protected function ownedAttempt(User $user, Quiz $quiz, int $attemptId): QuizAttempt
    {
        return QuizAttempt::query()
            ->whereKey($attemptId)
            ->where('quiz_id', $quiz->id)
            ->where('user_id', $user->id)
            ->firstOrFail();
    }

    protected function quizPayload(Quiz $quiz): array
    {
        return [
            'id' => $quiz->id,
            'title' => $quiz->title,
            'description' => $quiz->description,
            'course' => [
                'id' => $quiz->course->id,
                'title' => $quiz->course->title,
                'slug' => $quiz->course->slug,
                'thumbnail_path' => $quiz->course->thumbnail_path,
            ],
            'time_limit_minutes' => $quiz->time_limit_minutes,
            'passing_score' => $quiz->passing_score,
            'max_attempts' => $quiz->max_attempts,
            'due_at' => $quiz->due_at?->toISOString(),
            'available_from' => $quiz->available_from?->toISOString(),
            'question_count' => $quiz->questions->count(),
            'shuffle_questions' => $quiz->shuffle_questions,
            'shuffle_options' => $quiz->shuffle_options,
        ];
    }

    protected function attemptSummary(QuizAttempt $attempt): array
    {
        return [
            'id' => $attempt->id,
            'attempt_number' => $attempt->attempt_number,
            'status' => $attempt->status,
            'score' => $attempt->score,
            'max_score' => $attempt->max_score,
            'percentage' => $attempt->percentage,
            'passed' => $attempt->passed,
            'started_at' => $attempt->started_at?->toISOString(),
            'submitted_at' => $attempt->submitted_at?->toISOString(),
            'graded_at' => $attempt->graded_at?->toISOString(),
            'expires_at' => $attempt->expires_at?->toISOString(),
            'violation_count' => (int) $attempt->violation_count,
            'termination_reason' => $attempt->termination_reason,
        ];
    }
}
