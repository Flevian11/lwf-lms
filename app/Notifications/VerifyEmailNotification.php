<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail as BaseVerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;

class VerifyEmailNotification extends BaseVerifyEmail
{
    /**
     * The user receiving the notification.
     */
    protected mixed $user;

    /**
     * Build the mail representation of the notification.
     */
    public function toMail($notifiable)
    {
        $this->user = $notifiable;

        return parent::toMail($notifiable);
    }

    /**
     * Build the branded verification email.
     */
    protected function buildMailMessage($url)
    {
        return (new MailMessage)
            ->subject(
                config(
                    'email.verification_subject',
                    'Verify Your Learn With Flevian Account'
                )
            )
            ->view('emails.auth.verify-email', [
                'user' => $this->user,
                'verificationUrl' => $url,
                'expirationMinutes' => config(
                    'auth.verification.expire',
                    60
                ),
            ]);
    }
}