<?php

namespace App\Services;
use App\Models\CourseEnrollment;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Support\Str;

class CertificateService
{
    public function render(CourseEnrollment $enrollment): string
    {
        $enrollment->loadMissing(['course', 'user']);

        $user = $enrollment->user;
        $course = $enrollment->course;
        $name = e($user->name);
        $courseTitle = e($course->title);
        $date = $enrollment->completed_at?->format('d F Y') ?? now()->format('d F Y');
        $reference = 'LWF-CERT-' . str_pad((string) $enrollment->id, 6, '0', STR_PAD_LEFT);

        $logo = '';
        $logoPath = public_path('favicon-192x192.png');
        if (is_file($logoPath)) {
            $mime = mime_content_type($logoPath) ?: 'image/png';
            $logo = 'data:' . $mime . ';base64,' . base64_encode((string) file_get_contents($logoPath));
        }

        $logoMarkup = $logo !== ''
            ? '<img src="' . $logo . '" class="logo" alt="Learn With Flevian">'
            : '<div class="logo-fallback">LWF</div>';

        $html = '<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Certificate of Completion · ' . $courseTitle . '</title>
<style>
@page { size:A4 landscape; margin:0; }
* { box-sizing:border-box; }
html,body { margin:0; padding:0; }
body { font-family:DejaVu Sans, sans-serif; color:#0b1730; background:#fff; }
.page { position:relative; width:297mm; height:210mm; overflow:hidden; background:#fff; }
.border { position:absolute; inset:10mm; border:1.2px solid #d8b35a; }
.inner { position:absolute; inset:14mm; border:1px solid #dfe7f1; }
.gold-left { position:absolute; left:-15mm; top:-25mm; width:92mm; height:265mm; border-right:5px solid rgba(216,179,90,.18); transform:rotate(10deg); border-radius:50%; }
.gold-left-2 { position:absolute; left:-27mm; top:-20mm; width:120mm; height:250mm; border-right:2px solid rgba(21,84,192,.13); transform:rotate(12deg); border-radius:50%; }
.gold-right { position:absolute; right:-28mm; bottom:-65mm; width:115mm; height:145mm; border-left:4px solid rgba(216,179,90,.14); transform:rotate(-13deg); border-radius:50%; }
.content { position:absolute; inset:26mm 30mm 22mm 30mm; text-align:center; }
.kicker { color:#1554c0; font-size:10px; letter-spacing:3.2px; font-weight:700; text-transform:uppercase; }
.title { margin-top:7mm; font-family:DejaVu Serif, serif; font-size:32px; letter-spacing:7px; color:#0d1740; }
.rule { width:86mm; height:1px; background:#bfc9d7; margin:5mm auto 8mm; }
.subtitle { font-size:9px; letter-spacing:3px; color:#68758a; text-transform:uppercase; }
.name { margin-top:9mm; font-family:DejaVu Serif, serif; font-size:31px; font-style:italic; color:#10224b; }
.name-rule { width:105mm; height:1px; background:#cdd5df; margin:4mm auto 7mm; }
.body { margin:0 auto; max-width:190mm; font-size:10px; line-height:1.7; color:#68758a; }
.course { margin:5mm auto 0; font-size:19px; font-weight:700; color:#1554c0; max-width:210mm; }
.meta { position:absolute; left:30mm; right:30mm; bottom:24mm; display:table; width:calc(100% - 60mm); }
.meta-col { display:table-cell; width:33.333%; vertical-align:bottom; text-align:center; }
.meta-label { font-size:8px; letter-spacing:2px; color:#7b8798; text-transform:uppercase; font-weight:700; }
.meta-value { margin-top:2mm; font-size:10px; color:#162442; font-weight:700; }
.signature { height:12mm; border-bottom:1px solid #aeb8c8; width:44mm; margin:0 auto 2mm; }
.logo-wrap { position:absolute; top:18mm; right:20mm; }
.logo { width:14mm; height:14mm; border-radius:4mm; }
.logo-fallback { width:14mm; height:14mm; border-radius:4mm; background:#1554c0; color:#fff; font-size:8px; font-weight:700; padding-top:4mm; }
.seal { position:absolute; right:24mm; bottom:22mm; width:28mm; height:28mm; border-radius:50%; background:#d9ad39; border:2px solid #b98b1d; box-shadow:0 2px 5px rgba(10,20,40,.18); color:#fff; text-align:center; padding-top:8.5mm; font-size:6px; font-weight:700; letter-spacing:1px; }
.seal:before { content:""; position:absolute; inset:2mm; border:1px dashed rgba(255,255,255,.75); border-radius:50%; }
.reference { position:absolute; left:20mm; bottom:13mm; font-size:6.5px; color:#9aa5b5; letter-spacing:1.3px; }
</style></head><body>
<div class="page"><div class="border"></div><div class="inner"></div><div class="gold-left"></div><div class="gold-left-2"></div><div class="gold-right"></div>
<div class="logo-wrap">' . $logoMarkup . '</div>
<div class="content">
<div class="kicker">Learn With Flevian</div>
<div class="title">CERTIFICATE</div>
<div class="rule"></div>
<div class="subtitle">of course completion</div>
<div class="name">' . $name . '</div>
<div class="name-rule"></div>
<p class="body">This certificate is proudly presented in recognition of successfully completing the learning requirements for</p>
<div class="course">' . $courseTitle . '</div>
</div>
<div class="meta">
<div class="meta-col"><div class="meta-label">Completion date</div><div class="meta-value">' . e($date) . '</div></div>
<div class="meta-col"><div class="signature"></div><div class="meta-label">Authorized signature</div></div>
<div class="meta-col"><div class="meta-label">Certificate</div><div class="meta-value">Official LMS record</div></div>
</div>
<div class="seal">LEARN<br>WITH<br>FLEVIAN</div>
<div class="reference">CERTIFICATE REFERENCE · ' . e($reference) . '</div>
</div></body></html>';

        $options = new Options();
        $options->set('defaultFont', 'DejaVu Sans');
        $options->set('isRemoteEnabled', false);
        $options->set('isHtml5ParserEnabled', true);
        $options->set('dpi', 110);

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();

        return $dompdf->output();
    }

    public function filename(CourseEnrollment $enrollment): string
    {
        $enrollment->loadMissing('course');
        return 'Learn-With-Flevian-Certificate-' . Str::slug($enrollment->course->title) . '.pdf';
    }
}
