<?php

namespace App\Http\Controllers;

use App\Models\Assignment;
use App\Models\CourseEnrollment;
use App\Models\Quiz;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class StudentSearchController extends Controller
{
    /**
     * Search only the authenticated student's learning space.
     *
     * This endpoint intentionally returns student-facing destinations only.
     * It does not expose admin routes, internal IDs beyond the existing
     * student-facing resource URLs, or records outside the student's access.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);

        $query = trim((string) $request->query('q', ''));

        if ($query === '') {
            return response()->json(['results' => []]);
        }

        $needle = Str::lower($query);

        $enrollments = CourseEnrollment::query()
            ->with('course')
            ->where('user_id', $user->id)
            ->get();

        $courses = $enrollments
            ->filter(fn ($enrollment) => $enrollment->course !== null)
            ->map(function ($enrollment) {
                $course = $enrollment->course;

                $progress = $enrollment->getAttribute('progress');
                if ($progress === null) {
                    $progress = $enrollment->getAttribute('progress_percent');
                }

                return [
                    'id' => $course->id,
                    'title' => (string) ($course->title ?? 'Course'),
                    'slug' => (string) ($course->slug ?? ''),
                    'category' => $course->category ?? null,
                    'level' => (string) ($course->level ?? 'Course'),
                    'progress' => is_numeric($progress) ? (int) $progress : 0,
                ];
            })
            ->filter(fn (array $course) => $course['slug'] !== '')
            ->values();

        $courseById = $courses->keyBy('id');

        $courseMatches = $courses->filter(function (array $course) use ($needle) {
            return Str::contains(
                Str::lower(implode(' ', [
                    $course['title'],
                    $course['category'] ?? '',
                    $course['level'],
                ])),
                $needle,
            );
        });

        $matchedCourseIds = $courseMatches->keys()->map(fn ($id) => (int) $id)->all();

        $assignments = Assignment::query()
            ->with('course')
            ->whereIn('course_id', $courseById->keys()->all())
            ->whereHas('allocations', fn ($q) => $q->where('user_id', $user->id))
            ->get();

        $quizzes = Quiz::query()
            ->with('course')
            ->whereIn('course_id', $courseById->keys()->all())
            ->get();

        $results = [];

        foreach ($courseMatches as $course) {
            $parts = array_values(array_filter([
                $this->cleanSearchText($course['category'] ?? null),
                $this->cleanSearchText($course['level'] ?? null),
                sprintf('%d%% complete', $course['progress']),
            ]));

            $results[] = [
                'type' => 'Course',
                'title' => $this->cleanSearchText($course['title']) ?: 'Course',
                'subtitle' => implode(' · ', $parts),
                'href' => route('courses.show', ['slug' => $course['slug']]),
            ];
        }

        foreach ($assignments as $assignment) {
            $course = $courseById->get($assignment->course_id);

            $courseTitle = $this->cleanSearchText($course['title'] ?? ($assignment->course?->title ?? 'Course')) ?: 'Course';
            $courseText = Str::lower($courseTitle);
            $assignmentText = Str::lower((string) ($assignment->title ?? ''));

            $directMatch = Str::contains(
                $assignmentText . ' ' . $courseText,
                $needle,
            );
            $relatedMatch = $course !== null && in_array((int) $assignment->course_id, $matchedCourseIds, true);

            if (! $directMatch && ! $relatedMatch) {
                continue;
            }

            $dueAt = $assignment->getAttribute('due_at');

            $results[] = [
                'type' => 'Assignment',
                'title' => $this->cleanSearchText($assignment->title) ?: 'Assignment',
                'subtitle' => sprintf(
                    '%s · %s',
                    $directMatch ? 'Assignment' : 'Related assignment',
                    $dueAt ? 'Due ' . \Illuminate\Support\Carbon::parse($dueAt)->format('d M Y, H:i') : 'No due date',
                ),
                'href' => route('assignments.show', ['assignment' => $assignment->id]),
                'courseTitle' => $courseTitle,
                'courseHref' => $course
                    ? route('courses.show', ['slug' => $course['slug']])
                    : null,
                'related' => ! $directMatch && $relatedMatch,
            ];
        }

        foreach ($quizzes as $quiz) {
            $course = $courseById->get($quiz->course_id);

            $courseTitle = $this->cleanSearchText($course['title'] ?? ($quiz->course?->title ?? 'Course')) ?: 'Course';
            $courseText = Str::lower($courseTitle);
            $quizText = Str::lower((string) ($quiz->title ?? ''));

            $directMatch = Str::contains($quizText . ' ' . $courseText, $needle);
            $relatedMatch = $course !== null && in_array((int) $quiz->course_id, $matchedCourseIds, true);

            if (! $directMatch && ! $relatedMatch) {
                continue;
            }

            $dueAt = $quiz->getAttribute('due_at');

            $results[] = [
                'type' => 'Quiz',
                'title' => $this->cleanSearchText($quiz->title) ?: 'Quiz',
                'subtitle' => sprintf(
                    '%s · %s',
                    $directMatch ? 'Quiz' : 'Related quiz',
                    $dueAt ? 'Due ' . \Illuminate\Support\Carbon::parse($dueAt)->format('d M Y, H:i') : 'No due date',
                ),
                'href' => route('quizzes.show', ['quiz' => $quiz->id]),
                'courseTitle' => $courseTitle,
                'courseHref' => $course
                    ? route('courses.show', ['slug' => $course['slug']])
                    : null,
                'related' => ! $directMatch && $relatedMatch,
            ];
        }

        usort($results, function (array $a, array $b) {
            $rank = ['Course' => 0, 'Assignment' => 1, 'Quiz' => 2];
            return ($rank[$a['type']] ?? 9) <=> ($rank[$b['type']] ?? 9);
        });

        return response()->json([
            'results' => array_slice($results, 0, 30),
        ]);
    }

    /**
     * Search results are a user-facing API. Never allow serialized model
     * payloads, JSON blobs, database metadata or object representations to
     * leak into the UI.
     */
    private function cleanSearchText(mixed $value): string
    {
        if (! is_string($value) && ! is_numeric($value)) {
            return '';
        }

        $text = trim((string) $value);

        if ($text === '' || (Str::startsWith($text, '{') && Str::endsWith($text, '}'))) {
            return '';
        }

        $decoded = json_decode($text, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return '';
        }

        return Str::limit(preg_replace('/\s+/', ' ', strip_tags($text)) ?? '', 140, '…');
    }
}
