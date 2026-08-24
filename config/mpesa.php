<?php

return [
    'environment' => env('MPESA_ENV', 'production'),
    'consumer_key' => env('MPESA_CONSUMER_KEY'),
    'consumer_secret' => env('MPESA_CONSUMER_SECRET'),
    'business_shortcode' => env('MPESA_BUSINESS_SHORTCODE'),
    'passkey' => env('MPESA_PASSKEY'),
    'transaction_type' => env('MPESA_TRANSACTION_TYPE', 'CustomerPayBillOnline'),
    'callback_url' => env('MPESA_CALLBACK_URL', rtrim((string) env('APP_URL'), '/') . '/payments/mpesa/callback'),
    'timeout' => (int) env('MPESA_TIMEOUT', 30),
    'base_url' => env('MPESA_BASE_URL') ?: (env('MPESA_ENV', 'production') === 'sandbox'
        ? 'https://sandbox.safaricom.co.ke'
        : 'https://api.safaricom.co.ke'),
];
