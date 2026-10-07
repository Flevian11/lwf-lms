<?php

namespace App\Notifications;

use App\Models\AssignmentSubmission;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AssignmentGradedNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly AssignmentSubmission $submission) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $submission = $this->submission->loadMissing(['assignment.course']);
        $assignment = $submission->assignment;
        $course = $assignment->course;

        $score = (int) $submission->score;
        $max = (int) $assignment->max_points;
        $pct = $max > 0 ? round(($score / $max) * 100, 1) : 0;

        $message = (new MailMessage)
            ->subject('Assignment graded: '.$assignment->title)
            ->greeting('Hello '.$notifiable->name.',')
            ->line('Your submission for "'.$assignment->title.'" in '.($course?->title ?? 'your course').' has been graded.')
            ->line('Score: '.$score.' / '.$max.' ('.$pct.'%)');

        if ($submission->feedback) {
            $message->line('Feedback from your instructor:');
            $message->line($submission->feedback);
        }

        return $message
            ->action('View submission', route('assignments.show', $assignment->id))
            ->line('The full graded transcript is available for download from the LMS.');
    }
}