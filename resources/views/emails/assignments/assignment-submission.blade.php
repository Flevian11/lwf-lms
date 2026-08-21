<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>Assignment submitted</title>
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
        .eyebrow { margin:0 0 12px; font-size:12px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:#2563eb; }
        h1 { margin:0 0 18px; font-size:29px; line-height:1.2; letter-spacing:-.6px; color:#111827; }
        p { margin:0 0 18px; font-size:16px; line-height:1.7; color:#4b5563; }
        .card { margin:24px 0; padding:22px; border:1px solid #dce5f2; border-radius:14px; background:#f8fbff; }
        .label { margin:0 0 7px; font-size:11px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:#64748b; }
        .title { margin:0 0 8px; font-size:20px; font-weight:750; color:#111827; }
        .meta { margin:0; font-size:14px; line-height:1.6; color:#64748b; }
        .status { margin:22px 0; padding:17px 18px; border-radius:12px; border:1px solid #cfe2ff; background:#f3f7ff; color:#40516b; font-size:14px; line-height:1.6; }
        .status strong { color:#172033; }
        .button-wrap { padding:7px 0 14px; text-align:center; }
        .button { display:inline-block; padding:14px 27px; border-radius:10px; background:#2563eb; color:#fff!important; font-size:15px; font-weight:750; text-decoration:none; }
        .secondary { margin-top:12px; text-align:center; font-size:13px; color:#718096; }
        .secondary a { color:#2563eb; text-decoration:none; }
        .footer { padding:26px 32px 30px; text-align:center; background:#f8fafc; border-top:1px solid #edf0f5; }
        .footer p { margin:0 0 8px; font-size:13px; line-height:1.6; color:#718096; }
        @media only screen and (max-width:600px) { .wrapper { padding:20px 10px; } .content { padding:32px 24px; } .header { padding:28px 20px 22px; } h1 { font-size:26px; } .button { display:block; } }
        @media (prefers-color-scheme:dark) { body,.wrapper { background:#0b1220!important; } .container { background:#111827!important; border-color:#243044; } .header,.footer { border-color:#243044; } .brand,h1,.title { color:#f8fafc!important; } p,.meta { color:#cbd5e1!important; } .card { background:#172238!important; border-color:#263b5f; } .label { color:#94a3b8!important; } .status { background:#172238!important; border-color:#263b5f; color:#cbd5e1!important; } .status strong { color:#f8fafc!important; } .footer { background:#0f172a!important; } }
    </style>
</head>
<body>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td class="wrapper">
        <table role="presentation" class="container" cellpadding="0" cellspacing="0" border="0" align="center">
            <tr><td class="header">
                <img class="logo" src="{{ url('favicon-192x192.png') }}" alt="Learn With Flevian" width="64" height="64" style="display:block;width:64px;height:64px;margin:0 auto 14px;border-radius:15px;border:0;">
                <p class="brand">Learn With Flevian</p>
            </td></tr>
            <tr><td class="content">
                <p class="eyebrow">Assignment submitted</p>
                <h1>Your work has been uploaded.</h1>
                <p>Hello {{ $userName }},</p>
                <p>Your submission for the assignment below has been recorded successfully and is now <strong>awaiting grading by your instructor</strong>.</p>
                <div class="card">
                    <p class="label">Assignment</p>
                    <p class="title">{{ $assignment->title }}</p>
                    <p class="meta">{{ $assignment->course?->title ?? 'Learn With Flevian course' }} &nbsp;•&nbsp; Attempt {{ $submission->attempt_number }}</p>
                </div>
                <div class="status">
                    <strong>Submission received</strong><br>
                    Your work is locked for editing while it is being reviewed. Your score, feedback and transcript will appear in the LMS after grading.
                </div>
                <div class="button-wrap">
                    <a href="{{ $assignmentUrl }}" class="button">View submission</a>
                </div>
                @if ($fileUrl)
                    <p class="secondary"><a href="{{ $fileUrl }}">Download your uploaded file directly</a></p>
                @endif
            </td></tr>
            <tr><td class="footer">
                <p>Learn With Flevian LMS</p>
                <p>This is an automated assignment submission email.</p>
                <p>© {{ now()->year }} Learn With Flevian. All rights reserved.</p>
            </td></tr>
        </table>
    </td></tr>
</table>
</body>
</html>
