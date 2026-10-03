import { Head, router, usePage } from '@inertiajs/react'
import { FormEvent, useState } from 'react'
import AdminLayout from '../../Components/AdminLayout'
import { Icon, assetUrl, initials, formatDateTime, EmptyState } from '../../Components/StudentUI'
import {
    PageHero,
    PremiumStat,
    Pill,
    Modal,
    inputClass,
    AdminSectionHeader,
    Doughnut3D,
} from '../../Components/AdminPremiumUI'

/* ------------------------------------------------------------------ types */

interface AdminUser {
    id: number
    name: string
    email: string
    avatar_path: string | null
    email_two_factor_enabled: boolean
}

interface ProgressStats {
    completed_lessons: number
    total_lessons: number
    percent: number
}

interface Person {
    id: number
    name: string
    email: string
    avatar_path: string | null
}

interface CourseLite {
    id: number
    title: string
    slug: string
}

interface EnrollmentSummary {
    id: number
    status: string
    enrolled_at: string | null
    completed_at: string | null
    user: Person
    course: CourseLite
    progress: ProgressStats
}

interface LessonItem {
    id: number
    title: string
    type: string
    duration_minutes: number | null
    position: number
    completed: boolean
}

interface ModuleItem {
    id: number
    title: string
    description: string | null
    position: number
    lessons: LessonItem[]
    total_lessons: number
    completed_lessons: number
}

interface EnrollmentDetail extends Omit<EnrollmentSummary, 'progress'> {
    modules: ModuleItem[]
    progress: ProgressStats
}

interface PaginationLink {
    url: string | null
    label: string
    active: boolean
}

interface Paginated<T> {
    data: T[]
    links: PaginationLink[]
    current_page: number
    last_page: number
    from: number | null
    to: number | null
    total: number
}

interface Filters {
    search: string
    status: string
    course_id: number
}

interface Stats {
    total: number
    active: number
    completed: number
    paused: number
}

interface Props {
    admin: AdminUser
    enrollments: Paginated<EnrollmentSummary>
    selected: EnrollmentDetail | null
    courses: Array<{ id: number; title: string }>
    filters: Filters
    stats: Stats
}

/* --------------------------------------------------------------- helpers */

const STATUS_TONE: Record<string, 'blue' | 'green' | 'amber' | 'red' | 'slate'> = {
    active: 'blue',
    completed: 'green',
    paused: 'amber',
    cancelled: 'red',
}

function statusTone(status: string) {
    return STATUS_TONE[status] ?? 'slate'
}

function statusLabel(status: string) {
    return status.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

/* ------------------------------------------------------------------ page */

export default function AdminProgress() {
    const { admin, enrollments, selected, courses, filters, stats } =
        usePage<Props>().props

    const [searchDraft, setSearchDraft] = useState(filters.search)
    const [resetOpen, setResetOpen] = useState(false)

    const navigate = (
        overrides: Partial<Filters & { enrollment?: number | null; page?: number }> = {},
    ) => {
        const params: Record<string, string | number> = {
            search: filters.search,
            status: filters.status,
            course_id: filters.course_id,
        }

        if (selected) params.enrollment = selected.id
        if (enrollments.current_page > 1) params.enrollments_page = enrollments.current_page

        Object.entries(overrides).forEach(([k, v]) => {
            if (v === null || v === undefined || v === '' || v === 0 && k === 'course_id') {
                delete params[k]
            } else {
                params[k] = v as string | number
            }
        })

        router.get('/admin/progress', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ['enrollments', 'selected', 'filters'],
        })
    }

    const applySearch = (e: FormEvent) => {
        e.preventDefault()
        navigate({ search: searchDraft.trim(), page: 1 })
    }

    const selectEnrollment = (id: number | null) => {
        navigate({ enrollment: id })
    }

    const toggleLesson = (lessonId: number, completed: boolean) => {
        if (!selected) return
        router.post(
            `/admin/progress/${selected.id}/lessons/${lessonId}/toggle`,
            { completed },
            {
                preserveScroll: true,
                preserveState: true,
                only: ['enrollments', 'selected'],
            },
        )
    }

    const toggleModule = (moduleId: number, completed: boolean) => {
        if (!selected) return
        router.post(
            `/admin/progress/${selected.id}/modules/${moduleId}/toggle`,
            { completed },
            {
                preserveScroll: true,
                preserveState: true,
                only: ['enrollments', 'selected'],
            },
        )
    }

    const confirmReset = () => {
        if (!selected) return
        router.post(
            `/admin/progress/${selected.id}/reset`,
            {},
            {
                preserveScroll: true,
                preserveState: true,
                only: ['enrollments', 'selected'],
                onFinish: () => setResetOpen(false),
            },
        )
    }

    return (
        <>
            <Head title="Progress Tracking" />
            <AdminLayout admin={admin} title="Progress Tracking">
                <div className="space-y-6">
                    <PageHero
                        eyebrow="Learning outcomes"
                        title="Progress Tracking"
                        description="Mark lessons and modules as complete on behalf of a student. Their course progress updates automatically."
                        icon="target"
                    />

                    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <PremiumStat
                            label="Total enrollments"
                            value={stats.total}
                            detail="All student–course pairs"
                            icon="users"
                            accent="blue"
                        />
                        <PremiumStat
                            label="Active"
                            value={stats.active}
                            detail="Currently in progress"
                            icon="activity"
                            accent="violet"
                        />
                        <PremiumStat
                            label="Completed"
                            value={stats.completed}
                            detail="Finished all lessons"
                            icon="award"
                            accent="emerald"
                        />
                        <PremiumStat
                            label="Paused"
                            value={stats.paused}
                            detail="Temporarily suspended"
                            icon="clock"
                            accent="amber"
                        />
                    </section>

                    <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
                        {/* -------- list column -------- */}
                        <div className="space-y-4">
                            <AdminSectionHeader
                                eyebrow="Filter"
                                title="Find an enrollment"
                                description="Search by student or course and pick a row to manage."
                            />

                            <form onSubmit={applySearch} className="space-y-3">
                                <div className="relative">
                                    <Icon
                                        name="search"
                                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                    />
                                    <input
                                        value={searchDraft}
                                        onChange={e => setSearchDraft(e.target.value)}
                                        placeholder="Student name, email, or course…"
                                        className={inputClass('pl-9')}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <select
                                        value={filters.status}
                                        onChange={e =>
                                            navigate({ status: e.target.value, page: 1 })
                                        }
                                        className={inputClass('h-10')}
                                    >
                                        <option value="all">All statuses</option>
                                        <option value="active">Active</option>
                                        <option value="completed">Completed</option>
                                        <option value="paused">Paused</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                    <select
                                        value={filters.course_id || ''}
                                        onChange={e =>
                                            navigate({
                                                course_id: Number(e.target.value) || 0,
                                                page: 1,
                                            })
                                        }
                                        className={inputClass('h-10')}
                                    >
                                        <option value="">All courses</option>
                                        {courses.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </form>

                            <div className="space-y-2">
                                {enrollments.data.length === 0 ? (
                                    <EmptyState
                                        icon="user"
                                        title="No enrollments found"
                                        description="Try clearing filters or searching for a different student."
                                    />
                                ) : (
                                    enrollments.data.map(e => {
                                        const active = selected?.id === e.id
                                        return (
                                            <button
                                                key={e.id}
                                                type="button"
                                                onClick={() => selectEnrollment(e.id)}
                                                className={`w-full rounded-2xl border p-3 text-left transition ${
                                                    active
                                                        ? 'border-[#1554c0] bg-[#f4f8ff] shadow-[0_10px_28px_rgba(21,84,192,0.08)] dark:border-[#4c8dff] dark:bg-[#152238]'
                                                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 dark:border-slate-800 dark:bg-[#111827] dark:hover:bg-[#0f1729]'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {assetUrl(e.user.avatar_path) ? (
                                                        <img
                                                            src={assetUrl(e.user.avatar_path) ?? ''}
                                                            alt=""
                                                            className="h-9 w-9 rounded-xl object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf4ff] text-[10px] font-bold text-[#1554c0] dark:bg-[#172945] dark:text-[#8bb8ff]">
                                                            {initials(e.user.name ?? 'Student')}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-white">
                                                            {e.user.name}
                                                        </p>
                                                        <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                                                            {e.course.title}
                                                        </p>
                                                    </div>
                                                    <Pill tone={statusTone(e.status)}>
                                                        {statusLabel(e.status)}
                                                    </Pill>
                                                </div>
                                                <div className="mt-3 flex items-center gap-3">
                                                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                        <div
                                                            className="h-full rounded-full bg-gradient-to-r from-[#1554c0] to-[#6a5cff] transition-all"
                                                            style={{ width: `${e.progress.percent}%` }}
                                                        />
                                                    </div>
                                                    <span className="shrink-0 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                                        {e.progress.percent}%
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-[10px] text-slate-400">
                                                    {e.progress.completed_lessons} of{' '}
                                                    {e.progress.total_lessons} lessons
                                                </p>
                                            </button>
                                        )
                                    })
                                )}
                            </div>

                            {enrollments.last_page > 1 && (
                                <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                                    <span className="text-[10px] text-slate-400">
                                        {enrollments.from}–{enrollments.to} of {enrollments.total}
                                    </span>
                                    <div className="flex gap-1">
                                        <button
                                            type="button"
                                            disabled={enrollments.current_page === 1}
                                            onClick={() =>
                                                navigate({ page: enrollments.current_page - 1 })
                                            }
                                            className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
                                        >
                                            Prev
                                        </button>
                                        <button
                                            type="button"
                                            disabled={enrollments.current_page === enrollments.last_page}
                                            onClick={() =>
                                                navigate({ page: enrollments.current_page + 1 })
                                            }
                                            className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* -------- detail column -------- */}
                        <div className="min-w-0">
                            {!selected ? (
                                <EmptyState
                                    icon="target"
                                    title="Pick an enrollment"
                                    description="Select a student from the list to view their course modules and mark lessons complete."
                                />
                            ) : (
                                <div className="space-y-5">
                                    <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-[#f8faff] p-5 shadow-sm dark:border-slate-800 dark:from-[#111827] dark:via-[#111827] dark:to-[#15152b]">
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                {assetUrl(selected.user.avatar_path) ? (
                                                    <img
                                                        src={assetUrl(selected.user.avatar_path) ?? ''}
                                                        alt=""
                                                        className="h-12 w-12 rounded-2xl object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf4ff] text-sm font-bold text-[#1554c0] dark:bg-[#172945] dark:text-[#8bb8ff]">
                                                        {initials(selected.user.name)}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-base font-bold text-slate-900 dark:text-white">
                                                        {selected.user.name}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                        {selected.user.email}
                                                    </p>
                                                    <p className="mt-1 text-[11px] font-semibold text-[#1554c0] dark:text-[#79a8ff]">
                                                        {selected.course.title}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Pill tone={statusTone(selected.status)}>
                                                    {statusLabel(selected.status)}
                                                </Pill>
                                                <button
                                                    type="button"
                                                    onClick={() => setResetOpen(true)}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-[10px] font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-300 dark:hover:bg-rose-950/40"
                                                >
                                                    <Icon name="refresh" className="h-3.5 w-3.5" />
                                                    Reset progress
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
                                            <Doughnut3D
                                                value={selected.progress.completed_lessons}
                                                total={selected.progress.total_lessons || 1}
                                                label="Course completion"
                                                sublabel={`${selected.progress.completed_lessons} of ${selected.progress.total_lessons} lessons marked complete.`}
                                                tone="blue"
                                            />
                                            <div className="rounded-2xl border border-slate-100 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                                                <p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">
                                                    Enrollment details
                                                </p>
                                                <dl className="mt-3 grid gap-2 text-[11px]">
                                                    <div className="flex justify-between gap-3">
                                                        <dt className="text-slate-500 dark:text-slate-400">Enrolled</dt>
                                                        <dd className="font-semibold text-slate-800 dark:text-slate-200">
                                                            {formatDateTime(selected.enrolled_at)}
                                                        </dd>
                                                    </div>
                                                    <div className="flex justify-between gap-3">
                                                        <dt className="text-slate-500 dark:text-slate-400">Completed</dt>
                                                        <dd className="font-semibold text-slate-800 dark:text-slate-200">
                                                            {selected.completed_at
                                                                ? formatDateTime(selected.completed_at)
                                                                : 'Not yet'}
                                                        </dd>
                                                    </div>
                                                    <div className="flex justify-between gap-3">
                                                        <dt className="text-slate-500 dark:text-slate-400">Overall</dt>
                                                        <dd className="font-semibold text-[#1554c0] dark:text-[#79a8ff]">
                                                            {selected.progress.percent}%
                                                        </dd>
                                                    </div>
                                                </dl>
                                            </div>
                                        </div>
                                    </div>

                                    {selected.modules.length === 0 ? (
                                        <EmptyState
                                            icon="book"
                                            title="No modules yet"
                                            description="This course has no published modules. Add lessons first from Modules & Lessons."
                                        />
                                    ) : (
                                        <div className="space-y-4">
                                            {selected.modules.map(module => {
                                                const allDone =
                                                    module.total_lessons > 0 &&
                                                    module.completed_lessons === module.total_lessons

                                                return (
                                                    <div
                                                        key={module.id}
                                                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111827]"
                                                    >
                                                        <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/40">
                                                            <div className="min-w-0">
                                                                <p className="truncate text-[13px] font-bold text-slate-900 dark:text-white">
                                                                    {module.title}
                                                                </p>
                                                                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                                                    {module.completed_lessons} of{' '}
                                                                    {module.total_lessons} lessons complete
                                                                </p>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    toggleModule(module.id, !allDone)
                                                                }
                                                                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[10px] font-bold transition ${
                                                                    allDone
                                                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300'
                                                                        : 'border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
                                                                }`}
                                                            >
                                                                <Icon
                                                                    name={allDone ? 'check' : 'arrow'}
                                                                    className="h-3.5 w-3.5"
                                                                />
                                                                {allDone ? 'Unmark module' : 'Mark module complete'}
                                                            </button>
                                                        </div>

                                                        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                                                            {module.lessons.length === 0 && (
                                                                <li className="px-4 py-3 text-[11px] text-slate-400">
                                                                    No published lessons in this module yet.
                                                                </li>
                                                            )}
                                                            {module.lessons.map(lesson => (
                                                                <li
                                                                    key={lesson.id}
                                                                    className="flex items-center gap-3 px-4 py-3"
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        aria-label={
                                                                            lesson.completed
                                                                                ? `Unmark ${lesson.title}`
                                                                                : `Mark ${lesson.title} complete`
                                                                        }
                                                                        onClick={() =>
                                                                            toggleLesson(
                                                                                lesson.id,
                                                                                !lesson.completed,
                                                                            )
                                                                        }
                                                                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                                                                            lesson.completed
                                                                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                                                                : 'border-slate-300 bg-white text-transparent hover:border-[#1554c0] dark:border-slate-600 dark:bg-slate-900'
                                                                        }`}
                                                                    >
                                                                        <Icon
                                                                            name="check"
                                                                            className="h-3 w-3"
                                                                        />
                                                                    </button>
                                                                    <div className="min-w-0 flex-1">
                                                                        <p
                                                                            className={`truncate text-[12px] font-semibold ${
                                                                                lesson.completed
                                                                                    ? 'text-slate-700 dark:text-slate-200'
                                                                                    : 'text-slate-900 dark:text-white'
                                                                            }`}
                                                                        >
                                                                            {lesson.title}
                                                                        </p>
                                                                        <p className="text-[10px] text-slate-400">
                                                                            {lesson.type}
                                                                            {lesson.duration_minutes
                                                                                ? ` · ${lesson.duration_minutes} min`
                                                                                : ''}
                                                                        </p>
                                                                    </div>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </AdminLayout>

            {resetOpen && selected && (
                <Modal
                    title="Reset all progress?"
                    eyebrow="Danger zone"
                    onClose={() => setResetOpen(false)}
                >
                    <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                        This will erase every lesson completion for{' '}
                        <span className="font-semibold">{selected.user.name}</span> in{' '}
                        <span className="font-semibold">{selected.course.title}</span>. The
                        enrollment stays intact, but progress drops back to 0%.
                    </p>
                    <div className="mt-5 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setResetOpen(false)}
                            className="rounded-lg border border-slate-200 px-4 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={confirmReset}
                            className="rounded-lg bg-rose-600 px-4 py-2 text-[11px] font-bold text-white hover:bg-rose-700"
                        >
                            Yes, reset progress
                        </button>
                    </div>
                </Modal>
            )}
        </>
    )
}