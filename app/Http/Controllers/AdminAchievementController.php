<?php

namespace App\Http\Controllers;

use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class AdminAchievementController extends Controller
{
    public function __construct(protected AuditLogService $auditLogService) {}

    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $status = (string) $request->string('status', 'all');

        $query = DB::table('achievement_definitions')
            ->select('achievement_definitions.*')
            ->selectSub(fn ($q) => $q->from('user_achievements')->whereColumn('achievement_id', 'achievement_definitions.id')->selectRaw('count(*)'), 'awarded_count')
            ->when($search !== '', fn ($q) => $q->where(fn ($w) => $w->where('name', 'like', "%{$search}%")->orWhere('description', 'like', "%{$search}%")))
            ->when($status === 'active', fn ($q) => $q->where('is_active', true))
            ->when($status === 'inactive', fn ($q) => $q->where('is_active', false))
            ->orderBy('sort_order')
            ->orderBy('name');

        $achievements = $query->paginate(10)->withQueryString();
        $admin = $this->adminPayload($request);

        return Inertia::render('Admin/Achievements', [
            'admin' => $admin,
            'achievements' => $achievements,
            'stats' => [
                'total' => DB::table('achievement_definitions')->count(),
                'active' => DB::table('achievement_definitions')->where('is_active', true)->count(),
                'awarded' => DB::table('user_achievements')->count(),
                'points' => (int) DB::table('achievement_definitions')->where('is_active', true)->sum('points'),
            ],
            'filters' => ['search' => $search, 'status' => $status],
            'students' => $this->studentQuery()
                ->select('users.id', 'users.name', 'users.email')
                ->where('users.status', 'active')
                ->orderBy('users.name')
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:1000'],
            'icon' => ['nullable', 'string', 'max:60'],
            'points' => ['required', 'integer', 'min:0', 'max:100000'],
            'is_active' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $id = DB::table('achievement_definitions')->insertGetId([
            'name' => $data['name'],
            'slug' => Str::slug($data['name']).'-'.Str::lower(Str::random(5)),
            'description' => $data['description'] ?? null,
            'icon' => $data['icon'] ?? 'trophy',
            'points' => $data['points'],
            'criteria_type' => 'manual',
            'criteria' => json_encode([]),
            'is_active' => (bool) ($data['is_active'] ?? true),
            'sort_order' => $data['sort_order'] ?? 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->auditLogService->resourceEvent('achievement_created', 'achievement_definition', $id, [
            'action' => 'create_achievement',
            'metadata' => ['name' => $data['name'], 'points' => $data['points']],
        ]);

        return back()->with('success', 'Achievement created.');
    }

    public function update(Request $request, int $achievement)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:1000'],
            'icon' => ['nullable', 'string', 'max:60'],
            'points' => ['required', 'integer', 'min:0', 'max:100000'],
            'is_active' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);
        DB::table('achievement_definitions')->where('id', $achievement)->update([
            'name' => $data['name'], 'description' => $data['description'] ?? null, 'icon' => $data['icon'] ?? 'trophy',
            'points' => $data['points'],
            'is_active' => (bool) ($data['is_active'] ?? true), 'sort_order' => $data['sort_order'] ?? 0, 'updated_at' => now(),
        ]);
        $this->auditLogService->resourceEvent('achievement_updated', 'achievement_definition', $achievement, ['action' => 'update_achievement', 'metadata' => ['name' => $data['name']]]);
        return back()->with('success', 'Achievement updated.');
    }

    public function destroy(Request $request, int $achievement)
    {
        if (DB::table('user_achievements')->where('achievement_id', $achievement)->exists()) {
            return back()->withErrors(['achievement' => 'This achievement has already been awarded. Deactivate it instead of deleting it.']);
        }
        DB::table('achievement_definitions')->where('id', $achievement)->delete();
        $this->auditLogService->resourceEvent('achievement_deleted', 'achievement_definition', $achievement, ['action' => 'delete_achievement']);
        return back()->with('success', 'Achievement deleted.');
    }

    public function award(Request $request, int $achievement)
    {
        $data = $request->validate(['user_id' => ['required', 'integer', 'exists:users,id'], 'note' => ['nullable', 'string', 'max:500']]);
        $definition = DB::table('achievement_definitions')->where('id', $achievement)->first();
        abort_unless($definition, 404);
        abort_unless((bool) $definition->is_active, 422, 'This achievement is inactive. Activate it before awarding.');

        $student = $this->studentQuery()
            ->whereKey($data['user_id'])
            ->where('status', 'active')
            ->first();
        abort_unless($student, 422, 'Only active student accounts can receive achievements.');

        if (DB::table('user_achievements')->where('user_id', $data['user_id'])->where('achievement_id', $achievement)->exists()) {
            return back()->withErrors(['user_id' => 'This student already has this achievement.']);
        }

        DB::transaction(function () use ($data, $achievement, $definition) {
            DB::table('user_achievements')->insert([
                'user_id' => $data['user_id'], 'achievement_id' => $achievement, 'points_awarded' => $definition->points,
                'metadata' => json_encode(['source' => 'admin', 'note' => $data['note'] ?? null]), 'earned_at' => now(), 'created_at' => now(), 'updated_at' => now(),
            ]);
            DB::table('point_transactions')->insert([
                'user_id' => $data['user_id'], 'type' => 'achievement', 'points' => $definition->points,
                'description' => 'Achievement awarded: '.$definition->name, 'achievement_id' => $achievement,
                'metadata' => json_encode(['source' => 'admin']), 'awarded_at' => now(), 'created_at' => now(), 'updated_at' => now(),
            ]);
        });

        $this->auditLogService->resourceEvent('achievement_awarded', 'achievement_definition', $achievement, [
            'action' => 'award_achievement', 'metadata' => ['user_id' => $data['user_id'], 'points' => $definition->points],
        ]);
        return back()->with('success', 'Achievement awarded.');
    }

    /**
     * Resolve real learner accounts without excluding legacy learners that
     * already participate in course enrollment records.
     */
    private function studentQuery()
    {
        return User::query()
            ->whereDoesntHave('roles', fn ($query) => $query
                ->where('name', 'Admin')
                ->where('guard_name', 'web')
            )
            ->where(function ($query) {
                $query
                    ->whereHas('roles', fn ($roleQuery) => $roleQuery
                        ->where('name', 'Student')
                        ->where('guard_name', 'web')
                    )
                    ->orWhereHas('courseEnrollments');
            });
    }

    private function adminPayload(Request $request): array
    {
        $admin = $request->user();
        return ['id' => $admin->id, 'name' => $admin->name, 'email' => $admin->email, 'avatar_path' => $admin->avatar_path, 'email_two_factor_enabled' => (bool) $admin->email_two_factor_enabled];
    }
}
