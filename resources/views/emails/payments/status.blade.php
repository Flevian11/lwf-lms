<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>{{ $successful ? 'Payment Receipt' : 'Payment Update' }}</title>
    <style>
        :root { color-scheme: light dark; }
        body { margin:0; padding:0; width:100%!important; background:#f4f7fb; color:#172033; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; }
        table { border-collapse:collapse; }
        .wrapper { width:100%; background:#f4f7fb; padding:40px 16px; }
        .container { width:100%; max-width:620px; margin:0 auto; background:#fff; border:1px solid #e5eaf1; border-radius:18px; overflow:hidden; }
        .header { padding:32px; text-align:center; border-bottom:1px solid #edf0f5; }
        .logo { width:64px; height:64px; margin:0 auto 14px; border-radius:15px; }
        .brand { margin:0; font-size:21px; font-weight:700; color:#172033; }
        .content { padding:40px 42px; }
        .eyebrow { margin:0 0 12px; font-size:12px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:{{ $successful ? '#059669' : '#dc2626' }}; }
        h1 { margin:0 0 18px; font-size:29px; line-height:1.2; letter-spacing:-.6px; color:#111827; }
        p { margin:0 0 18px; font-size:16px; line-height:1.7; color:#4b5563; }
        .receipt { margin:24px 0; border:1px solid #dce5f2; border-radius:14px; overflow:hidden; }
        .row { padding:15px 18px; border-bottom:1px solid #edf0f5; }
        .row:last-child { border-bottom:0; }
        .label { margin:0 0 5px; font-size:11px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:#64748b; }
        .value { margin:0; font-size:15px; font-weight:700; color:#111827; }
        .status { margin:22px 0; padding:17px 18px; border-radius:12px; border:1px solid {{ $successful ? '#bbf7d0' : '#fecaca' }}; background:{{ $successful ? '#f0fdf4' : '#fef2f2' }}; color:#40516b; font-size:14px; line-height:1.6; }
        .status strong { color:#172033; }
        .button-wrap { padding:7px 0 24px; text-align:center; }
        .button { display:inline-block; padding:14px 27px; border-radius:10px; background:#2563eb; color:#fff!important; font-size:15px; font-weight:750; text-decoration:none; }
        .footer { padding:26px 32px 30px; text-align:center; background:#f8fafc; border-top:1px solid #edf0f5; }
        .footer p { margin:0 0 8px; font-size:13px; line-height:1.6; color:#718096; }
        @media only screen and (max-width:600px) { .wrapper { padding:20px 10px; } .content { padding:32px 24px; } .header { padding:28px 20px 22px; } h1 { font-size:26px; } .button { display:block; } }
        @media (prefers-color-scheme:dark) {
            body,.wrapper { background:#0b1220!important; }
            .container { background:#111827!important; border-color:#243044; }
            .header,.footer { border-color:#243044; }
            .brand,h1,.value { color:#f8fafc!important; }
            p { color:#cbd5e1!important; }
            .receipt { border-color:#263b5f; }
            .row { border-color:#243044; }
            .label { color:#94a3b8!important; }
            .status { background:#172238!important; border-color:#263b5f!important; color:#cbd5e1!important; }
            .status strong { color:#f8fafc!important; }
            .footer { background:#0f172a; }
        }
    </style>
</head>
<body>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td class="wrapper">
<table role="presentation" class="container" cellpadding="0" cellspacing="0" border="0" align="center">
<tr><td class="header">
    <img class="logo" src="{{ asset('favicon-192x192.png') }}" alt="Learn With Flevian" width="64" height="64">
    <p class="brand">Learn With Flevian</p>
</td></tr>
<tr><td class="content">
    <p class="eyebrow">{{ $successful ? 'Payment receipt' : 'Payment update' }}</p>
    <h1>{{ $successful ? 'Payment confirmed.' : 'Payment was not completed.' }}</h1>
    <p>Hello {{ $user->name ?: 'there' }},</p>
    @if ($successful)
        <p>Your M-Pesa payment has been confirmed successfully. This email is your payment receipt.</p>
    @else
        <p>We could not complete the M-Pesa payment below. No successful course payment has been recorded for this attempt.</p>
    @endif

    <div class="receipt">
        <div class="row"><p class="label">Course</p><p class="value">{{ $course?->title ?? 'Course payment' }}</p></div>
        <div class="row"><p class="label">Amount</p><p class="value">{{ $payment->currency }} {{ number_format((float) $payment->amount, 2) }}</p></div>
        <div class="row"><p class="label">M-Pesa receipt</p><p class="value">{{ $transaction->receipt_number ?: 'Not issued' }}</p></div>
        <div class="row"><p class="label">Transaction reference</p><p class="value">{{ $transaction->transaction_reference ?: '—' }}</p></div>
        <div class="row"><p class="label">Date</p><p class="value">{{ optional($payment->completed_at ?? $payment->failed_at ?? $payment->requested_at)->format('d M Y, h:i A') }}</p></div>
        @if (!$successful && $transaction->result_description)
            <div class="row"><p class="label">Reason</p><p class="value">{{ $transaction->result_description }}</p></div>
        @endif
    </div>

    <div class="status">
        <strong>{{ $successful ? 'Payment successful' : 'Payment failed' }}</strong><br>
        @if ($successful)
            Your course access has been updated. You can continue learning from your LMS account.
        @else
            You can return to Payments and try again when you are ready.
        @endif
    </div>

    <div class="button-wrap">
        <a href="{{ route('payments.index') }}" class="button">Open Payments</a>
    </div>
</td></tr>
<tr><td class="footer">
    <p>Learn With Flevian LMS</p>
    <p>This is an automated payment notification.</p>
    <p>© {{ now()->year }} Learn With Flevian. All rights reserved.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
