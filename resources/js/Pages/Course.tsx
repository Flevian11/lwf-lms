import { Head, Link, router } from '@inertiajs/react'
import { useState } from 'react'

import StudentLayout from '../Components/StudentLayout'
import {
    Card,
    Icon,
    assetUrl,
} from '../Components/StudentUI'

import type {
    DashboardStats,
    Student,
} from '../Components/student-types'

interface CourseLesson {
    id: number
    title: string
    slug: string
    description: string | null
    content: null
    type: string
    position: number
    duration_minutes: number | null
    is_preview: boolean
    locked: boolean
    can_access: boolean
    materials: unknown[]
}

interface CourseModule {
    id: number
    title: string
    description: string | null
    position: number
    is_preview: boolean
    locked: boolean
    can_access: boolean
    lessons: CourseLesson[]
}

interface CourseEnrollment {
    status: string | null
    source: string | null
    access_granted_at: string | null
    enrolled_at: string | null
    started_at: string | null
    completed_at: string | null
}

interface CourseOverview {
    id: number
    title: string
    slug: string
    short_description: string | null
    description: string | null
    thumbnail_path: string | null
    level: string | null
    category: string | null
    access_type: string | null
    price: string | number | null
    currency: string | null
    access_level: 'full' | 'preview' | string
    access_granted: boolean
    enrolled: boolean
    enrollment: CourseEnrollment | null
    total_modules: number
    total_lessons: number
    preview_lesson_count: number
    preview_available: boolean
    modules: CourseModule[]
}

interface CoursePageProps {
    student: Student
    stats: DashboardStats
    course: CourseOverview
}

function formatPrice(
    price: string | number | null,
    currency: string | null,
): string {
    if (price === null || price === undefined || price === '') {
        return ''
    }

    const numericPrice = Number(price)

    if (Number.isNaN(numericPrice)) {
        return `${currency ?? 'KES'} ${price}`
    }

    if (numericPrice <= 0) {
        return 'Free'
    }

    return `${currency ?? 'KES'} ${numericPrice.toLocaleString('en-KE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })}`
}

function formatDuration(minutes: number | null): string {
    if (!minutes || minutes <= 0) return ''

    if (minutes < 60) {
        return `${minutes} min`
    }

    const hours = Math.floor(minutes / 60)
    const remaining = minutes % 60

    return remaining > 0
        ? `${hours}h ${remaining}m`
        : `${hours}h`
}

export default function Course({
    student,
    stats,
    course,
}: CoursePageProps) {
    const thumbnail = assetUrl(course.thumbnail_path)
    const [enrolling, setEnrolling] = useState(false)

    const enrollCourse = () => {
        setEnrolling(true)

        router.post(
            `/courses/${encodeURIComponent(course.slug)}/enroll`,
            {},
            {
                onFinish: () => setEnrolling(false),
            },
        )
    }

    return (
        <StudentLayout
            student={student}
            stats={stats}
            title={course.title}
        >
            <Head title={course.title} />

            <div className="space-y-7">
                <div>
                    <Link
                        href="/courses"
                        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-[#1554c0] dark:text-slate-400 dark:hover:text-[#6ba3ff]"
                    >
                        <Icon name="arrow" className="h-3.5 w-3.5 rotate-180" />
                        Back to courses
                    </Link>
                </div>

                <Card className="overflow-hidden p-0">
                    <div className="grid lg:grid-cols-[1.35fr_0.65fr]">
                        <div className="relative min-h-[260px] overflow-hidden bg-gradient-to-br from-[#1554c0] to-[#6a5cff]">
                            {thumbnail ? (
                                <img
                                    src={thumbnail}
                                    alt={course.title}
                                    className="absolute inset-0 h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full min-h-[260px] items-center justify-center">
                                    <Icon
                                        name="book"
                                        className="h-16 w-16 text-white/80"
                                    />
                                </div>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />

                            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                                <div className="flex flex-wrap gap-2">
                                    <span className="rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-700">
                                        {course.level ?? 'All levels'}
                                    </span>

                                    {course.category ? (
                                        <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white ring-1 ring-white/20 backdrop-blur-sm">
                                            {course.category}
                                        </span>
                                    ) : null}
                                </div>

                                <h1 className="mt-3 max-w-3xl text-2xl font-bold tracking-tight text-white sm:text-3xl">
                                    {course.title}
                                </h1>

                                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/80">
                                    {course.short_description ??
                                        course.description ??
                                        'Explore the course curriculum and learning path.'}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col justify-between border-t border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-[#101827] lg:border-l lg:border-t-0">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                    Course details
                                </p>

                                <div className="mt-5 space-y-5">
                                    <div>
                                        <p className="text-[10px] text-slate-400">Curriculum</p>
                                        <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                                            {course.total_modules}{' '}
                                            {course.total_modules === 1 ? 'module' : 'modules'}
                                        </p>
                                        <p className="mt-0.5 text-xs text-slate-400">
                                            {course.total_lessons}{' '}
                                            {course.total_lessons === 1 ? 'lesson' : 'lessons'}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-[10px] text-slate-400">Course fee</p>
                                        <p className="mt-1 text-xl font-bold text-slate-950 dark:text-white">
                                            {course.access_type === 'free'
                                                ? 'Free'
                                                : formatPrice(course.price, course.currency)}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-[10px] text-slate-400">Access</p>
                                        <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                                            {course.access_granted
                                                ? 'Full access'
                                                : course.enrolled
                                                  ? 'Enrolled — access pending'
                                                  : course.preview_available
                                                    ? `${course.preview_lesson_count} preview ${course.preview_lesson_count === 1 ? 'lesson' : 'lessons'}`
                                                    : 'Preview available'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-7 space-y-2">
                                {course.access_granted ? (
                                    <Link
                                        href={`/courses/${encodeURIComponent(course.slug)}/learn`}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1554c0] px-4 py-3 text-xs font-semibold text-white transition hover:bg-[#1048a8]"
                                    >
                                        <Icon name="play" className="h-3.5 w-3.5" />
                                        Continue learning
                                    </Link>
                                ) : course.enrolled ? (
                                    <button
                                        type="button"
                                        disabled
                                        className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300"
                                    >
                                        Pending access
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        disabled={enrolling}
                                        onClick={enrollCourse}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1554c0] px-4 py-3 text-xs font-semibold text-white transition hover:bg-[#1048a8] disabled:cursor-wait disabled:opacity-70"
                                    >
                                        {enrolling ? (
                                            <>
                                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                                Enrolling...
                                            </>
                                        ) : (
                                            <>
                                                Enroll
                                            </>
                                        )}
                                    </button>
                                )}

                                <Link
                                    href="/courses"
                                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    Back to catalogue
                                </Link>
                            </div>
                        </div>
                    </div>
                </Card>

                <section>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1554c0] dark:text-[#6ba3ff]">
                                Curriculum
                            </p>
                            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950 dark:text-white">
                                What you will learn
                            </h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {course.access_granted
                                    ? 'Your full course curriculum is available below.'
                                    : 'Preview lessons are available. Protected lessons remain locked until full access is granted.'}
                            </p>
                        </div>

                        <div className="text-xs font-medium text-slate-400">
                            {course.total_modules} {course.total_modules === 1 ? 'module' : 'modules'} ·{' '}
                            {course.total_lessons} {course.total_lessons === 1 ? 'lesson' : 'lessons'}
                        </div>
                    </div>

                    <div className="mt-4 space-y-4">
                        {course.modules.map((module) => (
                            <Card key={module.id} className="overflow-hidden p-0">
                                <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#edf4ff] text-xs font-bold text-[#1554c0] dark:bg-[#172945] dark:text-[#6ba3ff]">
                                            {module.position}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {module.title}
                                                </h3>

                                                {module.is_preview ? (
                                                    <span className="rounded-full bg-[#edf4ff] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#1554c0] dark:bg-[#172945] dark:text-[#6ba3ff]">
                                                        Preview
                                                    </span>
                                                ) : null}
                                            </div>

                                            {module.description ? (
                                                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                                    {module.description}
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>

                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {module.lessons.map((lesson) => {
                                        const duration = formatDuration(lesson.duration_minutes)

                                        return (
                                            <div
                                                key={lesson.id}
                                                className="flex items-center gap-3 px-5 py-3.5"
                                            >
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                                    {lesson.locked ? (
                                                        <Icon name="shield" className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <Icon name="play" className="h-3.5 w-3.5" />
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                                            {lesson.title}
                                                        </p>

                                                        {lesson.is_preview && !course.access_granted ? (
                                                            <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#1554c0] dark:text-[#6ba3ff]">
                                                                Preview
                                                            </span>
                                                        ) : null}
                                                    </div>

                                                    {lesson.can_access && lesson.description ? (
                                                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-5 text-slate-400">
                                                            {lesson.description}
                                                        </p>
                                                    ) : null}
                                                </div>

                                                <div className="flex shrink-0 items-center gap-3 text-[10px] font-medium text-slate-400">
                                                    {duration ? <span>{duration}</span> : null}
                                                    {lesson.locked ? (
                                                        <span className="hidden sm:inline">Locked</span>
                                                    ) : null}
                                                </div>
                                            </div>
                                        )
                                    })}

                                    {module.lessons.length === 0 ? (
                                        <div className="px-5 py-6 text-center text-xs text-slate-400">
                                            No published lessons are available in this module yet.
                                        </div>
                                    ) : null}
                                </div>
                            </Card>
                        ))}

                        {course.modules.length === 0 ? (
                            <Card>
                                <div className="py-8 text-center">
                                    <Icon name="book" className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                                    <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                        Curriculum not available yet
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400">
                                        This course has been published, but no modules are currently available.
                                    </p>
                                </div>
                            </Card>
                        ) : null}
                    </div>
                </section>

                {!course.access_granted && course.preview_lesson_count < course.total_lessons ? (
                    <Card className="border-[#1554c0]/10 bg-[#edf4ff] dark:border-[#6ba3ff]/10 dark:bg-[#172945]">
                        <div className="flex gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#1554c0] dark:bg-[#101827] dark:text-[#6ba3ff]">
                                <Icon name="shield" className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-[#1554c0] dark:text-[#6ba3ff]">
                                    Preview access
                                </p>
                                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                    You are seeing selected lessons only. Protected lesson content and materials remain unavailable until full access is granted.
                                </p>
                            </div>
                        </div>
                    </Card>
                ) : null}
            </div>
        </StudentLayout>
    )
}
