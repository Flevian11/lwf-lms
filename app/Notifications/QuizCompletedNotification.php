<?php

namespace App\Notifications;

use App\Models\QuizAttempt;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class QuizCompletedNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly QuizAttempt $attempt) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $attempt = $this->attempt->loadMissing(['quiz.course']);
        $quiz = $attempt->quiz;
        $course = $quiz?->course;

        $score = (int) $attempt->score;
        $max = (int) $attempt->max_score;
        $pct = (float) ($attempt->percentage ?? 0);
        $passed = (bool) $attempt->passed;

        $resultUrl = route('quizzes.result', [
            'quiz'    => $quiz->id,
            'attempt' => $attempt->id,
        ]);

        $message = (new MailMessage)
            ->subject(($passed ? 'Passed: ' : 'Result: ').$quiz->title)
            ->greeting('Hello '.$notifiable->name.',')
            ->line('Your attempt for "'.$quiz->title.'" in '.($course?->title ?? 'your course').' has been graded.')
            ->line('Score: '.$score.' / '.$max.' ('.round($pct, 1).'%)')
            ->line($passed
                ? 'Great work — you passed. The result has been recorded on your transcript.'
                : 'You did not reach the passing score this time. Review the explanations and try again if you have attempts remaining.')
            ->action('View result', $resultUrl);

        if ($quiz->max_attempts !== null) {
            $message->line('Maximum attempts: '.$quiz->max_attempts.'.');
        }

        return $message;
    }
}