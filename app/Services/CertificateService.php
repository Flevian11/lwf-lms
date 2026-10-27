<?php

namespace App\Services;

use App\Models\CourseEnrollment;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use chillerlan\QRCode\Common\EccLevel;

class CertificateService
{
    public function render(CourseEnrollment $enrollment): string
    {
        $enrollment->loadMissing(['course', 'user']);

        $user = $enrollment->user;
        $course = $enrollment->course;

        if (! $user || ! $course) {
            throw new \RuntimeException(
                'A certificate requires a valid student and course.'
            );
        }

        $studentName = trim((string) $user->name);
        $courseName = trim((string) $course->title);
        $completedAt = $enrollment->completed_at ?? now();

        $date = $completedAt->format('d F Y');

        $reference = 'LWF-CERT-' .
            str_pad((string) $enrollment->id, 6, '0', STR_PAD_LEFT);

        /*
         * 1. Fonts
         *
         * Use locally stored fonts so Dompdf does not depend on
         * browser fonts or a JavaScript CDN.
         */
        $fontDir = storage_path('app/fonts');

        if (! File::isDirectory($fontDir)) {
            File::makeDirectory($fontDir, 0755, true);
        }

        $fontSources = [
            'Montserrat-Regular.ttf' =>
                'https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/Montserrat%5Bwght%5D.ttf',

            'Montserrat-Bold.ttf' =>
                'https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/Montserrat%5Bwght%5D.ttf',

            'DancingScript-Regular.ttf' =>
                'https://raw.githubusercontent.com/google/fonts/main/ofl/dancingscript/DancingScript%5Bwght%5D.ttf',

            'DancingScript-Bold.ttf' =>
                'https://raw.githubusercontent.com/google/fonts/main/ofl/dancingscript/DancingScript%5Bwght%5D.ttf',
        ];

        foreach ($fontSources as $filename => $url) {
            $this->downloadFontIfMissing($filename, $url);
        }

        $fontUrl = static function (string $filename) use ($fontDir): ?string {
            $path = $fontDir . DIRECTORY_SEPARATOR . $filename;

            if (! is_file($path) || filesize($path) < 1000) {
                return null;
            }

            $realPath = realpath($path);

            if ($realPath === false) {
                return null;
            }

            return 'file:///' . str_replace('\\', '/', $realPath);
        };

        $dancingRegular = $fontUrl('DancingScript-Regular.ttf');
        $dancingBold = $fontUrl('DancingScript-Bold.ttf');

        if ($dancingRegular === null || $dancingBold === null) {
            throw new \RuntimeException(
                'Dancing Script fonts are unavailable. Check internet access ' .
                'and verify the font files in storage/app/fonts.'
            );
        }

        $fontFaces = '';

        $fontDefinitions = [
            ['Montserrat', 'Montserrat-Regular.ttf', 400],
            ['Montserrat', 'Montserrat-Bold.ttf', 700],
            ['DancingScript', 'DancingScript-Regular.ttf', 400],
            ['DancingScript', 'DancingScript-Bold.ttf', 700],
        ];

        foreach ($fontDefinitions as [$family, $filename, $weight]) {
            $src = $fontUrl($filename);

            if ($src !== null) {
                $fontFaces .= '
                    @font-face {
                        font-family: "' . $family . '";
                        src: url("' . $src . '") format("truetype");
                        font-weight: ' . $weight . ';
                        font-style: normal;
                    }
                ';
            }
        }

        /*
         * 2. Existing certificate background.
         */
        $backgroundPath = public_path(
            'images/certificate-background.png'
        );

        if (! is_file($backgroundPath)) {
            throw new \RuntimeException(
                'Certificate background missing: ' .
                'public/images/certificate-background.png'
            );
        }

        $background = 'data:image/png;base64,' .
            base64_encode(
                (string) file_get_contents($backgroundPath)
            );

        /*
         * 3. Existing brand logo.
         */
        $logoPath = public_path('favicon-192x192.png');
        $logo = '';

        if (is_file($logoPath)) {
            $mime = mime_content_type($logoPath) ?: 'image/png';

            $logo = 'data:' . $mime . ';base64,' .
                base64_encode(
                    (string) file_get_contents($logoPath)
                );
        }

        $logoMarkup = $logo !== ''
            ? '<img src="' . $logo . '" class="brand-logo" alt="Learn With Flevian">'
            : '<div class="logo-fallback">&lt;/&gt;</div>';

        /*
         * 4. Generate a QR containing actual certificate information.
         *
         * No description text is rendered beside or beneath the QR.
         * The QR itself is the only visible QR element.
         */
        $qrPayload = implode("\n", [
            'LEARN WITH FLEVIAN',
            'CERTIFICATE OF COMPLETION',
            'Student: ' . $studentName,
            'Course: ' . $courseName,
            'Completion date: ' . $date,
            'Certificate reference: ' . $reference,
        ]);

        $qrOptions = new QROptions([
            'outputType' => 'svg',
            'eccLevel' => EccLevel::M,
            'scale' => 5,
            'addQuietzone' => true,
            'quietzoneSize' => 4,
            'outputBase64' => true,
        ]);

        $qrDataUri = (new QRCode($qrOptions))->render($qrPayload);

        if (
            ! is_string($qrDataUri) ||
            ! str_starts_with(
                $qrDataUri,
                'data:image/svg+xml;base64,'
            )
        ) {
            throw new \RuntimeException(
                'QR generation failed: expected a Base64 SVG data URI.'
            );
        }

        /*
         * 5. Escape dynamic text.
         */
        $escapedStudentName = e($studentName);
        $escapedCourseName = e($courseName);
        $escapedDate = e($date);
        $escapedReference = e($reference);

        /*
         * 6. Adjust text sizes for longer names and course titles.
         */
        $nameLength = mb_strlen($studentName);

        $nameFontSize = $nameLength > 34
            ? 31
            : ($nameLength > 26 ? 36 : ($nameLength > 20 ? 40 : 44));

        $courseLength = mb_strlen($courseName);

        $courseFontSize = $courseLength > 70
            ? 15
            : ($courseLength > 48 ? 17 : ($courseLength > 30 ? 19 : 21));

        /*
         * 7. Certificate layout.
         */
        $html = '<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Certificate of Completion - ' . $escapedCourseName . '</title>

<style>
' . $fontFaces . '

@page {
    size: A4 landscape;
    margin: 0;
}

* {
    box-sizing: border-box;
}

html,
body {
    margin: 0;
    padding: 0;
    width: 297mm;
    height: 210mm;
}

body {
    font-family: Montserrat, "DejaVu Sans", sans-serif;
    color: #10234b;
    background: #ffffff;
}

.page {
    position: relative;
    width: 297mm;
    height: 210mm;
    overflow: hidden;
    background: #ffffff;
}

.background {
    position: absolute;
    left: 0;
    top: 0;
    width: 297mm;
    height: 210mm;
}

/* Brand */

.brand {
    position: absolute;
    top: 8mm;
    left: 0;
    width: 100%;
    text-align: center;
}

.brand-logo {
    display: block;
    width: 14mm;
    height: 14mm;
    margin: 0 auto 1.2mm;
}

.logo-fallback {
    font-size: 19pt;
    font-weight: bold;
    color: #0755d9;
}

.brand-name {
    font-family: Montserrat, "DejaVu Sans", sans-serif;
    font-size: 9pt;
    font-weight: 700;
    letter-spacing: 2.8pt;
    color: #10234b;
    line-height: 1.2;
}

/* Main title */

.title {
    position: absolute;
    top: 35mm;
    left: 15mm;
    width: 267mm;
    text-align: center;
    font-family: "DejaVu Serif", Georgia, serif;
    font-size: 40pt;
    line-height: 1.02;
    font-weight: bold;
    letter-spacing: 2.1pt;
    color: #0a1b49;
}

.subtitle {
    position: absolute;
    top: 63mm;
    left: 25mm;
    width: 247mm;
    text-align: center;
    color: #805000;
    font-family: Montserrat, "DejaVu Sans", sans-serif;
    font-size: 9pt;
    font-weight: 700;
    letter-spacing: 3.2pt;
}

.subtitle:before,
.subtitle:after {
    content: "";
    display: inline-block;
    width: 22mm;
    border-top: .35mm solid #dca52b;
    vertical-align: middle;
    margin: 0 4mm;
}

.certifies {
    position: absolute;
    top: 80mm;
    left: 20mm;
    width: 257mm;
    text-align: center;
    font-family: Montserrat, "DejaVu Sans", sans-serif;
    font-size: 8.5pt;
    letter-spacing: 2.6pt;
    color: #3f4d66;
}

/* Student name: artistic script */

.student-name {
    position: absolute;
    top: 84mm;
    left: 18mm;
    width: 261mm;
    text-align: center;
    font-family: DancingScript, cursive;
    font-weight: 700;
    font-size: ' . $nameFontSize . 'pt;
    line-height: 1.2;
    color: #071d59;
    white-space: nowrap;
}

.name-ornament {
    position: absolute;
    top: 111mm;
    left: 75mm;
    width: 147mm;
    height: 3mm;
    text-align: center;
    border-top: .35mm solid #d8a02a;
}

.name-ornament:after {
    content: "◆";
    position: relative;
    top: -3.1mm;
    display: inline-block;
    padding: 0 3mm;
    color: #d8a02a;
    font-size: 9pt;
    background: transparent;
}

/* Course description */

.body-copy {
    position: absolute;
    top: 119mm;
    left: 35mm;
    width: 227mm;
    text-align: center;
    color: #58647b;
    font-family: "DejaVu Serif", Georgia, serif;
    font-size: 9pt;
    line-height: 1.4;
}

.course {
    position: absolute;
    top: 131mm;
    left: 38mm;
    width: 221mm;
    text-align: center;
    font-family: "DejaVu Serif", Georgia, serif;
    font-size: ' . $courseFontSize . 'pt;
    line-height: 1.18;
    font-weight: bold;
    color: #0750b7;
    max-height: 22mm;
    overflow: hidden;
}

/* Footer */

.meta {
    position: absolute;
    top: 158mm;
    left: 53mm;
    width: 192mm;
    height: 23mm;
    display: table;
    table-layout: fixed;
}

.meta-col {
    display: table-cell;
    width: 33.333%;
    vertical-align: bottom;
    text-align: center;
    padding: 0 2mm;
}

.meta-value {
    font-family: "DejaVu Serif", Georgia, serif;
    font-size: 9.5pt;
    font-weight: bold;
    color: #10234b;
    border-bottom: .35mm solid #d9a52e;
    padding-bottom: 1.5mm;
    margin-bottom: 1.5mm;
    white-space: nowrap;
}

.meta-label {
    font-family: Montserrat, "DejaVu Sans", sans-serif;
    font-size: 6.2pt;
    letter-spacing: 1.4pt;
    color: #3f4d66;
    font-weight: bold;
    text-transform: uppercase;
    white-space: nowrap;
}

/* Artistic signature */

.signature-text {
    font-family: DancingScript, cursive;
    font-size: 23pt;
    font-weight: 700;
    color: #0b2b69;
    line-height: 1.1;
    white-space: nowrap;
}

.signature-line {
    border-bottom: .35mm solid #d9a52e;
    margin: 0 auto 1.5mm;
    width: 46mm;
}

/* Standalone QR code */

.qr-code {
    position: absolute;
    left: 17mm;
    bottom: 10mm;
    width: 22mm;
    height: 22mm;
    padding: 1mm;
    background: #ffffff;
    border: .2mm solid #e3e8f0;
}

/* Certificate reference is independent of the QR */

.certificate-reference {
    position: absolute;
    left: 95mm;
    bottom: 5mm;
    width: 105mm;
    text-align: center;
    font-family: Montserrat, "DejaVu Sans", sans-serif;
    $16.5pt;
    line-height: 1.2;
    $10.5pt;
    color: #374761;
}

/* The background already contains the gold seal artwork.
   Do not overlay another logo or text on the seal. */
</style>
</head>

<body>
<div class="page">

    <img class="background" src="' . $background . '" alt="">

    <div class="brand">
        ' . $logoMarkup . '
        <div class="brand-name">LEARN WITH FLEVIAN</div>
    </div>

    <div class="title">CERTIFICATE</div>

    <div class="subtitle">OF COURSE COMPLETION</div>

    <div class="certifies">THIS CERTIFIES THAT</div>

    <div class="student-name">' . $escapedStudentName . '</div>

    <div class="name-ornament"></div>

    <div class="body-copy">
        has successfully completed the learning requirements for the course<br>
        and demonstrated the required knowledge and skills in
    </div>

    <div class="course">' . $escapedCourseName . '</div>

    <div class="meta">

        <div class="meta-col">
            <div class="meta-value">' . $escapedDate . '</div>
            <div class="meta-label">Completion Date</div>
        </div>


        <div class="meta-col">
            <div class="meta-value">Official LMS Record</div>
            <div class="meta-label">Certificate</div>
        </div>

    </div>

    <img
        class="qr-code"
        src="' . $qrDataUri . '"
        alt="Certificate QR code"
    >

    <div class="certificate-reference">
        CERTIFICATE REFERENCE · ' . $escapedReference . '
    </div>

</div>
</body>
</html>';

        /*
         * 8. Generate PDF.
         */
        $options = new Options();

        $options->set('defaultFont', 'DejaVu Sans');
        $options->set('isRemoteEnabled', false);
        $options->set('isHtml5ParserEnabled', true);
        $options->set('dpi', 96);
        $options->set('chroot', base_path());

        $dompdf = new Dompdf($options);

        $dompdf->loadHtml($html, 'UTF-8');
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();

        return $dompdf->output();
    }

    private function downloadFontIfMissing(
        string $filename,
        string $url
    ): void {
        $path = storage_path('app/fonts/' . $filename);

        if (is_file($path) && filesize($path) > 1000) {
            $signature = file_get_contents(
                $path,
                false,
                null,
                0,
                4
            );

            if (
                in_array(
                    $signature,
                    ["\x00\x01\x00\x00", 'true', 'OTTO'],
                    true
                )
            ) {
                return;
            }

            File::delete($path);
        }

        try {
            $response = Http::timeout(25)
                ->retry(1, 300)
                ->get($url);

            if (! $response->successful()) {
                return;
            }

            $body = $response->body();
            $signature = substr($body, 0, 4);

            if (
                strlen($body) > 1000 &&
                in_array(
                    $signature,
                    ["\x00\x01\x00\x00", 'true', 'OTTO'],
                    true
                )
            ) {
                File::put($path, $body);
            }
        } catch (\Throwable $exception) {
            // Missing artistic fonts are reported before PDF rendering.
        }
    }

    public function filename(CourseEnrollment $enrollment): string
    {
        $enrollment->loadMissing('course');

        return 'Learn-With-Flevian-Certificate-' .
            Str::slug($enrollment->course->title) .
            '.pdf';
    }
}
