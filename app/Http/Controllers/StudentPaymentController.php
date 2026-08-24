<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\Payment;
use App\Models\PaymentTransaction;
use App\Models\User;
use App\Services\MpesaService;
use App\Notifications\PaymentStatusNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class StudentPaymentController extends Controller
{
    public function __construct(
        protected MpesaService $mpesa,
    ) {
    }

    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        // Payments are enrollment-driven. A student can only pay for a paid
        // course they are currently enrolled in. Successful payments are
        // accumulated so instalment payments reduce the outstanding balance.
        $enrolledCourseIds = $user->courseEnrollments()
            ->where('status', 'active')
            ->pluck('course_id');

        $courses = Course::query()
            ->with('category')
            ->whereIn('id', $enrolledCourseIds)
            ->where('status', 'published')
            ->where('access_type', '!=', 'free')
            ->where('price', '>', 0)
            ->orderByDesc('published_at')
            ->orderBy('title')
            ->get()
            ->map(function (Course $course) use ($user): ?array {
                $price = (float) $course->price;

                $paid = (float) Payment::query()
                    ->where('user_id', $user->id)
                    ->where('course_id', $course->id)
                    ->where('status', 'successful')
                    ->sum('amount');

                $due = max(0, round($price - $paid, 2));

                if ($due <= 0) {
                    return null;
                }

                $pending = Payment::query()
                    ->where('user_id', $user->id)
                    ->where('course_id', $course->id)
                    ->whereIn('status', ['pending', 'processing'])
                    ->latest('id')
                    ->first();

                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'slug' => $course->slug,
                    'thumbnail_path' => $course->thumbnail_path,
                    'category' => $course->category?->name,
                    'level' => $course->level,
                    'price' => (string) $price,
                    'paid_amount' => (string) $paid,
                    'due_amount' => (string) $due,
                    'currency' => $course->currency ?: 'KES',
                    'pending_payment_id' => $pending?->id,
                    'pending_status' => $pending?->status,
                ];
            })
            ->filter()
            ->values();

        $payments = Payment::query()
            ->with([
                'course:id,title,slug',
                'transactions:id,payment_id,receipt_number,status,transaction_reference,processed_at,result_description',
            ])
            ->where('user_id', $user->id)
            ->latest('id')
            ->limit(30)
            ->get()
            ->map(fn (Payment $payment): array => $this->paymentPayload($payment))
            ->values();

        return Inertia::render('Payments', [
            'student' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar_path' => $user->avatar_path,
                'timezone' => $user->timezone,
                'locale' => $user->locale,
            ],

            'stats' => [
                'courses' => [
                    'total' => $user->courseEnrollments()->count(),
                    'active' => $user->courseEnrollments()->where('status', 'active')->count(),
                    'completed' => $user->courseEnrollments()->where('status', 'completed')->count(),
                ],

                'progress' => [
                    'percentage' => 0,
                    'completed_lessons' => 0,
                    'tracked_lessons' => 0,
                ],

                'points' => [
                    'total' => (int) $user->pointTransactions()->sum('points'),
                ],

                'streak' => [
                    'current' => 0,
                    'longest' => 0,
                    'last_activity_on' => null,
                ],
            ],

            'courses' => $courses,
            'payments' => $payments,
        ]);
    }

    public function initiate(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'phone' => ['required', 'string', 'max:30'],
            'amount' => ['required', 'numeric', 'min:1', 'max:150000'],
        ]);

        $course = Course::query()
            ->where('id', $validated['course_id'])
            ->where('status', 'published')
            ->firstOrFail();

        $enrollment = CourseEnrollment::query()
            ->where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('status', 'active')
            ->first();

        if (! $enrollment) {
            throw ValidationException::withMessages([
                'course_id' => 'You can only make a payment for a course you are currently enrolled in.',
            ]);
        }

        if ($course->access_type === 'free' || (float) $course->price <= 0) {
            throw ValidationException::withMessages([
                'course_id' => 'This course does not require a payment.',
            ]);
        }

        $amount = round((float) $validated['amount'], 2);
        $price = round((float) $course->price, 2);

        $paid = round(
            (float) Payment::query()
                ->where('user_id', $user->id)
                ->where('course_id', $course->id)
                ->where('status', 'successful')
                ->sum('amount'),
            2
        );

        $due = max(0, round($price - $paid, 2));

        if ($due <= 0) {
            throw ValidationException::withMessages([
                'amount' => 'This course has already been fully paid for.',
            ]);
        }

        if ($amount > $due) {
            throw ValidationException::withMessages([
                'amount' => 'The maximum payment for this course is '
                    . ($course->currency ?: 'KES')
                    . ' '
                    . number_format($due, 2)
                    . '. You cannot pay more than the outstanding balance.',
            ]);
        }

        $phone = $this->normalizePhone((string) $validated['phone']);

        if (! $phone) {
            throw ValidationException::withMessages([
                'phone' => 'Enter a valid Kenyan M-Pesa number, for example 0712345678 or 254712345678.',
            ]);
        }

        /*
         * Check for an existing payment that is genuinely awaiting
         * Safaricom confirmation.
         *
         * A processing payment WITHOUT a checkout request ID is invalid.
         * This protects the student from being permanently blocked by a
         * malformed/partial previous request.
         */
        $pending = Payment::query()
            ->with('transactions')
            ->where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->whereIn('status', ['pending', 'processing'])
            ->latest('id')
            ->first();

        if ($pending) {
            $transaction = $pending->transactions
                ->sortByDesc('id')
                ->first();

            $checkoutRequestId = $transaction?->checkout_request_id;

            /*
             * A valid processing payment must have a CheckoutRequestID.
             *
             * If it doesn't, mark the broken payment as failed and allow
             * the student to make a fresh STK request.
             */
            if (
                $pending->status === 'processing'
                && (! is_string($checkoutRequestId) || trim($checkoutRequestId) === '')
            ) {
                DB::transaction(function () use ($pending, $transaction): void {
                    $pending->update([
                        'status' => 'failed',
                        'failed_at' => now(),
                    ]);

                    if ($transaction) {
                        $transaction->update([
                            'status' => 'failed',
                            'result_code' => 'MISSING_CHECKOUT_REQUEST_ID',
                            'result_description' => 'The previous M-Pesa request did not return a CheckoutRequestID.',
                            'processed_at' => now(),
                        ]);
                    }
                });

                $pending = null;
            }
        }

        if ($pending) {
            return response()->json([
                'success' => true,
                'message' => 'A payment is already being processed for this course.',
                'payment' => $this->paymentPayload(
                    $pending->load('course:id,title,slug')
                ),
            ]);
        }

        /*
         * Create our local payment record before contacting Safaricom.
         *
         * It remains "pending" until Safaricom returns a valid
         * CheckoutRequestID.
         */
        $payment = Payment::create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'amount' => $amount,
            'currency' => $course->currency ?: 'KES',
            'provider' => 'mpesa',
            'payment_method' => 'stk_push',
            'status' => 'pending',
            'description' => 'Course payment: ' . $course->title,
            'metadata' => [
                'phone' => $phone,
                'course_slug' => $course->slug,
            ],
            'requested_at' => now(),
        ]);

        // Link this payment to the existing enrollment immediately.
        // Access is still withheld until Safaricom confirms the callback.
        $enrollment->update([
            'payment_id' => $payment->id,
        ]);

        $accountReference = 'LWF' . now()->format('ymdHis') . $payment->id;

        $transaction = $payment->transactions()->create([
            'provider' => 'mpesa',
            'transaction_reference' => $accountReference,
            'status' => 'initiated',
            'request_payload' => [
                'phone' => $phone,
                'amount' => (int) round($amount),
                'course_id' => $course->id,
            ],
        ]);

        try {
            /*
             * Ask Safaricom to initiate the STK Push.
             */
            $response = $this->mpesa->initiateStkPush(
                $phone,
                (int) round($amount),
                $accountReference,
                'LWF ' . $course->title,
            );

            /*
             * CRITICAL:
             *
             * We do NOT consider the request successful merely because
             * MpesaService returned an array.
             *
             * A genuine STK Push must return a CheckoutRequestID.
             */
            $checkoutRequestId = $response['CheckoutRequestID'] ?? null;
            $merchantRequestId = $response['MerchantRequestID'] ?? null;

            if (
                ! is_string($checkoutRequestId)
                || trim($checkoutRequestId) === ''
            ) {
                throw new \RuntimeException(
                    'M-Pesa STK Push did not return a CheckoutRequestID.'
                );
            }

            /*
             * Only after validating the CheckoutRequestID do we mark the
             * payment as processing.
             *
             * Updating both records in one transaction prevents a payment
             * from becoming "processing" while its transaction remains
             * incomplete.
             */
            DB::transaction(function () use (
                $payment,
                $transaction,
                $checkoutRequestId,
                $merchantRequestId,
                $response
            ): void {
                $payment->update([
                    'status' => 'processing',
                    'processing_at' => now(),
                    'provider_reference' => $checkoutRequestId,
                ]);

                $transaction->update([
                    'status' => 'pending',
                    'merchant_request_id' => $merchantRequestId,
                    'checkout_request_id' => $checkoutRequestId,
                    'response_payload' => $response,
                ]);
            });

            return response()->json([
                'success' => true,
                'message' => 'STK Push sent. Check your phone and enter your M-Pesa PIN to complete the payment.',
                'payment' => $this->paymentPayload(
                    $payment->fresh()->load('course:id,title,slug')
                ),
            ]);
        } catch (Throwable $exception) {
            /*
             * Any exception, including a response without a
             * CheckoutRequestID, means this payment attempt did NOT
             * successfully enter the Safaricom STK flow.
             */
            $payment->update([
                'status' => 'failed',
                'failed_at' => now(),
            ]);

            $transaction->update([
                'status' => 'failed',
                'result_description' => $exception->getMessage(),
                'processed_at' => now(),
            ]);

            report($exception);

            try {
                $user->notify(new PaymentStatusNotification(
                    $payment->fresh()->load('course:id,title,slug'),
                    $transaction->fresh(),
                    'failed',
                ));
            } catch (Throwable $mailException) {
                /*
                 * Notification failure must never hide the actual
                 * M-Pesa failure.
                 */
                report($mailException);
            }

            return response()->json([
                'success' => false,
                'message' => 'We could not send the M-Pesa payment prompt. Please verify the number and try again.',
            ], 422);
        }
    }

    public function status(Request $request, Payment $payment): JsonResponse
    {
        abort_unless(
            $payment->user_id === $request->user()->id,
            403
        );

        return response()->json([
            'success' => true,
            'payment' => $this->paymentPayload(
                $payment->load([
                    'course:id,title,slug',
                    'transactions',
                ])
            ),
        ]);
    }

    public function callback(Request $request): JsonResponse
    {
        $callback = $request->input('Body.stkCallback', []);

        $checkoutRequestId = $callback['CheckoutRequestID'] ?? null;

        if (
            ! is_string($checkoutRequestId)
            || $checkoutRequestId === ''
        ) {
            return response()->json([
                'ResultCode' => 0,
                'ResultDesc' => 'Accepted',
            ]);
        }

        /*
         * Match the Safaricom callback to the exact transaction that
         * created the STK request.
         */
        $transaction = PaymentTransaction::query()
            ->where('checkout_request_id', $checkoutRequestId)
            ->first();

        if (! $transaction) {
            return response()->json([
                'ResultCode' => 0,
                'ResultDesc' => 'Accepted',
            ]);
        }

        $payment = Payment::query()
            ->find($transaction->payment_id);

        if (! $payment) {
            return response()->json([
                'ResultCode' => 0,
                'ResultDesc' => 'Accepted',
            ]);
        }

        /*
         * Safaricom may retry callbacks.
         *
         * Never process or email the same terminal payment twice.
         */
        if (
            in_array(
                $payment->status,
                [
                    'successful',
                    'failed',
                    'cancelled',
                    'refunded',
                    'partially_refunded',
                ],
                true
            )
        ) {
            return response()->json([
                'ResultCode' => 0,
                'ResultDesc' => 'Accepted',
            ]);
        }

        $resultCode = (string) (
            $callback['ResultCode'] ?? '1'
        );

        $resultDescription = (string) (
            $callback['ResultDesc']
                ?? 'Payment was not completed.'
        );

        $metadata = $this->callbackMetadata(
            $callback['CallbackMetadata']['Item'] ?? []
        );

        $notificationType = $resultCode === '0'
            ? 'successful'
            : 'failed';

        DB::transaction(
            function () use (
                $payment,
                $transaction,
                $resultCode,
                $resultDescription,
                $metadata,
                $callback
            ): void {
                /*
                 * Non-zero ResultCode means Safaricom did not complete
                 * the payment.
                 */
                if ($resultCode !== '0') {
                    $payment->update([
                        'status' => 'failed',
                        'failed_at' => now(),
                    ]);

                    $transaction->update([
                        'status' => 'failed',
                        'result_code' => $resultCode,
                        'result_description' => $resultDescription,
                        'response_payload' => $callback,
                        'processed_at' => now(),
                    ]);

                    return;
                }

                /*
                 * Validate callback amount when Safaricom provides it.
                 */
                $callbackAmount = isset($metadata['Amount'])
                    ? (float) $metadata['Amount']
                    : null;

                if (
                    $callbackAmount !== null
                    && abs(
                        $callbackAmount - (float) $payment->amount
                    ) > 0.001
                ) {
                    $payment->update([
                        'status' => 'failed',
                        'failed_at' => now(),
                    ]);

                    $transaction->update([
                        'status' => 'failed',
                        'result_code' => 'AMOUNT_MISMATCH',
                        'result_description' => 'Callback amount did not match the payment amount.',
                        'response_payload' => $callback,
                        'processed_at' => now(),
                    ]);

                    return;
                }

                /*
                 * Use Safaricom's receipt number as the provider reference
                 * once the payment is actually successful.
                 */
                $receipt = isset($metadata['MpesaReceiptNumber'])
                    ? (string) $metadata['MpesaReceiptNumber']
                    : 'LWF-' . str_pad(
                        (string) $payment->id,
                        8,
                        '0',
                        STR_PAD_LEFT
                    );

                $payment->update([
                    'status' => 'successful',
                    'completed_at' => now(),
                    'provider_reference' => $receipt,
                ]);

                $transaction->update([
                    'status' => 'successful',
                    'result_code' => '0',
                    'result_description' => $resultDescription,
                    'receipt_number' => $receipt,
                    'response_payload' => $callback,
                    'processed_at' => now(),
                ]);

                /*
                 * A successful payment must belong to an existing
                 * enrollment.
                 *
                 * Never create an enrollment from a payment callback.
                 */
                $enrollment = CourseEnrollment::query()
                    ->where('user_id', $payment->user_id)
                    ->where('course_id', $payment->course_id)
                    ->where('status', 'active')
                    ->lockForUpdate()
                    ->first();

                if ($enrollment) {
                    $enrollment->update([
                        'source' => 'payment',
                        'payment_id' => $payment->id,
                        'status' => 'active',
                        'access_granted_at' =>
                            $enrollment->access_granted_at ?: now(),
                    ]);
                }
            }
        );

        /*
         * Notification failure must never roll back a successful payment
         * or course access.
         */
        try {
            $payment->refresh()
                ->load('course:id,title,slug');

            $transaction->refresh();

            $payment->user?->notify(
                new PaymentStatusNotification(
                    $payment,
                    $transaction,
                    $notificationType,
                )
            );
        } catch (Throwable $mailException) {
            report($mailException);
        }

        return response()->json([
            'ResultCode' => 0,
            'ResultDesc' => 'Accepted',
        ]);
    }

    protected function normalizePhone(string $phone): ?string
    {
        $digits = preg_replace(
            '/\D+/',
            '',
            trim($phone)
        );

        if (! is_string($digits)) {
            return null;
        }

        /*
         * 0712345678
         * 0112345678
         */
        if (
            preg_match(
                '/^0(7\d{8}|1\d{8})$/',
                $digits
            )
        ) {
            return '254' . substr($digits, 1);
        }

        /*
         * 254712345678
         * 254112345678
         */
        if (
            preg_match(
                '/^254(7\d{8}|1\d{8})$/',
                $digits
            )
        ) {
            return $digits;
        }

        return null;
    }

    protected function callbackMetadata(array $items): array
    {
        $result = [];

        foreach ($items as $item) {
            if (
                ! is_array($item)
                || ! isset($item['Name'])
            ) {
                continue;
            }

            $result[(string) $item['Name']]
                = $item['Value'] ?? null;
        }

        return $result;
    }

    protected function paymentPayload(Payment $payment): array
    {
        $transaction = $payment->transactions
            ->sortByDesc('id')
            ->first();

        return [
            'id' => $payment->id,

            'course_id' => $payment->course_id,

            'course' => $payment->course
                ? [
                    'id' => $payment->course->id,
                    'title' => $payment->course->title,
                    'slug' => $payment->course->slug,
                ]
                : null,

            'amount' => (string) $payment->amount,

            'currency' => $payment->currency,

            'status' => $payment->status,

            'phone' => data_get(
                $payment->metadata,
                'phone'
            ),

            'receipt_number' => $transaction?->receipt_number,

            'transaction_reference' =>
                $transaction?->transaction_reference,

            'result_description' =>
                $transaction?->result_description,

            'requested_at' =>
                $payment->requested_at?->toISOString(),

            'completed_at' =>
                $payment->completed_at?->toISOString(),

            'failed_at' =>
                $payment->failed_at?->toISOString(),
        ];
    }
}