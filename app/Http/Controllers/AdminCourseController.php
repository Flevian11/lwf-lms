<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminCourseController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $status = (string) $request->query('status', 'all');
        $accessType = (string) $request->query('access_type', 'all');
        $categoryId = $request->integer('category_id') ?: null;

        $coursesQuery = Course::query()
            ->with('category:id,name,slug')
            ->withCount(['modules', 'enrollments', 'assignments', 'quizzes'])
            ->latest('updated_at');

        if ($search !== '') {
            $coursesQuery->where(function ($query) use ($search): void {
                $query
                    ->where('title', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('short_description', 'like', "%{$search}%");
            });
        }

        if (in_array($status, ['draft', 'published', 'archived'], true)) {
            $coursesQuery->where('status', $status);
        }

        if (in_array($accessType, ['free', 'paid'], true)) {
            $coursesQuery->where('access_type', $accessType);
        }

        if ($categoryId) {
            $coursesQuery->where('category_id', $categoryId);
        }

        $courses = $coursesQuery
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Course $course): array => [
                'id' => $course->id,
                'title' => $course->title,
                'slug' => $course->slug,
                'short_description' => $course->short_description,
                'description' => $course->description,
                'thumbnail_path' => $course->thumbnail_path,
                'level' => $course->level,
                'status' => $course->status,
                'access_type' => $course->access_type,
                'price' => (float) $course->price,
                'currency' => $course->currency,
                'published_at' => $course->published_at?->toISOString(),
                'updated_at' => $course->updated_at?->toISOString(),
                'category' => $course->category ? [
                    'id' => $course->category->id,
                    'name' => $course->category->name,
                    'slug' => $course->category->slug,
                ] : null,
                'modules_count' => $course->modules_count,
                'enrollments_count' => $course->enrollments_count,
                'assignments_count' => $course->assignments_count,
                'quizzes_count' => $course->quizzes_count,
            ]);

        return Inertia::render('Admin/Courses', [
            'admin' => $this->adminPayload($request),
            'courses' => $courses,
            'categories' => CourseCategory::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'slug']),
            'filters' => [
                'search' => $search,
                'status' => $status,
                'access_type' => $accessType,
                'category_id' => $categoryId,
            ],
            'stats' => [
                'total' => Course::count(),
                'published' => Course::where('status', 'published')->count(),
                'drafts' => Course::where('status', 'draft')->count(),
                'archived' => Course::where('status', 'archived')->count(),
                'free' => Course::where('access_type', 'free')->count(),
                'paid' => Course::where('access_type', 'paid')->count(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $data['created_by'] = $request->user()->id;
        $data['slug'] = $this->uniqueSlug($data['slug'] ?: $data['title']);
        $data['published_at'] = $data['status'] === 'published' ? now() : null;

        if ($request->hasFile('thumbnail')) {
            $data['thumbnail_path'] = $request->file('thumbnail')->store('courses', 'public');
        }

        unset($data['thumbnail']);

        Course::create($data);

        return back()->with('success', 'Course created successfully.');
    }

    public function update(Request $request, Course $course): RedirectResponse
    {
        $data = $this->validated($request, $course);
        $data['slug'] = $this->uniqueSlug($data['slug'] ?: $data['title'], $course->id);

        if ($data['status'] === 'published' && $course->status !== 'published') {
            $data['published_at'] = now();
        } elseif ($data['status'] !== 'published') {
            $data['published_at'] = null;
        }

        if ($request->hasFile('thumbnail')) {
            if ($course->thumbnail_path) {
                Storage::disk('public')->delete($course->thumbnail_path);
            }

            $data['thumbnail_path'] = $request->file('thumbnail')->store('courses', 'public');
        }

        unset($data['thumbnail']);

        $course->update($data);

        return back()->with('success', 'Course updated successfully.');
    }

    public function destroy(Course $course): RedirectResponse
    {
        if ($course->enrollments()->exists()) {
            return back()->withErrors([
                'course' => 'This course has enrollment records and cannot be deleted. Archive it instead to preserve its learning history.',
            ]);
        }

        if ($course->thumbnail_path) {
            Storage::disk('public')->delete($course->thumbnail_path);
        }

        $course->delete();

        return back()->with('success', 'Course deleted successfully.');
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, ?Course $course = null): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'slug' => [
                'nullable',
                'string',
                'max:220',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('courses', 'slug')->ignore($course?->id),
            ],
            'category_id' => ['required', 'integer', 'exists:course_categories,id'],
            'short_description' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'level' => ['required', Rule::in(['beginner', 'intermediate', 'advanced'])],
            'status' => ['required', Rule::in(['draft', 'published', 'archived'])],
            'access_type' => ['required', Rule::in(['free', 'paid'])],
            'price' => ['required_if:access_type,paid', 'nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'currency' => ['required', 'string', 'size:3'],
            'thumbnail' => ['nullable', 'image', 'max:4096'],
        ]);
    }

    private function uniqueSlug(string $value, ?int $ignoreId = null): string
    {
        $base = Str::slug($value) ?: 'course';
        $slug = $base;
        $counter = 2;

        while (Course::query()
            ->where('slug', $slug)
            ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->exists()) {
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
}
