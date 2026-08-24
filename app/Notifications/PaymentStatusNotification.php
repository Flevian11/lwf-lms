<?php

namespace App\Notifications;

use App\Models\Payment;
use App\Models\PaymentTransaction;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentStatusNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Payment $payment,
        private readonly PaymentTransaction $transaction,
        private readonly string $status,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $this->payment->loadMissing('course:id,title,slug');

        $successful = $this->status === 'successful';
        $course = $this->payment->course;
        $subject = $successful
            ? 'Payment confirmed — '.$course?->title
            : 'Payment not completed — '.$course?->title;

        return (new MailMessage)
            ->subject($subject)
            ->view('emails.payments.status', [
                'user' => $notifiable,
                'payment' => $this->payment,
                'transaction' => $this->transaction,
                'course' => $course,
                'successful' => $successful,
            ]);
    }
}
