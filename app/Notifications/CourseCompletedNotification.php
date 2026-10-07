<?php

namespace App\Notifications;

use App\Models\CourseEnrollment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CourseCompletedNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly CourseEnrollment $enrollment) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $enrollment = $this->enrollment->loadMissing(['course']);
        $course = $enrollment->course;
        $completedOn = $enrollment->completed_at?->format('d M Y') ?? now()->format('d M Y');

        return (new MailMessage)
            ->subject('Course completed: '.$course->title)
            ->greeting('Congratulations '.$notifiable->name.',')
            ->line('You have completed every lesson in "'.$course->title.'".')
            ->line('Completion date: '.$completedOn)
            ->line('Your certificate is now available to download from the LMS.')
            ->action('Download certificate', route('certificates.download', $enrollment->id))
            ->line('Well done — keep building on this momentum.');
    }
}