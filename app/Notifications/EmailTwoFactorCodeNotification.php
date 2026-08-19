<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EmailTwoFactorCodeNotification extends Notification
{
    /**
     * The one-time authentication code.
     */
    public function __construct(
        private readonly string $code,
    ) {
    }

    /**
     * Get the notification delivery channels.
     *
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Build the email representation.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Your Learn With Flevian security code')
            ->greeting('Hello '.$notifiable->name.',')
            ->line(
                'A sign-in attempt for your Learn With Flevian account requires a security code.'
            )
            ->line('Your verification code is:')
            ->line($this->code)
            ->line('This code expires in 10 minutes.')
            ->line(
                'If you did not attempt to sign in, you can safely ignore this email.'
            )
            ->salutation('Learn With Flevian');
    }
}