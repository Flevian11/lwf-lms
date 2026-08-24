<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class MpesaService
{
    public function initiateStkPush(
        string $phone,
        int $amount,
        string $accountReference,
        string $description,
    ): array {
        $shortcode = (string) config('mpesa.business_shortcode');
        $passkey = (string) config('mpesa.passkey');
        $timestamp = now()->format('YmdHis');

        if ($shortcode === '' || $passkey === '') {
            throw new RuntimeException('M-Pesa business shortcode or passkey is not configured.');
        }

        $password = base64_encode($shortcode . $passkey . $timestamp);

        $payload = [
            'BusinessShortCode' => $shortcode,
            'Password' => $password,
            'Timestamp' => $timestamp,
            'TransactionType' => (string) config('mpesa.transaction_type'),
            'Amount' => $amount,
            'PartyA' => $phone,
            'PartyB' => $shortcode,
            'PhoneNumber' => $phone,
            'CallBackURL' => (string) config('mpesa.callback_url'),
            'AccountReference' => $accountReference,
            'TransactionDesc' => $description,
        ];

        Log::info('LWF M-Pesa STK Push initiated.', [
            'amount' => $amount,
            'account_reference' => $accountReference,
            'phone' => $this->maskPhone($phone),
        ]);

        $response = $this->client()
            ->post('/mpesa/stkpush/v1/processrequest', $payload)
            ->throw()
            ->json();

        if (($response['ResponseCode'] ?? null) !== '0') {
            Log::warning('LWF M-Pesa STK Push rejected.', [
                'response_code' => $response['ResponseCode'] ?? null,
                'response_description' => $response['ResponseDescription'] ?? null,
            ]);

            throw new RuntimeException(
                (string) ($response['ResponseDescription'] ?? 'M-Pesa rejected the STK request.')
            );
        }

        Log::info('LWF M-Pesa STK Push accepted.', [
            'merchant_request_id' => $response['MerchantRequestID'] ?? null,
            'checkout_request_id' => $response['CheckoutRequestID'] ?? null,
            'customer_message' => $response['CustomerMessage'] ?? null,
        ]);

        return $response;
    }

    /**
     * Query an existing STK Push using its CheckoutRequestID.
     *
     * This is used to reconcile transactions when the asynchronous
     * Safaricom callback has not yet reached the application.
     */
    public function queryStkPush(string $checkoutRequestId): array
    {
        $shortcode = (string) config('mpesa.business_shortcode');
        $passkey = (string) config('mpesa.passkey');
        $checkoutRequestId = trim($checkoutRequestId);
        $timestamp = now()->format('YmdHis');

        if ($shortcode === '' || $passkey === '') {
            throw new RuntimeException('M-Pesa business shortcode or passkey is not configured.');
        }

        if ($checkoutRequestId === '') {
            throw new RuntimeException('M-Pesa CheckoutRequestID is required.');
        }

        $password = base64_encode($shortcode . $passkey . $timestamp);

        Log::info('LWF M-Pesa STK Query initiated.', [
            'checkout_request_id' => $checkoutRequestId,
        ]);

        $response = $this->client()
            ->post('/mpesa/stkpushquery/v1/query', [
                'BusinessShortCode' => $shortcode,
                'Password' => $password,
                'Timestamp' => $timestamp,
                'CheckoutRequestID' => $checkoutRequestId,
            ])
            ->throw()
            ->json();

        Log::info('LWF M-Pesa STK Query response.', [
            'checkout_request_id' => $checkoutRequestId,
            'response_code' => $response['ResponseCode'] ?? null,
            'response_description' => $response['ResponseDescription'] ?? null,
            'result_code' => $response['ResultCode'] ?? null,
            'result_description' => $response['ResultDesc'] ?? null,
        ]);

        return $response;
    }

    protected function client(): PendingRequest
    {
        $key = (string) config('mpesa.consumer_key');
        $secret = (string) config('mpesa.consumer_secret');

        if ($key === '' || $secret === '') {
            throw new RuntimeException('M-Pesa consumer credentials are not configured.');
        }

        $token = Cache::remember(
            'lwf.mpesa.access_token',
            now()->addMinutes(50),
            function () use ($key, $secret): string {
                $response = Http::baseUrl(
                    rtrim((string) config('mpesa.base_url'), '/')
                )
                    ->timeout((int) config('mpesa.timeout', 30))
                    ->withBasicAuth($key, $secret)
                    ->acceptJson()
                    ->get('/oauth/v1/generate', [
                        'grant_type' => 'client_credentials',
                    ])
                    ->throw()
                    ->json();

                $token = $response['access_token'] ?? null;

                if (! is_string($token) || $token === '') {
                    throw new RuntimeException(
                        'M-Pesa authorization did not return an access token.'
                    );
                }

                return $token;
            }
        );

        return Http::baseUrl(
            rtrim((string) config('mpesa.base_url'), '/')
        )
            ->timeout((int) config('mpesa.timeout', 30))
            ->withToken($token)
            ->acceptJson();
    }

    protected function maskPhone(string $phone): string
    {
        $phone = preg_replace('/\D+/', '', $phone) ?? '';

        if ($phone === '') {
            return 'unknown';
        }

        if (strlen($phone) <= 4) {
            return '****';
        }

        return substr($phone, 0, 4)
            . str_repeat('*', max(0, strlen($phone) - 7))
            . substr($phone, -3);
    }
}