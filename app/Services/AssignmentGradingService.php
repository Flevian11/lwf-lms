<?php

namespace App\Services;

use App\Models\AssignmentSubmission;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;

class AssignmentGradingService
{
    /**
     * Mark a submission and generate its student-facing PDF transcript.
     *
     * Admin/instructor authorization belongs to the caller. This service only
     * handles the grading transaction and the deterministic transcript artifact.
     */
    public function grade(
        AssignmentSubmission $submission,
        int $score,
        ?string $feedback = null,
        ?int $gradedBy = null,
    ): AssignmentSubmission {
        $submission->loadMissing(['assignment.course', 'user']);

        $max = (int) $submission->assignment->max_points;

        if ($score < 0 || $score > $max) {
            throw new InvalidArgumentException("Score must be between 0 and {$max}.");
        }

        $submission->score = $score;
        $submission->feedback = $feedback;
        $submission->graded_by = $gradedBy;
        $submission->graded_at = now();
        $submission->status = 'graded';

        $pdf = $this->renderTranscriptPdf($submission);
        $oldTranscriptPath = $submission->transcript_path;
        $path = "assignment-transcripts/{$submission->user_id}/{$submission->assignment_id}/submission-{$submission->id}-" . Str::uuid() . '.pdf';

        if (! Storage::disk('local')->put($path, $pdf)) {
            throw new \RuntimeException('The assignment transcript could not be generated.');
        }

        try {
            $submission->transcript_path = $path;
            $submission->transcript_generated_at = now();
            $submission->save();
        } catch (\Throwable $e) {
            Storage::disk('local')->delete($path);
            throw $e;
        }

        if ($oldTranscriptPath && $oldTranscriptPath !== $path) {
            Storage::disk('local')->delete($oldTranscriptPath);
        }

        return $submission->fresh();
    }

    protected function renderTranscriptPdf(AssignmentSubmission $submission): string
    {
        $assignment = $submission->assignment;
        $course = $assignment->course;
        $user = $submission->user;

        $options = new Options();
        $options->set('defaultFont', 'DejaVu Sans');
        $options->set('isRemoteEnabled', false);
        $options->set('isHtml5ParserEnabled', true);
        $options->set('dpi', 110);

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($this->renderTranscriptHtml($submission));
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return $dompdf->output();
    }

    protected function renderTranscriptHtml(AssignmentSubmission $submission): string
    {
        $assignment = $submission->assignment;
        $course = $assignment->course;
        $user = $submission->user;

        $name = e($user->name);
        $email = e($user->email);
        $courseTitle = e($course->title);
        $assignmentTitle = e($assignment->title);
        $feedback = $submission->feedback
            ? nl2br(e($submission->feedback))
            : 'No additional feedback was provided.';
        $response = $submission->text_content
            ? nl2br(e($submission->text_content))
            : 'No written response was submitted.';
        $score = (int) $submission->score;
        $max = (int) $assignment->max_points;
        $percentage = $max > 0 ? round(($score / $max) * 100, 1) : 0;
        $submitted = $submission->submitted_at?->format('d M Y, H:i') ?? '—';
        $graded = $submission->graded_at?->format('d M Y, H:i') ?? '—';
        $filename = $submission->original_filename ? e($submission->original_filename) : 'No file submitted';
        $reference = 'LWF-' . str_pad((string) $submission->id, 6, '0', STR_PAD_LEFT);

        $logo = '';
        $logoPath = public_path('favicon-192x192.png');
        if (is_file($logoPath)) {
            $mime = mime_content_type($logoPath) ?: 'image/png';
            $logo = 'data:' . $mime . ';base64,' . base64_encode((string) file_get_contents($logoPath));
        }

        $logoMarkup = $logo !== ''
            ? '<img src="' . $logo . '" class="logo" alt="Learn With Flevian">'
            : '<div class="logo-fallback">LWF</div>';

        return '<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Assignment Transcript · ' . $assignmentTitle . '</title>
<style>
@page { size:A4 portrait; margin:0; }
* { box-sizing:border-box; }
html,body { margin:0; padding:0; width:210mm; min-height:297mm; }
body { background:#ffffff; color:#18243a; font-family:DejaVu Sans,sans-serif; font-size:9.2px; }
.page { position:relative; width:210mm; min-height:297mm; background:#fff; }
.header { height:53mm; padding:10mm 14mm 8mm; background:#12356b; color:#fff; }
.logo { width:34px; height:34px; border-radius:9px; object-fit:cover; background:#fff; display:block; margin-bottom:9px; }
.logo-fallback { width:34px; height:34px; border-radius:9px; background:#fff; color:#1554c0; font-weight:800; font-size:10px; line-height:34px; text-align:center; margin-bottom:9px; }
.eyebrow { color:#a9c8ff; text-transform:uppercase; letter-spacing:1.7px; font-size:6.7px; font-weight:800; }
h1 { margin:4px 0 3px; font-size:22px; line-height:1.08; letter-spacing:-.25px; color:#fff; }
.subtitle { color:#d8e4f8; font-size:8.8px; }
.reference { margin-top:9px; color:#a9c8ff; font-size:6.5px; font-weight:800; letter-spacing:1.1px; }
.content { padding:8.5mm 14mm 15mm; }
.score-card { width:100%; background:#f0f6ff; border:1px solid #d7e6fb; border-radius:10px; padding:11px 13px; margin-bottom:10px; }
.score-label { color:#55739e; text-transform:uppercase; letter-spacing:1.1px; font-size:6.7px; font-weight:800; }
.score-row { margin-top:4px; }
.score { color:#1554c0; font-size:25px; font-weight:800; letter-spacing:-.4px; }
.score-max { color:#60728d; font-size:8.5px; }
.percent { float:right; color:#1554c0; font-size:14px; font-weight:800; padding-top:6px; }
.meta { width:100%; border-collapse:separate; border-spacing:6px; margin:-6px; margin-bottom:6px; }
.meta td { width:50%; vertical-align:top; }
.box { border:1px solid #e1e7ef; border-radius:8px; padding:8px 9px; min-height:43px; background:#fff; }
.label { color:#8b98aa; text-transform:uppercase; letter-spacing:1px; font-size:6.2px; font-weight:800; }
.value { color:#18243a; margin-top:3px; font-size:8.3px; font-weight:700; line-height:1.35; }
.section { margin-top:9px; }
.section-head { margin-bottom:5px; }
.section-title { color:#18243a; font-size:9.5px; font-weight:800; margin:0; }
.section-rule { width:22px; border-top:2px solid #1554c0; margin-top:3px; }
.panel { border:1px solid #e1e7ef; border-radius:8px; padding:8px 10px; line-height:1.45; color:#43526a; font-size:8px; background:#fff; }
.feedback { background:#f7faff; border-color:#d9e7fa; color:#29466d; }
.file-row { width:100%; background:#f8fafc; border:1px solid #e3e8ef; border-radius:8px; padding:8px 10px; }
.file-name { font-weight:800; color:#18243a; font-size:8px; }
.file-meta { color:#7c899c; margin-top:2px; font-size:6.9px; }
.response { white-space:normal; }
.footer { position:absolute; left:14mm; right:14mm; bottom:8mm; border-top:1px solid #e4e9f1; padding-top:5px; color:#8a96a7; font-size:6.4px; line-height:1.4; }
.footer strong { color:#637189; }
</style>
</head>
<body>
<div class="page">
<header class="header">
' . $logoMarkup . '
<div class="eyebrow">Learn With Flevian · Academic Record</div>
<h1>Assignment Transcript</h1>
<div class="subtitle">' . $courseTitle . '</div>
<div class="reference">TRANSCRIPT REFERENCE · ' . e($reference) . '</div>
</header>
<main class="content">
<div class="score-card">
<div class="score-label">Final result</div>
<div class="score-row"><span class="score">' . $score . '</span> <span class="score-max">/ ' . $max . ' points</span><span class="percent">' . $percentage . '%</span></div>
</div>
<table class="meta" cellpadding="0" cellspacing="0">
<tr>
<td><div class="box"><div class="label">Student</div><div class="value">' . $name . '<br>' . $email . '</div></div></td>
<td><div class="box"><div class="label">Assignment</div><div class="value">' . $assignmentTitle . '</div></div></td>
</tr>
<tr>
<td><div class="box"><div class="label">Attempt</div><div class="value">Attempt ' . (int) $submission->attempt_number . ' · Graded</div></div></td>
<td><div class="box"><div class="label">Dates</div><div class="value">Submitted ' . e($submitted) . '<br>Graded ' . e($graded) . '</div></div></td>
</tr>
</table>
<section class="section">
<div class="section-head"><div class="section-title">Instructor feedback</div><div class="section-rule"></div></div>
<div class="panel feedback">' . $feedback . '</div>
</section>
<section class="section">
<div class="section-head"><div class="section-title">Submitted work</div><div class="section-rule"></div></div>
<div class="file-row"><div class="file-name">' . $filename . '</div><div class="file-meta">Submitted as part of assignment attempt ' . (int) $submission->attempt_number . '</div></div>
</section>
<section class="section">
<div class="section-head"><div class="section-title">Written response</div><div class="section-rule"></div></div>
<div class="panel response">' . $response . '</div>
</section>
</main>
<footer class="footer"><strong>Learn With Flevian LMS</strong> · Official student-facing record of the graded assignment submission · Transcript reference ' . e($reference) . '.</footer>
</div>
</body>
</html>';
    }
}
