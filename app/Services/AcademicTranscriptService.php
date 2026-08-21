<?php

namespace App\Services;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\CourseEnrollment;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\User;
use Dompdf\Dompdf;
use Dompdf\Options;

class AcademicTranscriptService
{
    public function render(User $user): string
    {
        $enrollments = CourseEnrollment::query()
            ->with('course')
            ->where('user_id', $user->id)
            ->orderByDesc('completed_at')
            ->orderByDesc('enrolled_at')
            ->get();

        $courseIds = $enrollments->pluck('course_id');

        $assignments = Assignment::query()
            ->with('course')
            ->whereIn('course_id', $courseIds)
            ->whereHas(
                'allocations',
                fn ($query) => $query->where('user_id', $user->id)
            )
            ->get();

        $submissions = AssignmentSubmission::query()
            ->where('user_id', $user->id)
            ->whereIn('assignment_id', $assignments->pluck('id'))
            ->where('status', 'graded')
            ->orderByDesc('attempt_number')
            ->get()
            ->groupBy('assignment_id')
            ->map(fn ($items) => $items->first());

        $quizzes = Quiz::query()
            ->with('course')
            ->whereIn('course_id', $courseIds)
            ->get();

        $quizAttempts = QuizAttempt::query()
            ->where('user_id', $user->id)
            ->whereIn('quiz_id', $quizzes->pluck('id'))
            ->where('status', 'graded')
            ->orderByDesc('attempt_number')
            ->get()
            ->groupBy('quiz_id')
            ->map(fn ($items) => $items->first());

        $achievements = $user->achievements()
            ->with('achievement')
            ->latest('earned_at')
            ->get();

        $points = (int) $user->pointTransactions()->sum('points');

        /*
         * -------------------------------------------------------------
         * Course rows
         * -------------------------------------------------------------
         */
        $courseRows = '';

        foreach ($enrollments as $enrollment) {
            $courseTitle = e($enrollment->course?->title ?? 'Course');
            $status = e(ucfirst((string) $enrollment->status));
            $completed = e(
                $enrollment->completed_at?->format('d M Y') ?? '—'
            );

            $courseRows .= <<<HTML
                <tr>
                    <td class="course-name">{$courseTitle}</td>
                    <td>{$status}</td>
                    <td>{$completed}</td>
                </tr>
            HTML;
        }

        /*
         * -------------------------------------------------------------
         * Assignment rows
         * -------------------------------------------------------------
         */
        $assignmentRows = '';

        foreach ($submissions as $submission) {
            $assignment = $assignments->firstWhere(
                'id',
                $submission->assignment_id
            );

            if (! $assignment) {
                continue;
            }

            $max = (int) $assignment->max_points;

            $score = $submission->score !== null
                ? (int) $submission->score
                : null;

            $percentage = $score !== null && $max > 0
                ? round(($score / $max) * 100, 1)
                : null;

            $title = e($assignment->title);
            $course = e($assignment->course?->title ?? 'Course');
            $scoreText = $score !== null
                ? e($score . ' / ' . $max)
                : '—';
            $percentageText = $percentage !== null
                ? e((string) $percentage) . '%'
                : '—';

            $assignmentRows .= <<<HTML
                <tr>
                    <td class="course-name">{$title}</td>
                    <td>{$course}</td>
                    <td>{$scoreText}</td>
                    <td>{$percentageText}</td>
                </tr>
            HTML;
        }

        /*
         * -------------------------------------------------------------
         * Quiz rows
         * -------------------------------------------------------------
         */
        $quizRows = '';

        foreach ($quizAttempts as $attempt) {
            $quiz = $quizzes->firstWhere('id', $attempt->quiz_id);

            if (! $quiz) {
                continue;
            }

            $title = e($quiz->title);
            $course = e($quiz->course?->title ?? 'Course');

            $percentageText = $attempt->percentage !== null
                ? e((string) $attempt->percentage) . '%'
                : '—';

            $result = $attempt->passed
                ? '<span class="passed">Passed</span>'
                : '<span class="not-passed">Not passed</span>';

            $quizRows .= <<<HTML
                <tr>
                    <td class="course-name">{$title}</td>
                    <td>{$course}</td>
                    <td>{$percentageText}</td>
                    <td>{$result}</td>
                </tr>
            HTML;
        }

        /*
         * -------------------------------------------------------------
         * Achievement rows
         * -------------------------------------------------------------
         */
        $achievementRows = '';

        foreach ($achievements as $item) {
            $name = e($item->achievement?->name ?? 'Achievement');
            $description = e($item->achievement?->description ?? '');
            $pointsAwarded = (int) $item->points_awarded;

            $earned = e(
                $item->earned_at?->format('d M Y') ?? '—'
            );

            $achievementRows .= <<<HTML
                <tr>
                    <td class="course-name">{$name}</td>
                    <td>{$description}</td>
                    <td>+{$pointsAwarded}</td>
                    <td>{$earned}</td>
                </tr>
            HTML;
        }

        /*
         * -------------------------------------------------------------
         * Section renderer
         *
         * IMPORTANT:
         * Rows are only ever inserted inside their corresponding table.
         * This prevents Dompdf's "Parent table not found" exception.
         * -------------------------------------------------------------
         */
        $renderTableSection = function (
            string $title,
            string $headers,
            string $rows,
            string $emptyMessage
        ): string {
            if ($rows === '') {
                return <<<HTML
                    <section class="section">
                        <div class="section-heading">{$title}</div>
                        <div class="empty">{$emptyMessage}</div>
                    </section>
                HTML;
            }

            return <<<HTML
                <section class="section">
                    <div class="section-heading">{$title}</div>

                    <table class="record-table">
                        <thead>
                            <tr>
                                {$headers}
                            </tr>
                        </thead>
                        <tbody>
                            {$rows}
                        </tbody>
                    </table>
                </section>
            HTML;
        };

        $courseSection = $renderTableSection(
            'Course Record',
            '<th>Course</th><th>Status</th><th>Completed</th>',
            $courseRows,
            'No course records yet.'
        );

        $assignmentSection = $renderTableSection(
            'Assignment Results',
            '<th>Assignment</th><th>Course</th><th>Score</th><th>Result</th>',
            $assignmentRows,
            'No graded assignment results yet.'
        );

        $quizSection = $renderTableSection(
            'Quiz Results',
            '<th>Quiz</th><th>Course</th><th>Score</th><th>Result</th>',
            $quizRows,
            'No graded quiz results yet.'
        );

        $achievementSection = $renderTableSection(
            'Achievements',
            '<th>Achievement</th><th>Description</th><th>Points</th><th>Earned</th>',
            $achievementRows,
            'No achievements earned yet.'
        );

        /*
         * -------------------------------------------------------------
         * Summary values
         * -------------------------------------------------------------
         */
        $courseCount = $enrollments->count();

        $completedCourseCount = $enrollments
            ->where('status', 'completed')
            ->count();

        $gradedQuizCount = $quizAttempts->count();

        $generatedAt = e(now()->format('d M Y, H:i'));
        $studentName = e($user->name);
        $studentEmail = e($user->email);

        /*
         * -------------------------------------------------------------
         * PDF document
         * -------------------------------------------------------------
         */
        $html = <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">

    <title>Academic Transcript</title>

    <style>
        @page {
            size: A4 portrait;
            margin: 13mm 14mm 14mm 14mm;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #17233d;
            font-family: DejaVu Sans, sans-serif;
            font-size: 8.5px;
            line-height: 1.45;
        }

        .document {
            width: 100%;
        }

        .header {
            border-bottom: 2px solid #1554c0;
            padding-bottom: 11px;
            margin-bottom: 11px;
        }

        .brand {
            color: #1554c0;
            font-size: 8px;
            font-weight: 700;
            letter-spacing: 1.8px;
            text-transform: uppercase;
            margin-bottom: 4px;
        }

        .title {
            margin: 0;
            color: #0d1740;
            font-family: DejaVu Serif, serif;
            font-size: 21px;
            font-weight: 700;
            line-height: 1.15;
        }

        .subtitle {
            margin-top: 4px;
            color: #64748b;
            font-size: 8px;
        }

        .student-panel {
            background: #f5f8fd;
            border: 1px solid #dbe4f0;
            border-radius: 5px;
            padding: 8px 10px;
            margin-bottom: 10px;
        }

        .student-label {
            color: #718096;
            font-size: 6.5px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
        }

        .student-name {
            margin-top: 2px;
            color: #0d1740;
            font-size: 11px;
            font-weight: 700;
        }

        .student-email {
            margin-top: 1px;
            color: #64748b;
            font-size: 7.5px;
        }

        .generated {
            margin-top: 4px;
            color: #94a3b8;
            font-size: 6.8px;
        }

        .summary-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 5px 0;
            margin: 0 -5px 10px -5px;
        }

        .summary-table td {
            width: 25%;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 7px 8px;
            vertical-align: top;
        }

        .summary-value {
            display: block;
            color: #1554c0;
            font-size: 14px;
            font-weight: 700;
            line-height: 1.1;
        }

        .summary-label {
            display: block;
            margin-top: 2px;
            color: #718096;
            font-size: 6.5px;
            text-transform: uppercase;
            letter-spacing: .65px;
        }

        .section {
            margin-top: 9px;
        }

        .section-heading {
            color: #0d1740;
            border-bottom: 1px solid #dbe4ee;
            padding-bottom: 4px;
            margin-bottom: 4px;
            font-size: 9.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: .65px;
        }

        .record-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin: 0;
        }

        .record-table th {
            background: #f1f5f9;
            color: #64748b;
            border-bottom: 1px solid #dbe4ee;
            padding: 4px 5px;
            text-align: left;
            font-size: 6.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: .55px;
        }

        .record-table td {
            border-bottom: 1px solid #e8edf3;
            padding: 4px 5px;
            color: #475569;
            font-size: 7.5px;
            vertical-align: top;
        }

        .record-table tr {
            page-break-inside: avoid;
        }

        .course-name {
            color: #17233d !important;
            font-weight: 600;
        }

        .passed {
            color: #047857;
            font-weight: 700;
        }

        .not-passed {
            color: #b45309;
            font-weight: 700;
        }

        .empty {
            padding: 7px 0;
            color: #94a3b8;
            font-size: 7.5px;
        }

        .footer {
            margin-top: 11px;
            padding-top: 7px;
            border-top: 1px solid #dbe4ee;
            color: #94a3b8;
            font-size: 6.5px;
            line-height: 1.4;
        }

        .footer strong {
            color: #64748b;
        }
    </style>
</head>

<body>
    <div class="document">

        <div class="header">
            <div class="brand">Learn With Flevian · Official Student Record</div>
            <h1 class="title">Academic Transcript</h1>
            <div class="subtitle">
                Official academic record generated from the Learn With Flevian LMS.
            </div>
        </div>

        <div class="student-panel">
            <div class="student-label">Student</div>
            <div class="student-name">{$studentName}</div>
            <div class="student-email">{$studentEmail}</div>
            <div class="generated">Generated {$generatedAt}</div>
        </div>

        <table class="summary-table">
            <tbody>
                <tr>
                    <td>
                        <span class="summary-value">{$courseCount}</span>
                        <span class="summary-label">Courses</span>
                    </td>

                    <td>
                        <span class="summary-value">{$completedCourseCount}</span>
                        <span class="summary-label">Completed</span>
                    </td>

                    <td>
                        <span class="summary-value">{$gradedQuizCount}</span>
                        <span class="summary-label">Graded quizzes</span>
                    </td>

                    <td>
                        <span class="summary-value">{$points}</span>
                        <span class="summary-label">Achievement points</span>
                    </td>
                </tr>
            </tbody>
        </table>

        {$courseSection}

        {$assignmentSection}

        {$quizSection}

        {$achievementSection}

        <div class="footer">
            <strong>Learn With Flevian LMS</strong><br>
            This transcript is generated from the official student record.
            Course completion reflects the completion status recorded on the student's enrollment.
            Assignment scores reflect graded submissions, while quiz results reflect server-graded attempts.
        </div>

    </div>
</body>
</html>
HTML;

        $options = new Options();

        $options->set('defaultFont', 'DejaVu Sans');
        $options->set('isRemoteEnabled', false);
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isPhpEnabled', false);

        $dompdf = new Dompdf($options);

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return $dompdf->output();
    }
}