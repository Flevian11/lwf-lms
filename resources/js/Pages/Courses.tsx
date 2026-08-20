import { Head, router } from '@inertiajs/react'
import { useState } from 'react'
import StudentLayout from '../Components/StudentLayout'
import {
    Card,
    SectionHeader,
    EmptyState,
    Icon,
    assetUrl,
} from '../Components/StudentUI'
import type {
    DashboardStats,
    Student,
} from '../Components/student-types'

interface EnrolledCourse {
    id: number
    title: string
    slug: string
    thumbnail_path: string | null
    level: string
    category: string | null
    progress: number
    completed_lessons: number
    total_lessons: number
    enrolled_at: string | null
    access_level?: string
    access_granted?: boolean
}

interface PreviewLesson {
    id: number
    title: string
    slug: string
    description: string | null
    type: string
    position: number
    duration_minutes: number | null
}

interface PreviewModule {
    id: number
    title: string
    description: string | null
    position: number
    lessons: PreviewLesson[]
}

interface CatalogueCourse {
    id: number
    title: string
    slug: string
    short_description: string | null
    description: string | null
    thumbnail_path: string | null
    level: string
    category: string | null
    access_type: string
    price: string | number
    currency: string
    published_at: string | null

    enrolled: boolean
    access_level: string
    access_granted: boolean

    preview_available: boolean
    preview_module_count: number
    preview_lesson_count: number

    module_count: number
    lesson_count: number

    preview_modules: PreviewModule[]
}

interface CoursesProps {
    student: Student
    stats: DashboardStats
    courses?: EnrolledCourse[]
    catalogue?: CatalogueCourse[]
}

function formatLevel(level: string): string {
    if (!level) {
        return 'All levels'
    }

    return level
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatPrice(
    price: string | number,
    currency: string,
    accessType: string,
): string {
    if (accessType === 'free') {
        return 'Free'
    }

    const amount = Number(price)

    if (!Number.isFinite(amount)) {
        return `${currency} ${price}`
    }

    return `${currency} ${amount.toLocaleString('en-KE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })}`
}

function CourseThumbnail({
    title,
    thumbnailPath,
    className = 'h-48',
}: {
    title: string
    thumbnailPath: string | null
    className?: string
}) {
    const image = assetUrl(thumbnailPath)

    if (image) {
        return (
            <img
                src={image}
                alt={title}
                className={`w-full ${className} object-cover`}
            />
        )
    }

    return (
        <div
            className={`flex w-full ${className} items-center justify-center bg-gradient-to-br from-[#edf4ff] via-[#f5f3ff] to-[#eef7ff] text-[#1554c0] dark:from-[#172945] dark:via-[#211a3b] dark:to-[#14253d] dark:text-[#6ba3ff]`}
        >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 shadow-sm dark:bg-slate-900/50">
                <Icon name="book" className="h-7 w-7" />
            </div>
        </div>
    )
}

function LoadingSpinner({
    light = false,
}: {
    light?: boolean
}) {
    return (
        <span
            aria-hidden="true"
            className={`h-4 w-4 animate-spin rounded-full border-2 ${
                light
                    ? 'border-white/40 border-t-white'
                    : 'border-[#1554c0]/20 border-t-[#1554c0]'
            }`}
        />
    )
}

function AccessBadge({
    course,
}: {
    course: CatalogueCourse
}) {
    if (course.access_granted) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                <Icon name="check" className="h-3 w-3" />
                Full access
            </span>
        )
    }

    if (course.access_type === 'free') {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                <Icon name="check" className="h-3 w-3" />
                Free
            </span>
        )
    }

    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
            <Icon name="play" className="h-3 w-3" />
            Preview available
        </span>
    )
}

function EnrolledCourseCard({
    course,
    loadingSlug,
    onOpen,
}: {
    course: EnrolledCourse
    loadingSlug: string | null
    onOpen: (course: EnrolledCourse) => void
}) {
    const progress = Math.min(
        100,
        Math.max(0, Number(course.progress) || 0),
    )

    const loading = loadingSlug === course.slug

    return (
        <Card className="overflow-hidden">
            <div className="grid md:grid-cols-[220px_minmax(0,1fr)]">
                <CourseThumbnail
                    title={course.title}
                    thumbnailPath={course.thumbnail_path}
                    className="h-full min-h-[210px]"
                />

                <div className="p-5 sm:p-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                {course.category && (
                                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#1554c0] dark:text-[#6ba3ff]">
                                        {course.category}
                                    </span>
                                )}

                                <span className="text-[10px] text-slate-400">
                                    {formatLevel(course.level)}
                                </span>

                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                    <Icon
                                        name="check"
                                        className="h-3 w-3"
                                    />
                                    Access active
                                </span>
                            </div>

                            <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-950 dark:text-white">
                                {course.title}
                            </h3>

                            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                {course.completed_lessons} of{' '}
                                {course.total_lessons} lessons completed
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => onOpen(course)}
                            disabled={loadingSlug !== null}
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1554c0] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1248a5] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {loading ? (
                                <>
                                    <LoadingSpinner light />
                                    Opening...
                                </>
                            ) : (
                                <>
                                    Continue learning
                                    <Icon
                                        name="arrow"
                                        className="h-3.5 w-3.5"
                                    />
                                </>
                            )}
                        </button>
                    </div>

                    <div className="mt-6">
                        <div className="flex items-end justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                    Your progress
                                </p>

                                <p className="mt-1 text-[10px] text-slate-400">
                                    Keep going — you're making progress.
                                </p>
                            </div>

                            <span className="text-sm font-bold text-[#1554c0] dark:text-[#6ba3ff]">
                                {progress}%
                            </span>
                        </div>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-[#1554c0] to-[#6a5cff] transition-all duration-500"
                                style={{
                                    width: `${progress}%`,
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    )
}

function CatalogueCourseCard({
    course,
    loadingSlug,
    onOpen,
}: {
    course: CatalogueCourse
    loadingSlug: string | null
    onOpen: (course: CatalogueCourse) => void
}) {
    const loading = loadingSlug === course.slug
    const fullAccess = course.access_granted
    const free = course.access_type === 'free'

    const actionLabel = fullAccess
        ? 'Continue learning'
        : free
          ? 'Start course'
          : 'View preview'

    return (
        <Card className="group overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
            <div className="relative overflow-hidden">
                <CourseThumbnail
                    title={course.title}
                    thumbnailPath={course.thumbnail_path}
                />

                <div className="absolute left-3 top-3">
                    <AccessBadge course={course} />
                </div>

                <div className="absolute bottom-3 right-3 rounded-lg bg-slate-950/75 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                    {course.module_count}{' '}
                    {course.module_count === 1
                        ? 'topic'
                        : 'topics'}
                </div>
            </div>

            <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            {course.category && (
                                <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#1554c0] dark:text-[#6ba3ff]">
                                    {course.category}
                                </span>
                            )}

                            <span className="text-[10px] text-slate-400">
                                {formatLevel(course.level)}
                            </span>
                        </div>

                        <h3 className="mt-2 line-clamp-2 text-base font-bold tracking-tight text-slate-950 dark:text-white">
                            {course.title}
                        </h3>
                    </div>

                    <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-slate-950 dark:text-white">
                            {formatPrice(
                                course.price,
                                course.currency,
                                course.access_type,
                            )}
                        </p>
                    </div>
                </div>

                <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {course.short_description ||
                        course.description ||
                        'Explore this course and discover what you will learn.'}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {course.module_count}{' '}
                        {course.module_count === 1
                            ? 'topic'
                            : 'topics'}
                    </span>

                    <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {course.lesson_count}{' '}
                        {course.lesson_count === 1
                            ? 'lesson'
                            : 'lessons'}
                    </span>

                    {course.preview_available && (
                        <span className="rounded-lg bg-[#edf4ff] px-2.5 py-1.5 text-[10px] font-medium text-[#1554c0] dark:bg-[#172945] dark:text-[#6ba3ff]">
                            {course.preview_lesson_count}{' '}
                            preview{' '}
                            {course.preview_lesson_count === 1
                                ? 'lesson'
                                : 'lessons'}
                        </span>
                    )}
                </div>

                {course.preview_available && !fullAccess && (
                    <div className="mt-4 rounded-xl border border-[#dfe7f3] bg-[#f8fbff] px-3.5 py-3 dark:border-slate-800 dark:bg-slate-900/50">
                        <div className="flex items-start gap-2.5">
                            <div className="mt-0.5 text-[#1554c0] dark:text-[#6ba3ff]">
                                <Icon
                                    name="play"
                                    className="h-4 w-4"
                                />
                            </div>

                            <div>
                                <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                                    Preview this course
                                </p>

                                <p className="mt-0.5 text-[10px] leading-5 text-slate-500 dark:text-slate-400">
                                    View the course overview, curriculum and
                                    available preview lessons before getting
                                    full access.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-200">
                            {fullAccess
                                ? 'Your access is active'
                                : free
                                  ? 'Free course'
                                  : 'Full access required'}
                        </p>

                        <p className="mt-1 text-[10px] text-slate-400">
                            {fullAccess
                                ? 'Continue where you left off'
                                : free
                                  ? 'Start learning now'
                                  : 'Explore the course first'}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => onOpen(course)}
                        disabled={loadingSlug !== null}
                        className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${
                            fullAccess || free
                                ? 'bg-[#1554c0] text-white shadow-sm hover:bg-[#1248a5]'
                                : 'border border-[#1554c0]/15 bg-[#edf4ff] text-[#1554c0] hover:bg-[#e5efff] dark:border-[#6ba3ff]/15 dark:bg-[#172945] dark:text-[#6ba3ff]'
                        }`}
                    >
                        {loading ? (
                            <>
                                <LoadingSpinner light={fullAccess || free} />
                                Opening...
                            </>
                        ) : (
                            <>
                                {actionLabel}
                                <Icon
                                    name="arrow"
                                    className="h-3.5 w-3.5"
                                />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Card>
    )
}

export default function Courses({
    student,
    stats,
    courses = [],
    catalogue = [],
}: CoursesProps) {
    const [loadingSlug, setLoadingSlug] = useState<string | null>(null)

    /*
     * The catalogue is deliberately NOT filtered by enrollment or payment.
     *
     * A student needs to discover paid courses before deciding to enroll.
     * Access control happens on the course page/server, not by hiding
     * products from the catalogue.
     */
    const enrolledCourses = courses

    const enrolledIds = new Set(
        enrolledCourses.map((course) => course.id),
    )

    const discoverableCourses = catalogue.filter(
        (course) => !enrolledIds.has(course.id),
    )

    const openCourse = (
        course: EnrolledCourse | CatalogueCourse,
    ) => {
        if (loadingSlug !== null) {
            return
        }

        setLoadingSlug(course.slug)

        router.visit(`/courses/${course.slug}`, {
            method: 'get',
            preserveState: false,
            preserveScroll: false,

            onFinish: () => {
                setLoadingSlug(null)
            },
        })
    }

    return (
        <StudentLayout
            student={student}
            stats={stats}
        >
            <Head title="My Courses" />

            <div className="space-y-8">
                {/* Page heading */}
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1554c0] dark:text-[#6ba3ff]">
                        Learning
                    </p>

                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                        My Courses
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                        Continue your learning or explore courses available
                        on Learn With Flevian.
                    </p>
                </div>

                {/* Summary */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <Card className="p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Enrolled courses
                                </p>

                                <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
                                    {stats.courses.total}
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#6ba3ff]">
                                <Icon
                                    name="book"
                                    className="h-5 w-5"
                                />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Active learning
                                </p>

                                <p className="mt-1 text-2xl font-bold text-[#1554c0] dark:text-[#6ba3ff]">
                                    {stats.courses.active}
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#6ba3ff]">
                                <Icon
                                    name="play"
                                    className="h-5 w-5"
                                />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Available courses
                                </p>

                                <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
                                    {catalogue.length}
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#6ba3ff]">
                                <Icon
                                    name="grid"
                                    className="h-5 w-5"
                                />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Continue learning */}
                <section>
                    <SectionHeader
                        title="Continue learning"
                        description={
                            enrolledCourses.length > 0
                                ? 'Pick up where you left off.'
                                : 'Your enrolled courses will appear here.'
                        }
                    />

                    {enrolledCourses.length > 0 ? (
                        <div className="space-y-4">
                            {enrolledCourses.map((course) => (
                                <EnrolledCourseCard
                                    key={course.id}
                                    course={course}
                                    loadingSlug={loadingSlug}
                                    onOpen={openCourse}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon="book"
                            title="No courses yet"
                            description="Explore the catalogue below to find a course you would like to take."
                        />
                    )}
                </section>

                {/* Catalogue */}
                <section>
                    <SectionHeader
                        title="Explore courses"
                        description="Browse all published courses. Preview a course before getting full access."
                    />

                    {discoverableCourses.length > 0 ? (
                        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {discoverableCourses.map((course) => (
                                <CatalogueCourseCard
                                    key={course.id}
                                    course={course}
                                    loadingSlug={loadingSlug}
                                    onOpen={openCourse}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon="book"
                            title="No additional courses"
                            description="There are no other published courses available right now."
                        />
                    )}
                </section>
            </div>
        </StudentLayout>
    )
}