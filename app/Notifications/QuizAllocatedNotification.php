<?php

namespace App\Notifications;

use App\Models\Quiz;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class QuizAllocatedNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly Quiz $quiz) {}
    public function via(object $notifiable): array { return ['mail']; }
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('New quiz: '.$this->quiz->title)
            ->greeting('Hello '.$notifiable->name.',')
            ->line('A new quiz has been allocated to you for '.$this->quiz->course->title.'.')
            ->line($this->quiz->title)
            ->action('Open Quizzes', route('quizzes.index'))
            ->line('Please sign in to review the quiz availability and attempt it when ready.');
    }
}
