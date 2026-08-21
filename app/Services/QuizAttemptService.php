<?php

namespace App\Services;

use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizAttempt;
use App\Models\QuizOption;
use App\Models\QuizQuestion;
use App\Models\StudentLearningActivity;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class QuizAttemptService
{
    public function __construct(
        protected QuizCompletionRewardService $quizCompletionRewardService,
    ) {}
    public const VIOLATION_LIMIT = 3;

    /**
     * Start a new attempt or safely resume the student's existing attempt.
     *
     * The database lock prevents two browser tabs/requests from creating two
     * attempts at the same time. A server-side expiry timestamp is stored on
     * the attempt so the browser clock is never authoritative.
     */
    public function start(User $user, Quiz $quiz): QuizAttempt
    {
        return DB::transaction(function () use ($user, $quiz): QuizAttempt {
            $existing = QuizAttempt::query()
                ->where('quiz_id', $quiz->id)
                ->where('user_id', $user->id)
                ->where('status', 'in_progress')
                ->lockForUpdate()
                ->first();

            if ($existing) {
                if ($this->hasExpired($existing)) {
                    $this->submitLocked($existing, 'time_expired');
                } else {
                    return $existing->fresh(['quiz']);
                }
            }

            $usedAttempts = QuizAttempt::query()
                ->where('quiz_id', $quiz->id)
                ->where('user_id', $user->id)
                ->whereIn('status', ['submitted', 'graded'])
                ->count();

            if ($quiz->max_attempts !== null && $usedAttempts >= $quiz->max_attempts) {
                throw ValidationException::withMessages([
                    'quiz' => 'You have used all available attempts for this quiz.',
                ]);
            }

            $questions = $quiz->questions()->with('options')->get();

            if ($questions->isEmpty()) {
                throw ValidationException::withMessages([
                    'quiz' => 'This quiz is not ready yet because it has no questions.',
                ]);
            }

            $unsupported = $questions->first(
                fn (QuizQuestion $question) => ! in_array(
                    $question->type,
                    ['single_choice', 'multiple_choice', 'true_false'],
                    true,
                ),
            );

            if ($unsupported) {
                throw ValidationException::withMessages([
                    'quiz' => 'This quiz contains a question type that is not yet supported for automatic grading.',
                ]);
            }

            $attemptNumber = (int) QuizAttempt::query()
                ->where('quiz_id', $quiz->id)
                ->where('user_id', $user->id)
                ->max('attempt_number') + 1;

            $startedAt = now();
            $expiresAt = $quiz->time_limit_minutes !== null
                ? $startedAt->copy()->addMinutes($quiz->time_limit_minutes)
                : null;

            $attempt = QuizAttempt::create([
                'quiz_id' => $quiz->id,
                'user_id' => $user->id,
                'attempt_number' => $attemptNumber,
                'status' => 'in_progress',
                'score' => null,
                'max_score' => (int) $questions->sum('points'),
                'percentage' => null,
                'passed' => null,
                'started_at' => $startedAt,
                'expires_at' => $expiresAt,
                'violation_count' => 0,
                'last_autosaved_at' => null,
                'auto_submitted_at' => null,
                'termination_reason' => null,
                'submitted_at' => null,
                'graded_at' => null,
            ]);

            StudentLearningActivity::create([
                'user_id' => $user->id,
                'course_id' => $quiz->course_id,
                'lesson_id' => $quiz->lesson_id,
                'assignment_id' => null,
                'quiz_id' => $quiz->id,
                'activity_type' => 'quiz_started',
                'points' => 0,
                'metadata' => [
                    'attempt_id' => $attempt->id,
                    'attempt_number' => $attemptNumber,
                ],
                'occurred_at' => now(),
            ]);

            return $attempt->fresh(['quiz']);
        });
    }

    /**
     * Persist answers without grading them. This endpoint is safe to call
     * repeatedly and is intentionally idempotent per attempt/question.
     */
    public function saveAnswers(
        User $user,
        QuizAttempt $attempt,
        array $answers,
    ): QuizAttempt {
        return DB::transaction(function () use ($user, $attempt, $answers): QuizAttempt {
            $attempt = QuizAttempt::query()
                ->whereKey($attempt->id)
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($attempt->status !== 'in_progress') {
                return $attempt->fresh(['quiz']);
            }

            if ($this->hasExpired($attempt)) {
                $this->submitLocked($attempt, 'time_expired');
                return $attempt->fresh(['quiz']);
            }

            $quiz = $attempt->quiz()->firstOrFail();
            $questions = $quiz->questions()->with('options')->get()->keyBy('id');

            foreach ($answers as $payload) {
                $this->persistAnswer($attempt, $questions, $payload);
            }

            $attempt->forceFill([
                'last_autosaved_at' => now(),
            ])->save();

            return $attempt->fresh(['quiz']);
        });
    }

    /**
     * Record a client-observed security violation. The counter is maintained
     * transactionally on the server. The third violation automatically closes
     * and grades the attempt.
     */
    public function recordViolation(
        User $user,
        QuizAttempt $attempt,
        string $type,
        ?string $detail = null,
        array $answers = [],
    ): array {
        return DB::transaction(function () use ($user, $attempt, $type, $detail, $answers): array {
            $attempt = QuizAttempt::query()
                ->whereKey($attempt->id)
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($attempt->status !== 'in_progress') {
                return [
                    'attempt' => $attempt->fresh(['quiz']),
                    'violation_count' => (int) $attempt->violation_count,
                    'limit' => self::VIOLATION_LIMIT,
                    'auto_submitted' => true,
                    'reason' => $attempt->termination_reason,
                ];
            }

            if ($answers !== []) {
                $quiz = $attempt->quiz()->firstOrFail();
                $questions = $quiz->questions()->with('options')->get()->keyBy('id');

                foreach ($answers as $payload) {
                    $this->persistAnswer($attempt, $questions, $payload);
                }

                $attempt->forceFill([
                    'last_autosaved_at' => now(),
                ])->save();
            }

            if ($this->hasExpired($attempt)) {
                $this->submitLocked($attempt, 'time_expired');

                return [
                    'attempt' => $attempt->fresh(['quiz']),
                    'violation_count' => (int) $attempt->violation_count,
                    'limit' => self::VIOLATION_LIMIT,
                    'auto_submitted' => true,
                    'reason' => 'time_expired',
                ];
            }

            $count = (int) $attempt->violation_count + 1;

            $attempt->forceFill([
                'violation_count' => $count,
            ])->save();

            $attempt->violations()->create([
                'user_id' => $user->id,
                'violation_type' => $type,
                'sequence' => $count,
                'detail' => $detail,
                'occurred_at' => now(),
            ]);

            if ($count >= self::VIOLATION_LIMIT) {
                $this->submitLocked($attempt, 'three_violations');
            }

            return [
                'attempt' => $attempt->fresh(['quiz']),
                'violation_count' => $count,
                'limit' => self::VIOLATION_LIMIT,
                'auto_submitted' => $count >= self::VIOLATION_LIMIT,
                'reason' => $count >= self::VIOLATION_LIMIT
                    ? 'three_violations'
                    : null,
            ];
        });
    }

    /**
     * Heartbeat used to keep the server-side expiry state visible to the
     * client. The browser countdown is only a display; this method remains
     * authoritative for expiration.
     */
    public function heartbeat(User $user, QuizAttempt $attempt): array
    {
        return DB::transaction(function () use ($user, $attempt): array {
            $attempt = QuizAttempt::query()
                ->whereKey($attempt->id)
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($attempt->status === 'in_progress' && $this->hasExpired($attempt)) {
                $this->submitLocked($attempt, 'time_expired');
                $attempt->refresh();
            }

            return [
                'status' => $attempt->status,
                'remaining_seconds' => $this->remainingSeconds($attempt),
                'violation_count' => (int) $attempt->violation_count,
                'auto_submitted' => $attempt->status !== 'in_progress',
                'reason' => $attempt->termination_reason,
            ];
        });
    }

    /**
     * Final submission. The server re-reads every question and determines the
     * score from the canonical answer key, never from client-provided scores.
     */
    public function submit(
        User $user,
        QuizAttempt $attempt,
        array $answers = [],
        string $reason = 'manual_submit',
    ): QuizAttempt {
        return DB::transaction(function () use ($user, $attempt, $answers, $reason): QuizAttempt {
            $attempt = QuizAttempt::query()
                ->whereKey($attempt->id)
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($attempt->status !== 'in_progress') {
                return $attempt->fresh(['quiz', 'answers.question', 'answers.selectedOption']);
            }

            $quiz = $attempt->quiz()->firstOrFail();
            $questions = $quiz->questions()->with('options')->get()->keyBy('id');

            foreach ($answers as $payload) {
                $this->persistAnswer($attempt, $questions, $payload);
            }

            if ($this->hasExpired($attempt)) {
                $reason = 'time_expired';
            }

            $this->gradeLocked($attempt, $quiz, $questions, $reason);

            return $attempt->fresh(['quiz', 'answers.question', 'answers.selectedOption']);
        });
    }

    public function remainingSeconds(QuizAttempt $attempt): ?int
    {
        if ($attempt->expires_at === null) {
            return null;
        }

        return max(0, now()->diffInSeconds($attempt->expires_at, false));
    }

    public function hasExpired(QuizAttempt $attempt): bool
    {
        return $attempt->expires_at !== null && now()->greaterThanOrEqualTo($attempt->expires_at);
    }

    /**
     * Submit an attempt while its row lock is already held.
     */
    protected function submitLocked(QuizAttempt $attempt, string $reason): void
    {
        $quiz = $attempt->quiz()->firstOrFail();
        $questions = $quiz->questions()->with('options')->get()->keyBy('id');

        $this->gradeLocked($attempt, $quiz, $questions, $reason);
    }

    protected function gradeLocked(
        QuizAttempt $attempt,
        Quiz $quiz,
        Collection $questions,
        string $reason,
    ): void {
        $score = 0;
        $maxScore = (int) $questions->sum('points');

        foreach ($questions as $question) {
            $answer = QuizAnswer::query()
                ->where('attempt_id', $attempt->id)
                ->where('question_id', $question->id)
                ->first();

            [$correct, $points] = $this->gradeAnswer($question, $answer);

            if ($answer) {
                $answer->forceFill([
                    'is_correct' => $correct,
                    'points_awarded' => $points,
                ])->save();
            }

            $score += $points;
        }

        $percentage = $maxScore > 0
            ? round(($score / $maxScore) * 100, 2)
            : 0;

        $attempt->forceFill([
            'status' => 'graded',
            'score' => $score,
            'max_score' => $maxScore,
            'percentage' => $percentage,
            'passed' => $percentage >= (int) $quiz->passing_score,
            'submitted_at' => now(),
            'graded_at' => now(),
            'termination_reason' => $reason,
            'auto_submitted_at' => in_array($reason, ['time_expired', 'three_violations'], true)
                ? now()
                : null,
            'last_autosaved_at' => now(),
        ])->save();

        StudentLearningActivity::create([
            'user_id' => $attempt->user_id,
            'course_id' => $quiz->course_id,
            'lesson_id' => $quiz->lesson_id,
            'assignment_id' => null,
            'quiz_id' => $quiz->id,
            'activity_type' => 'quiz_completed',
            'points' => 0,
            'metadata' => [
                'attempt_id' => $attempt->id,
                'attempt_number' => $attempt->attempt_number,
                'score' => $score,
                'max_score' => $maxScore,
                'percentage' => $percentage,
                'passed' => $attempt->passed,
                'termination_reason' => $reason,
                'violation_count' => (int) $attempt->violation_count,
            ],
            'occurred_at' => now(),
        ]);

        // Reward the first completed quiz exactly once. This is intentionally
        // executed inside the same transaction as grading so a failed reward
        // cannot leave a partially completed quiz transaction behind.
        $this->quizCompletionRewardService->awardFirstQuizIfEligible(
            $attempt->user,
            $attempt->fresh(['quiz']),
        );
    }

    protected function persistAnswer(
        QuizAttempt $attempt,
        Collection $questions,
        mixed $payload,
    ): void {
        if (! is_array($payload)) {
            return;
        }

        $questionId = (int) ($payload['question_id'] ?? 0);
        $question = $questions->get($questionId);

        if (! $question) {
            throw ValidationException::withMessages([
                'answers' => 'One or more answers reference an invalid question.',
            ]);
        }

        $selectedIds = array_values(array_unique(array_map(
            'intval',
            is_array($payload['selected_option_ids'] ?? null)
                ? $payload['selected_option_ids']
                : array_filter([$payload['selected_option_id'] ?? null]),
        )));

        $validOptionIds = $question->options
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        if (array_diff($selectedIds, $validOptionIds) !== []) {
            throw ValidationException::withMessages([
                'answers' => 'One or more selected answers are invalid.',
            ]);
        }

        if ($question->type === 'single_choice' || $question->type === 'true_false') {
            $selectedIds = array_slice($selectedIds, 0, 1);
        }

        QuizAnswer::updateOrCreate(
            [
                'attempt_id' => $attempt->id,
                'question_id' => $question->id,
            ],
            [
                'selected_option_id' => $selectedIds[0] ?? null,
                'selected_option_ids' => $question->type === 'multiple_choice'
                    ? $selectedIds
                    : null,
                'answer_text' => isset($payload['answer_text'])
                    ? trim((string) $payload['answer_text'])
                    : null,
                'is_correct' => null,
                'points_awarded' => 0,
                'answered_at' => now(),
            ],
        );
    }

    protected function gradeAnswer(
        QuizQuestion $question,
        ?QuizAnswer $answer,
    ): array {
        if (! $answer) {
            return [false, 0];
        }

        $correctIds = $question->options
            ->where('is_correct', true)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->sort()
            ->values()
            ->all();

        $selectedIds = $question->type === 'multiple_choice'
            ? collect($answer->selected_option_ids ?? [])->map(fn ($id) => (int) $id)->sort()->values()->all()
            : array_values(array_filter([(int) $answer->selected_option_id]));

        sort($selectedIds);

        $correct = $selectedIds === $correctIds && $correctIds !== [];

        return [
            $correct,
            $correct ? (int) $question->points : 0,
        ];
    }
}
