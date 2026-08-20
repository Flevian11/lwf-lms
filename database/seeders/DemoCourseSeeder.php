<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class DemoCourseSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function (): void {
            $now = now();

            /*
             * ---------------------------------------------------------
             * Locate the current test student.
             * ---------------------------------------------------------
             */
            $student = DB::table('users')
                ->where('email', 'wanjohiramp@gmail.com')
                ->first();

            if (! $student) {
                $student = DB::table('users')
                    ->whereRaw('LOWER(name) = ?', ['ramp wanjohi'])
                    ->first();
            }

            if (! $student) {
                throw new \RuntimeException(
                    'Ramp Wanjohi could not be found. Seeder stopped without creating demo enrollments.'
                );
            }

            /*
             * ---------------------------------------------------------
             * Use an existing user as the course creator.
             * ---------------------------------------------------------
             */
            $creator = DB::table('users')
                ->where('id', '!=', $student->id)
                ->first();

            $creatorId = $creator?->id ?? $student->id;

            /*
             * ---------------------------------------------------------
             * Demo course slugs.
             * ---------------------------------------------------------
             */
            $slugs = [
                'web-development-fundamentals',
                'modern-javascript-for-beginners',
                'laravel-php-professional-development',
            ];

            /*
             * ---------------------------------------------------------
             * Clean only our demo dataset.
             * ---------------------------------------------------------
             */
            $existingCourses = DB::table('courses')
                ->whereIn('slug', $slugs)
                ->pluck('id');

            if ($existingCourses->isNotEmpty()) {
                DB::table('course_materials')
                    ->whereIn('course_id', $existingCourses)
                    ->delete();

                $lessonIds = DB::table('lessons')
                    ->whereIn(
                        'module_id',
                        DB::table('course_modules')
                            ->whereIn('course_id', $existingCourses)
                            ->pluck('id')
                    )
                    ->pluck('id');

                if ($lessonIds->isNotEmpty()) {
                    DB::table('lesson_progress')
                        ->where('user_id', $student->id)
                        ->whereIn('lesson_id', $lessonIds)
                        ->delete();
                }

                DB::table('lessons')
                    ->whereIn(
                        'module_id',
                        DB::table('course_modules')
                            ->whereIn('course_id', $existingCourses)
                            ->pluck('id')
                    )
                    ->delete();

                DB::table('course_modules')
                    ->whereIn('course_id', $existingCourses)
                    ->delete();

                DB::table('course_learning_interest')
                    ->whereIn('course_id', $existingCourses)
                    ->delete();

                DB::table('course_enrollments')
                    ->whereIn('course_id', $existingCourses)
                    ->delete();

                DB::table('courses')
                    ->whereIn('id', $existingCourses)
                    ->delete();
            }

            /*
             * ---------------------------------------------------------
             * Categories.
             * ---------------------------------------------------------
             */
            $categories = [
                [
                    'name' => 'Web Development',
                    'slug' => 'web-development',
                    'description' => 'Web development and frontend fundamentals.',
                ],
                [
                    'name' => 'Programming',
                    'slug' => 'programming',
                    'description' => 'Programming languages and software development.',
                ],
                [
                    'name' => 'Backend Development',
                    'slug' => 'backend-development',
                    'description' => 'Backend engineering, PHP and Laravel.',
                ],
            ];

            $categoryIds = [];

            foreach ($categories as $category) {
                DB::table('course_categories')->updateOrInsert(
                    ['slug' => $category['slug']],
                    [
                        'name' => $category['name'],
                        'description' => $category['description'],
                        'is_active' => true,
                        'updated_at' => $now,
                        'created_at' => $now,
                    ],
                );

                $categoryIds[$category['slug']] = DB::table('course_categories')
                    ->where('slug', $category['slug'])
                    ->value('id');
            }

            /*
             * ---------------------------------------------------------
             * Courses.
             * ---------------------------------------------------------
             */
            $courses = [
                [
                    'category' => 'web-development',
                    'title' => 'Web Development Fundamentals',
                    'slug' => 'web-development-fundamentals',
                    'short_description' => 'Learn the foundations of the modern web, from HTML and CSS to responsive page structure.',
                    'description' => 'A practical beginner course covering the core concepts required to start building modern websites.',
                    'level' => 'beginner',
                    'access_type' => 'free',
                    'price' => 0,
                    'currency' => 'KES',
                ],
                [
                    'category' => 'programming',
                    'title' => 'Modern JavaScript for Beginners',
                    'slug' => 'modern-javascript-for-beginners',
                    'short_description' => 'Build a strong JavaScript foundation and learn how modern browser applications work.',
                    'description' => 'A practical JavaScript course covering variables, functions, objects, arrays, DOM interaction and modern syntax.',
                    'level' => 'beginner',
                    'access_type' => 'paid',
                    'price' => 2500,
                    'currency' => 'KES',
                ],
                [
                    'category' => 'backend-development',
                    'title' => 'Laravel & PHP Professional Development',
                    'slug' => 'laravel-php-professional-development',
                    'short_description' => 'Build production-ready backend applications with PHP and Laravel.',
                    'description' => 'A structured introduction to professional Laravel development, including routing, controllers, Eloquent, authentication and application architecture.',
                    'level' => 'intermediate',
                    'access_type' => 'paid',
                    'price' => 4500,
                    'currency' => 'KES',
                ],
            ];

            foreach ($courses as $courseData) {
                $courseId = DB::table('courses')->insertGetId([
                    'category_id' => $categoryIds[$courseData['category']],
                    'created_by' => $creatorId,
                    'title' => $courseData['title'],
                    'slug' => $courseData['slug'],
                    'short_description' => $courseData['short_description'],
                    'description' => $courseData['description'],
                    'thumbnail_path' => null,
                    'level' => $courseData['level'],
                    'status' => 'published',
                    'access_type' => $courseData['access_type'],
                    'price' => $courseData['price'],
                    'currency' => $courseData['currency'],
                    'published_at' => $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                $this->seedCourseContent(
                    $courseId,
                    $courseData['slug'],
                    $now,
                );

                /*
                 * Associate the course with the appropriate learning
                 * interest when one exists.
                 */
                $interestName = match ($courseData['category']) {
                    'web-development' => 'Web Development',
                    'programming' => 'Programming',
                    'backend-development' => 'Software Engineering',
                    default => null,
                };

                if ($interestName) {
                    $interestId = DB::table('learning_interests')
                        ->where('name', $interestName)
                        ->value('id');

                    if ($interestId) {
                        DB::table('course_learning_interest')->insertOrIgnore([
                            'course_id' => $courseId,
                            'learning_interest_id' => $interestId,
                        ]);
                    }
                }

                /*
                 * Enroll Ramp in the FREE course only.
                 *
                 * access_granted_at is populated because free content
                 * does not require payment or admin approval.
                 */
                if ($courseData['slug'] === 'web-development-fundamentals') {
                    DB::table('course_enrollments')->insert([
                        'user_id' => $student->id,
                        'course_id' => $courseId,
                        'source' => 'free',
                        'payment_id' => null,
                        'approved_by' => null,
                        'approved_at' => null,
                        'access_granted_at' => $now,
                        'status' => 'active',
                        'enrolled_at' => $now,
                        'started_at' => null,
                        'completed_at' => null,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
            }
        });

        $this->command?->info(
            'Demo course catalogue created successfully.'
        );

        $this->command?->info(
            'Ramp Wanjohi was enrolled in Web Development Fundamentals.'
        );
    }

    private function seedCourseContent(
        int $courseId,
        string $courseSlug,
        $now,
    ): void {
        $courseContent = [
            'web-development-fundamentals' => [
                [
                    'title' => 'Understanding the Web',
                    'description' => 'Understand browsers, servers, URLs, HTTP and how a web page reaches the user.',
                    'lessons' => [
                        [
                            'title' => 'How the Web Works',
                            'type' => 'article',
                            'duration' => 12,
                            'content' => <<<'HTML'
<h2>How the Web Works</h2>
<p>A web application connects a browser to one or more servers over HTTP or HTTPS.</p>
<p>When a user opens a URL, the browser requests resources from a server. The server responds with HTML, CSS, JavaScript and other resources required to render the page.</p>
HTML,
                            'preview' => true,
                        ],
                        [
                            'title' => 'HTML, CSS and JavaScript Explained',
                            'type' => 'video',
                            'duration' => 18,
                            'content' => 'https://www.youtube.com/watch?v=UB1O30fR-EE',
                            'preview' => true,
                        ],
                    ],
                    'materials' => [
                        [
                            'title' => 'Web Development Starter Guide',
                            'type' => 'pdf',
                            'description' => 'A quick reference guide covering the basic web development stack.',
                            'preview' => true,
                        ],
                        [
                            'title' => 'MDN Web Development',
                            'type' => 'link',
                            'url' => 'https://developer.mozilla.org/en-US/docs/Learn',
                            'description' => 'Mozilla Developer Network learning resources.',
                            'preview' => true,
                        ],
                    ],
                ],
                [
                    'title' => 'HTML & CSS Foundations',
                    'description' => 'Build structured pages and style them for different screen sizes.',
                    'lessons' => [
                        [
                            'title' => 'HTML Document Structure',
                            'type' => 'article',
                            'duration' => 15,
                            'content' => '<h2>HTML Document Structure</h2><p>Learn how HTML documents are structured using semantic elements.</p>',
                            'preview' => false,
                        ],
                        [
                            'title' => 'Responsive CSS Basics',
                            'type' => 'video',
                            'duration' => 22,
                            'content' => 'https://www.youtube.com/watch?v=yfoY53QXEnI',
                            'preview' => false,
                        ],
                    ],
                    'materials' => [
                        [
                            'title' => 'HTML & CSS Quick Reference',
                            'type' => 'pdf',
                            'description' => 'HTML elements, CSS selectors and responsive design reference.',
                            'preview' => false,
                        ],
                    ],
                ],
            ],

            'modern-javascript-for-beginners' => [
                [
                    'title' => 'JavaScript Foundations',
                    'description' => 'Understand the language fundamentals before building browser applications.',
                    'lessons' => [
                        [
                            'title' => 'Variables, Values and Types',
                            'type' => 'article',
                            'duration' => 20,
                            'content' => '<h2>Variables, Values and Types</h2><p>Learn let, const, strings, numbers, booleans, arrays and objects.</p>',
                            'preview' => true,
                        ],
                        [
                            'title' => 'JavaScript Fundamentals Video',
                            'type' => 'video',
                            'duration' => 30,
                            'content' => 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
                            'preview' => true,
                        ],
                    ],
                    'materials' => [
                        [
                            'title' => 'JavaScript Foundations Workbook',
                            'type' => 'pdf',
                            'description' => 'Exercises and reference material for JavaScript fundamentals.',
                            'preview' => true,
                        ],
                    ],
                ],
                [
                    'title' => 'DOM & Browser Applications',
                    'description' => 'Move from language fundamentals into real browser interaction.',
                    'lessons' => [
                        [
                            'title' => 'Working with the DOM',
                            'type' => 'article',
                            'duration' => 24,
                            'content' => '<h2>Working with the DOM</h2><p>Learn how JavaScript reads and changes a web page.</p>',
                            'preview' => false,
                        ],
                        [
                            'title' => 'Events and User Interaction',
                            'type' => 'video',
                            'duration' => 28,
                            'content' => 'https://www.youtube.com/watch?v=XF1_MlZ5l6M',
                            'preview' => false,
                        ],
                    ],
                    'materials' => [
                        [
                            'title' => 'DOM Programming Reference',
                            'type' => 'pdf',
                            'description' => 'Practical DOM and browser API reference.',
                            'preview' => false,
                        ],
                    ],
                ],
            ],

            'laravel-php-professional-development' => [
                [
                    'title' => 'PHP Foundations',
                    'description' => 'Build the PHP foundation required for modern Laravel applications.',
                    'lessons' => [
                        [
                            'title' => 'PHP Application Structure',
                            'type' => 'article',
                            'duration' => 20,
                            'content' => '<h2>PHP Application Structure</h2><p>Understand PHP files, namespaces, functions, classes and application flow.</p>',
                            'preview' => true,
                        ],
                        [
                            'title' => 'PHP for Laravel Developers',
                            'type' => 'video',
                            'duration' => 32,
                            'content' => 'https://www.youtube.com/watch?v=OK_JCtrrv-c',
                            'preview' => true,
                        ],
                    ],
                    'materials' => [
                        [
                            'title' => 'PHP Foundations Reference',
                            'type' => 'pdf',
                            'description' => 'PHP concepts required before moving into Laravel.',
                            'preview' => true,
                        ],
                    ],
                ],
                [
                    'title' => 'Laravel Architecture',
                    'description' => 'Learn how Laravel applications are structured and how the major framework components interact.',
                    'lessons' => [
                        [
                            'title' => 'Routes and Controllers',
                            'type' => 'article',
                            'duration' => 25,
                            'content' => '<h2>Routes and Controllers</h2><p>Learn how requests move through Laravel routes and controllers.</p>',
                            'preview' => false,
                        ],
                        [
                            'title' => 'Eloquent and Database Development',
                            'type' => 'video',
                            'duration' => 35,
                            'content' => 'https://www.youtube.com/watch?v=ImtZ5yENzgE',
                            'preview' => false,
                        ],
                    ],
                    'materials' => [
                        [
                            'title' => 'Laravel Architecture Guide',
                            'type' => 'pdf',
                            'description' => 'A practical Laravel architecture reference.',
                            'preview' => false,
                        ],
                        [
                            'title' => 'Laravel Documentation',
                            'type' => 'link',
                            'url' => 'https://laravel.com/docs',
                            'description' => 'Official Laravel documentation.',
                            'preview' => false,
                        ],
                    ],
                ],
            ],
        ];

        $modules = $courseContent[$courseSlug] ?? [];

        foreach ($modules as $modulePosition => $moduleData) {
            $moduleId = DB::table('course_modules')->insertGetId([
                'course_id' => $courseId,
                'title' => $moduleData['title'],
                'description' => $moduleData['description'],
                'position' => $modulePosition + 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $lessonIds = [];

            foreach ($moduleData['lessons'] as $lessonPosition => $lesson) {
                $lessonId = DB::table('lessons')->insertGetId([
                    'module_id' => $moduleId,
                    'title' => $lesson['title'],
                    'slug' => Str::slug($lesson['title']),
                    'description' => null,
                    'content' => $lesson['content'],
                    'type' => $lesson['type'],
                    'position' => $lessonPosition + 1,
                    'duration_minutes' => $lesson['duration'],
                    'status' => 'published',
                    'published_at' => $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                $lessonIds[] = $lessonId;
            }

            foreach ($moduleData['materials'] as $materialPosition => $material) {
                $filePath = null;
                $mimeType = null;

                if ($material['type'] === 'pdf') {
                    $fileName = Str::slug($material['title']) . '.pdf';

                    $directory = storage_path(
                        'app/public/course-materials'
                    );

                    File::ensureDirectoryExists($directory);

                    $filePath = "course-materials/{$fileName}";

                    File::put(
                        storage_path("app/public/{$filePath}"),
                        $this->makePdf(
                            $material['title'],
                            $material['description'],
                        ),
                    );

                    $mimeType = 'application/pdf';
                }

                DB::table('course_materials')->insert([
                    'course_id' => $courseId,
                    'module_id' => $moduleId,
                    'lesson_id' => $lessonIds[0] ?? null,
                    'title' => $material['title'],
                    'description' => $material['description'],
                    'type' => $material['type'],
                    'url' => $material['url'] ?? null,
                    'file_path' => $filePath,
                    'mime_type' => $mimeType,
                    'is_preview' => $material['preview'],
                    'position' => $materialPosition + 1,
                    'status' => 'published',
                    'metadata' => $material['type'] === 'video'
                        ? json_encode([
                            'provider' => 'youtube',
                        ])
                        : null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }

    /**
     * Generate a small valid PDF without requiring an external
     * PDF package just for demo/test resources.
     */
    private function makePdf(
        string $title,
        string $description,
    ): string {
        $lines = [
            $title,
            '',
            $description,
            '',
            'Learn With Flevian LMS',
            'Demo learning material',
            '',
            'This PDF is a generated test resource.',
        ];

        $escape = static function (string $value): string {
            return str_replace(
                ['\\', '(', ')'],
                ['\\\\', '\\(', '\\)'],
                $value,
            );
        };

        $stream = "BT\n/F1 16 Tf\n72 720 Td\n";

        foreach ($lines as $index => $line) {
            if ($index > 0) {
                $stream .= "0 -24 Td\n";
            }

            $stream .= '(' . $escape($line) . ") Tj\n";
        }

        $stream .= "ET\n";

        $objects = [];

        $objects[] = '<< /Type /Catalog /Pages 2 0 R >>';

        $objects[] = '<< /Type /Pages /Kids [3 0 R] /Count 1 >>';

        $objects[] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] '
            . '/Resources << /Font << /F1 5 0 R >> >> '
            . '/Contents 4 0 R >>';

        $objects[] = '<< /Length ' . strlen($stream) . " >>\nstream\n"
            . $stream
            . "endstream";

        $objects[] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';

        $pdf = "%PDF-1.4\n";
        $offsets = [0];

        foreach ($objects as $number => $object) {
            $objectNumber = $number + 1;

            $offsets[$objectNumber] = strlen($pdf);

            $pdf .= "{$objectNumber} 0 obj\n";
            $pdf .= $object;
            $pdf .= "\nendobj\n";
        }

        $xrefOffset = strlen($pdf);

        $pdf .= "xref\n";
        $pdf .= "0 " . (count($objects) + 1) . "\n";
        $pdf .= "0000000000 65535 f \n";

        for ($i = 1; $i <= count($objects); $i++) {
            $pdf .= sprintf(
                "%010d 00000 n \n",
                $offsets[$i],
            );
        }

        $pdf .= "trailer\n";
        $pdf .= "<< /Size " . (count($objects) + 1)
            . " /Root 1 0 R >>\n";
        $pdf .= "startxref\n";
        $pdf .= $xrefOffset . "\n";
        $pdf .= "%%EOF";

        return $pdf;
    }
}