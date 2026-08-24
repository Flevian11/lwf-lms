<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
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

        $response = $this->client()
            ->post('/mpesa/stkpush/v1/processrequest', [
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
            ])
            ->throw()
            ->json();

        if (($response['ResponseCode'] ?? null) !== '0') {
            throw new RuntimeException(
                (string) ($response['ResponseDescription'] ?? 'M-Pesa rejected the STK request.')
            );
        }

        return $response;
    }

    protected function client(): PendingRequest
    {
        $key = (string) config('mpesa.consumer_key');
        $secret = (string) config('mpesa.consumer_secret');

        if ($key === '' || $secret === '') {
            throw new RuntimeException('M-Pesa consumer credentials are not configured.');
        }

        $token = Cache::remember('lwf.mpesa.access_token', now()->addMinutes(50), function () use ($key, $secret): string {
            $response = Http::baseUrl(rtrim((string) config('mpesa.base_url'), '/'))
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
                throw new RuntimeException('M-Pesa authorization did not return an access token.');
            }

            return $token;
        });

        return Http::baseUrl(rtrim((string) config('mpesa.base_url'), '/'))
            ->timeout((int) config('mpesa.timeout', 30))
            ->withToken($token)
            ->acceptJson();
    }
}
