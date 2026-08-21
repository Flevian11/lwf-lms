<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>Course Enrollment</title>
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
        .course { margin:24px 0; padding:22px; border:1px solid #dce5f2; border-radius:14px; background:#f8fbff; }
        .course-label { margin:0 0 7px; font-size:11px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:#64748b; }
        .course-title { margin:0 0 9px; font-size:20px; font-weight:750; color:#111827; }
        .course-meta { margin:0; font-size:14px; line-height:1.6; color:#64748b; }
        .status { margin:22px 0; padding:17px 18px; border-radius:12px; border:1px solid #dbe7ff; background:#f3f7ff; color:#40516b; font-size:14px; line-height:1.6; }
        .status strong { color:#172033; }
        .button-wrap { padding:7px 0 24px; text-align:center; }
        .button { display:inline-block; padding:14px 27px; border-radius:10px; background:#2563eb; color:#fff!important; font-size:15px; font-weight:750; text-decoration:none; }
        .secondary { text-align:center; font-size:13px; color:#718096; }
        .secondary a { color:#2563eb; text-decoration:none; }
        .footer { padding:26px 32px 30px; text-align:center; background:#f8fafc; border-top:1px solid #edf0f5; }
        .footer p { margin:0 0 8px; font-size:13px; line-height:1.6; color:#718096; }
        .footer a { color:#2563eb; text-decoration:none; }
        @media only screen and (max-width:600px) {
            .wrapper { padding:20px 10px; }
            .content { padding:32px 24px; }
            .header { padding:28px 20px 22px; }
            h1 { font-size:26px; }
            .button { display:block; }
        }
        @media (prefers-color-scheme:dark) {
            body,.wrapper { background:#0b1220!important; }
            .container { background:#111827!important; border-color:#243044; }
            .header,.footer { border-color:#243044; }
            .brand,h1,.course-title { color:#f8fafc!important; }
            p,.course-meta { color:#cbd5e1!important; }
            .course { background:#172238!important; border-color:#263b5f; }
            .course-label { color:#94a3b8!important; }
            .status { background:#172238!important; border-color:#263b5f; color:#cbd5e1!important; }
            .status strong { color:#f8fafc!important; }
            .footer { background:#0f172a!important; }
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
                <p class="eyebrow">Course enrollment</p>
                <h1>{{ $hasAccess ? 'You are ready to learn.' : 'Your enrollment is confirmed.' }}</h1>
                <p>Hello {{ $user->name ?: 'there' }},</p>
                @if ($hasAccess)
                    <p>Your enrollment in the course below is active and your learning access is ready.</p>
                @else
                    <p>Your enrollment in the course below has been recorded successfully. Your learning access is currently pending approval or payment processing.</p>
                @endif
                <div class="course">
                    <p class="course-label">Course</p>
                    <p class="course-title">{{ $course->title }}</p>
                    <p class="course-meta">
                        {{ $course->category?->name ?? 'Learning course' }}
                        &nbsp;•&nbsp;
                        {{ ucfirst($course->level) }}
                    </p>
                </div>
                <div class="status">
                    <strong>{{ $hasAccess ? 'Access granted' : 'Pending access' }}</strong><br>
                    @if ($hasAccess)
                        You can open the learning environment and continue with your lessons now.
                    @else
                        Your enrollment is safely recorded. You will be able to learn once access is granted.
                    @endif
                </div>
                <div class="button-wrap">
                    <a href="{{ $hasAccess ? $learnUrl : $courseUrl }}" class="button">
                        {{ $hasAccess ? 'Start learning' : 'View course' }}
                    </a>
                </div>
                <p class="secondary">
                    Need help? <a href="mailto:info@lwf.yaliid.cloud">Contact Learn With Flevian</a>
                </p>
            </td></tr>
            <tr><td class="footer">
                <p>Learn With Flevian LMS</p>
                <p>This is an automated course enrollment email.</p>
                <p>© {{ now()->year }} Learn With Flevian. All rights reserved.</p>
            </td></tr>
        </table>
    </td></tr>
</table>
</body>
</html>
