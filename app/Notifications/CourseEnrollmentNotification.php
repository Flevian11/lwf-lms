<?php

namespace App\Notifications;

use App\Models\Course;
use App\Models\CourseEnrollment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CourseEnrollmentNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Course $course,
        private readonly CourseEnrollment $enrollment,
    ) {
    }

    /**
     * Send immediately through the application's configured mailer.
     * The enrollment service deliberately catches delivery failures.
     * This notification is therefore not required for enrollment success.
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $hasAccess = $this->enrollment->hasAccess();
        $learnUrl = route('courses.learn', $this->course->slug);
        $courseUrl = route('courses.show', $this->course->slug);

        return (new MailMessage)
            ->subject(
                $hasAccess
                    ? 'You are enrolled — '.$this->course->title
                    : 'Enrollment received — '.$this->course->title,
            )
            ->view('emails.courses.course-enrollment', [
                'user' => $notifiable,
                'course' => $this->course,
                'enrollment' => $this->enrollment,
                'hasAccess' => $hasAccess,
                'learnUrl' => $learnUrl,
                'courseUrl' => $courseUrl,
            ]);
    }
}
