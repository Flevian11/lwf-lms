<?php

namespace App\Notifications;

use App\Models\Assignment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AssignmentAllocatedNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly Assignment $assignment) {}
    public function via(object $notifiable): array { return ['mail']; }
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('New assignment: '.$this->assignment->title)
            ->greeting('Hello '.$notifiable->name.',')
            ->line('A new assignment has been allocated to you for '.$this->assignment->course->title.'.')
            ->line($this->assignment->title)
            ->action('Open Assignments', route('assignments.index'))
            ->line('Please sign in to view the instructions and submission requirements.');
    }
}
