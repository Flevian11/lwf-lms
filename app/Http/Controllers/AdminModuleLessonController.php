<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Lesson;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\CourseMaterial;
use Illuminate\Support\Facades\Storage;

class AdminModuleLessonController extends Controller
{
    public function index(Request $request): Response
    {
        $courseId = $request->integer('course_id');
        $search = trim((string) $request->query('search', ''));
        $page = max(1, $request->integer('page', 1));

        $courses = Course::query()
            ->orderByRaw("CASE status WHEN 'published' THEN 0 WHEN 'draft' THEN 1 ELSE 2 END")
            ->orderBy('title')
            ->get(['id', 'title', 'slug', 'status']);

        if ($courseId <= 0 || ! $courses->contains('id', $courseId)) {
            $courseId = (int) ($courses->first()?->id ?? 0);
        }

        $modulesQuery = CourseModule::query()
            ->where('course_id', $courseId)
            ->withCount(['lessons'])
            ->with([
                'lessons' => function ($query) use ($search) {
                    $query
                        ->withCount(['materials', 'assignments', 'quizzes'])
                        ->with(['materials' => fn($mq) => $mq->orderBy('position')])
                        ->orderBy('position');

                    if ($search !== '') {
                        $query->where(function ($lessonQuery) use ($search): void {
                            $lessonQuery
                                ->where('title', 'like', "%{$search}%")
                                ->orWhere('slug', 'like', "%{$search}%")
                                ->orWhere('description', 'like', "%{$search}%");
                        });
                    }
                },
            ])
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($moduleQuery) use ($search): void {
                    $moduleQuery
                        ->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhereHas('lessons', function ($lessonQuery) use ($search): void {
                            $lessonQuery
                                ->where('title', 'like', "%{$search}%")
                                ->orWhere('slug', 'like', "%{$search}%")
                                ->orWhere('description', 'like', "%{$search}%");
                        });
                });
            })
            ->orderBy('position');

        $modules = $modulesQuery
            ->paginate(8, ['*'], 'page', $page)
            ->withQueryString()
            ->through(function (CourseModule $module): array {
                return [
                    'id' => $module->id,
                    'title' => $module->title,
                    'description' => $module->description,
                    'position' => $module->position,
                    'lessons_count' => $module->lessons_count,
                    'lessons' => $module->lessons->map(fn(Lesson $lesson): array => [
                        'id' => $lesson->id,
                        'title' => $lesson->title,
                        'slug' => $lesson->slug,
                        'description' => $lesson->description,
                        'content' => $lesson->content,
                        'type' => $lesson->type,
                        'position' => $lesson->position,
                        'duration_minutes' => $lesson->duration_minutes,
                        'status' => $lesson->status,
                        'published_at' => $lesson->published_at?->toISOString(),
                        'materials_count' => $lesson->materials_count,
                        'assignments_count' => $lesson->assignments_count,
                        'quizzes_count' => $lesson->quizzes_count,
                        'materials' => $lesson->materials->map(fn(CourseMaterial $m): array => [
                            'id' => $m->id,
                            'title' => $m->title,
                            'description' => $m->description,
                            'type' => $m->type,
                            'url' => $m->url,
                            'file_path' => $m->file_path,
                            'mime_type' => $m->mime_type,
                            'is_preview' => (bool) $m->is_preview,
                            'position' => $m->position,
                            'status' => $m->status,
                            'size' => $m->metadata['size'] ?? null,
                        ])->values()->all(),
                    ])->values()->all(),
                ];
            });

        $course = $courses->firstWhere('id', $courseId);

        return Inertia::render('Admin/ModulesLessons', [
            'admin' => $this->adminPayload($request),
            'courses' => $courses->map(fn(Course $item): array => [
                'id' => $item->id,
                'title' => $item->title,
                'slug' => $item->slug,
                'status' => $item->status,
            ])->values()->all(),
            'selectedCourse' => $course ? [
                'id' => $course->id,
                'title' => $course->title,
                'slug' => $course->slug,
                'status' => $course->status,
            ] : null,
            'modules' => $modules,
            'filters' => [
                'course_id' => $courseId,
                'search' => $search,
            ],
            'stats' => [
                'modules' => CourseModule::where('course_id', $courseId)->count(),
                'lessons' => Lesson::whereHas('module', fn($query) => $query->where('course_id', $courseId))->count(),
                'published_lessons' => Lesson::whereHas('module', fn($query) => $query->where('course_id', $courseId))
                    ->where('status', 'published')->count(),
                'draft_lessons' => Lesson::whereHas('module', fn($query) => $query->where('course_id', $courseId))
                    ->where('status', 'draft')->count(),
            ],
        ]);
    }

    public function storeModule(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
        ]);

        $position = (int) CourseModule::where('course_id', $data['course_id'])->max('position') + 1;
        CourseModule::create([
            'course_id' => $data['course_id'],
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'position' => $position,
        ]);

        return back()->with('success', 'Module created successfully.');
    }

    public function updateModule(Request $request, CourseModule $module): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
        ]);

        $module->update($data);

        return back()->with('success', 'Module updated successfully.');
    }

    public function destroyModule(CourseModule $module): RedirectResponse
    {
        $module->delete();

        return back()->with('success', 'Module deleted successfully.');
    }

    public function moveModule(Request $request, CourseModule $module): RedirectResponse
    {
        $direction = $request->validate([
            'direction' => ['required', Rule::in(['up', 'down'])],
        ])['direction'];

        $target = CourseModule::query()
            ->where('course_id', $module->course_id)
            ->when($direction === 'up', fn($q) => $q->where('position', '<', $module->position)->orderByDesc('position'))
            ->when($direction === 'down', fn($q) => $q->where('position', '>', $module->position)->orderBy('position'))
            ->first();

        if ($target) {
            DB::transaction(function () use ($module, $target): void {
                $old = $module->position;
                $module->update(['position' => $target->position]);
                $target->update(['position' => $old]);
            });
        }

        return back();
    }

    public function storeLesson(Request $request): RedirectResponse
    {
        $data = $this->validatedLesson($request);
        $module = CourseModule::findOrFail($data['module_id']);
        $data['position'] = (int) Lesson::where('module_id', $module->id)->max('position') + 1;
        $data['slug'] = $this->uniqueLessonSlug($module->id, $data['slug'] ?: $data['title']);
        $data['published_at'] = $data['status'] === 'published' ? now() : null;

        Lesson::create($data);

        return back()->with('success', 'Lesson created successfully.');
    }

    public function updateLesson(Request $request, Lesson $lesson): RedirectResponse
    {
        $data = $this->validatedLesson($request, $lesson);
        $data['slug'] = $this->uniqueLessonSlug($lesson->module_id, $data['slug'] ?: $data['title'], $lesson->id);

        if ($data['status'] === 'published' && $lesson->status !== 'published') {
            $data['published_at'] = now();
        } elseif ($data['status'] !== 'published') {
            $data['published_at'] = null;
        }

        unset($data['module_id']);
        $lesson->update($data);

        return back()->with('success', 'Lesson updated successfully.');
    }

    public function destroyLesson(Lesson $lesson): RedirectResponse
    {
        $lesson->delete();

        return back()->with('success', 'Lesson deleted successfully.');
    }

    public function moveLesson(Request $request, Lesson $lesson): RedirectResponse
    {
        $direction = $request->validate([
            'direction' => ['required', Rule::in(['up', 'down'])],
        ])['direction'];

        $target = Lesson::query()
            ->where('module_id', $lesson->module_id)
            ->when($direction === 'up', fn($q) => $q->where('position', '<', $lesson->position)->orderByDesc('position'))
            ->when($direction === 'down', fn($q) => $q->where('position', '>', $lesson->position)->orderBy('position'))
            ->first();

        if ($target) {
            DB::transaction(function () use ($lesson, $target): void {
                $old = $lesson->position;
                $lesson->update(['position' => $target->position]);
                $target->update(['position' => $old]);
            });
        }

        return back();
    }

    private function validatedLesson(Request $request, ?Lesson $lesson = null): array
    {
        return $request->validate([
            'module_id' => [
                'required',
                'integer',
                'exists:course_modules,id',
            ],
            'title' => ['required', 'string', 'max:200'],
            'slug' => [
                'nullable',
                'string',
                'max:220',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
            ],
            'description' => ['nullable', 'string', 'max:500'],
            'content' => ['nullable', 'string'],
            'type' => ['required', Rule::in(['article', 'video', 'document', 'interactive'])],
            'duration_minutes' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'status' => ['required', Rule::in(['draft', 'published'])],
        ]);
    }

    private function uniqueLessonSlug(int $moduleId, string $value, ?int $ignoreId = null): string
    {
        $base = Str::slug($value) ?: 'lesson';
        $slug = $base;
        $counter = 2;

        while (Lesson::query()
            ->where('module_id', $moduleId)
            ->where('slug', $slug)
            ->when($ignoreId, fn($query) => $query->where('id', '!=', $ignoreId))
            ->exists()
        ) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }

        return $slug;
    }

    /** @return array<string, mixed> */
    private function adminPayload(Request $request): array
    {
        $admin = $request->user();

        return [
            'id' => $admin->id,
            'name' => $admin->name,
            'email' => $admin->email,
            'avatar_path' => $admin->avatar_path,
            'email_two_factor_enabled' => (bool) $admin->email_two_factor_enabled,
        ];
    }

    public function storeMaterial(Request $request, Lesson $lesson): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'file' => ['nullable', 'file', 'max:204800'],
            'url' => ['nullable', 'url', 'max:2000'],
            'is_preview' => ['nullable', 'boolean'],
        ]);

        $hasFile = $request->hasFile('file');
        $hasUrl = ! empty($data['url']);

        if (! $hasFile && ! $hasUrl) {
            return back()->withErrors([
                'file' => 'Provide a file to upload or a URL.',
            ]);
        }

        $type = 'other';
        $filePath = null;
        $mimeType = null;
        $size = null;

        if ($hasFile) {
            $file = $request->file('file');
            $mimeType = $file->getClientMimeType() ?: $file->getMimeType();
            $size = $file->getSize();
            $type = $this->materialTypeFromMime(
                $mimeType ?? '',
                strtolower($file->getClientOriginalExtension()),
            );

            $filePath = $file->store(
                'course-materials/lesson-' . $lesson->id,
                'public',
            );
        } else {
            $type = 'link';
        }

        $position = (int) CourseMaterial::where('lesson_id', $lesson->id)->max('position') + 1;

        CourseMaterial::create([
            'course_id' => $lesson->module->course_id,
            'module_id' => $lesson->module_id,
            'lesson_id' => $lesson->id,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'type' => $type,
            'url' => $data['url'] ?? null,
            'file_path' => $filePath,
            'mime_type' => $mimeType,
            'is_preview' => (bool) ($data['is_preview'] ?? false),
            'position' => $position,
            'status' => 'published',
            'metadata' => $size !== null ? ['size' => $size] : null,
        ]);

        return back()->with('success', 'Material uploaded successfully.');
    }

    public function destroyMaterial(Request $request, CourseMaterial $material): RedirectResponse
    {
        if ($material->file_path) {
            Storage::disk('public')->delete($material->file_path);
        }

        $material->delete();

        return back()->with('success', 'Material removed.');
    }

    private function materialTypeFromMime(string $mime, string $extension): string
    {
        if (str_starts_with($mime, 'video/')) return 'video';
        if (str_starts_with($mime, 'audio/')) return 'audio';
        if ($mime === 'application/pdf') return 'pdf';

        if (
            str_contains($mime, 'presentation')
            || in_array($extension, ['ppt', 'pptx', 'key', 'odp'], true)
        ) {
            return 'presentation';
        }

        if (in_array($mime, [
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'text/csv',
            'application/rtf',
        ], true)) {
            return 'document';
        }

        return 'other';
    }
}
