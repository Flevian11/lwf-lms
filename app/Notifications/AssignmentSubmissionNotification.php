<?php

namespace App\Notifications;

use App\Models\AssignmentSubmission;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

class AssignmentSubmissionNotification extends Notification
{
    public function __construct(
        private readonly AssignmentSubmission $submission,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $submission = $this->submission->loadMissing(['assignment.course', 'user']);
        $assignment = $submission->assignment;
        $assignmentUrl = route('assignments.show', $assignment->id);

        $fileUrl = $submission->file_path
            ? URL::temporarySignedRoute(
                'assignments.submissions.email-download',
                now()->addDays(30),
                [
                    'assignment' => $assignment->id,
                    'submission' => $submission->id,
                ],
            )
            : null;

        return (new MailMessage)
            ->subject('Assignment submitted — '.$assignment->title)
            ->view('emails.assignments.assignment-submission', [
                'userName' => $submission->user?->name
                    ?? data_get($notifiable, 'name')
                    ?? 'there',
                'submission' => $submission,
                'assignment' => $assignment,
                'assignmentUrl' => $assignmentUrl,
                'fileUrl' => $fileUrl,
            ]);
    }
}
