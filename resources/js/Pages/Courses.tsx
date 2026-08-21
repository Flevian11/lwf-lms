import { useMemo, useState } from 'react'
import { Head, router } from '@inertiajs/react'

import StudentLayout from '../Components/StudentLayout'
import {
    Card,
    EmptyState,
    Icon,
    SectionHeader,
    assetUrl,
} from '../Components/StudentUI'

import type {
    DashboardStats,
    Student,
} from '../Components/student-types'

/*
|--------------------------------------------------------------------------
| Current course
|--------------------------------------------------------------------------
|
| This is the contract returned by StudentDashboardService::currentCourses().
|
*/

interface CurrentCourse {
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

    access_level?: 'full' | 'preview'
    access_granted?: boolean
}

/*
|--------------------------------------------------------------------------
| Catalogue preview lesson
|--------------------------------------------------------------------------
*/

interface PreviewLesson {
    id: number
    title: string
    slug: string
    description: string | null
    type: string
    position: number
    duration_minutes: number | null
}

/*
|--------------------------------------------------------------------------
| Catalogue preview module
|--------------------------------------------------------------------------
*/

interface PreviewModule {
    id: number
    title: string
    description: string | null
    position: number
    lessons: PreviewLesson[]
}

/*
|--------------------------------------------------------------------------
| Catalogue course
|--------------------------------------------------------------------------
|
| This deliberately does NOT extend CourseItem.
|
| CatalogueCourse and CourseItem represent different backend concepts.
|
*/

interface CatalogueCourse {
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

    published_at: string | null

    enrolled: boolean

    access_level: 'full' | 'preview'
    access_granted: boolean

    preview_available: boolean
    preview_module_count: number
    preview_lesson_count: number

    module_count: number
    lesson_count: number

    preview_modules: PreviewModule[]
}

/*
|--------------------------------------------------------------------------
| Page props
|--------------------------------------------------------------------------
*/

interface CoursesPageProps {
    student: Student
    stats: DashboardStats

    courses?: CurrentCourse[]
    catalogue?: CatalogueCourse[]
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function formatPrice(
    price: string | number | null,
    currency: string | null,
): string {
    if (
        price === null ||
        price === undefined ||
        price === ''
    ) {
        return ''
    }

    const numericPrice = Number(price)

    if (Number.isNaN(numericPrice)) {
        return `${currency ?? 'KES'} ${price}`
    }

    if (numericPrice <= 0) {
        return 'Free'
    }

    return `${currency ?? 'KES'} ${numericPrice.toLocaleString(
        'en-KE',
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        },
    )}`
}

function clampProgress(value: number): number {
    return Math.max(
        0,
        Math.min(100, Number(value) || 0),
    )
}

/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

export default function Courses({
    student,
    stats,
    courses = [],
    catalogue = [],
}: CoursesPageProps) {
    const [search, setSearch] = useState('')

    const [previewCourse, setPreviewCourse] =
        useState<CatalogueCourse | null>(null)

    const [
        loadingCourseSlug,
        setLoadingCourseSlug,
    ] = useState<string | null>(null)

    /*
    |--------------------------------------------------------------------------
    | Catalogue search
    |--------------------------------------------------------------------------
    */

    const filteredCatalogue = useMemo(() => {
        const query = search.trim().toLowerCase()

        if (!query) {
            return catalogue
        }

        return catalogue.filter((course) => {
            const searchable = [
                course.title,
                course.category,
                course.level,
                course.short_description,
                course.description,
            ]

            return searchable
                .filter(
                    (
                        value,
                    ): value is string =>
                        typeof value === 'string',
                )
                .some((value) =>
                    value
                        .toLowerCase()
                        .includes(query),
                )
        })
    }, [catalogue, search])

    /*
    |--------------------------------------------------------------------------
    | Continue learning
    |--------------------------------------------------------------------------
    */

    const continueLearning = (
        course: CurrentCourse,
    ) => {
        if (loadingCourseSlug) {
            return
        }

        setLoadingCourseSlug(course.slug)

        router.visit(
            `/courses/${encodeURIComponent(course.slug)}/learn`,
            {
                preserveScroll: false,

                onFinish: () => {
                    setLoadingCourseSlug(null)
                },

                onError: () => {
                    setLoadingCourseSlug(null)
                },
            },
        )
    }

    /*
    |--------------------------------------------------------------------------
    | Preview
    |--------------------------------------------------------------------------
    */

    const openPreview = (
        course: CatalogueCourse,
    ) => {
        setPreviewCourse(course)
    }

    const closePreview = () => {
        setPreviewCourse(null)
    }

    const enrollCourse = (course: CatalogueCourse) => {
        setLoadingCourseSlug(course.slug)

        router.post(
            `/courses/${encodeURIComponent(course.slug)}/enroll`,
            {},
            {
                preserveScroll: true,
                onFinish: () =>
                    setLoadingCourseSlug(null),
            },
        )
    }

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <StudentLayout
            student={student}
            stats={stats}
            title="Courses"
            searchCourses={courses}
        >
            <Head title="Courses" />

            <div className="space-y-9">

                {/* ========================================================
                    PAGE HEADER
                ======================================================== */}

                <section>
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1554c0] dark:text-[#6ba3ff]">
                                Learning catalogue
                            </p>

                            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                                Courses
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                                Continue the courses you are already
                                studying or explore the catalogue to
                                discover your next course.
                            </p>
                        </div>

                        <div className="relative w-full lg:max-w-sm">
                            <Icon
                                name="search"
                                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value,
                                    )
                                }
                                placeholder="Search the course catalogue..."
                                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1554c0] focus:ring-2 focus:ring-[#1554c0]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            />
                        </div>
                    </div>
                </section>

                {/* ========================================================
                    CURRENT COURSES
                ======================================================== */}

                <section>
                    <SectionHeader
                        title="My Courses"
                        description="Courses you are enrolled in, including courses awaiting access."
                        action={
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1554c0]/[0.07] text-[#1554c0] dark:bg-[#4c8dff]/10 dark:text-[#6ba3ff]">
                                <Icon
                                    name="play"
                                    className="h-4 w-4"
                                />
                            </div>
                        }
                    />

                    {courses.length > 0 ? (
                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                            {courses.map((course) => {
                                const progress =
                                    clampProgress(
                                        course.progress,
                                    )

                                const thumbnail =
                                    assetUrl(
                                        course.thumbnail_path,
                                    )

                                const isLoading =
                                    loadingCourseSlug ===
                                    course.slug

                                const hasFullAccess =
                                    course.access_granted ||
                                    course.access_level === 'full'

                                const isPendingAccess =
                                    !hasFullAccess

                                const actionLabel =
                                    progress === 0
                                        ? 'Start learning'
                                        : progress >= 100
                                          ? 'Review course'
                                          : 'Continue learning'

                                return (
                                    <Card
                                        key={course.id}
                                        className="overflow-hidden p-0"
                                    >
                                        <div className="flex flex-col sm:flex-row">
                                            <div className="h-44 shrink-0 bg-[#edf4ff] dark:bg-[#17243c] sm:h-auto sm:w-44">
                                                {thumbnail ? (
                                                    <img
                                                        src={
                                                            thumbnail
                                                        }
                                                        alt={
                                                            course.title
                                                        }
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center">
                                                        <Icon
                                                            name="book"
                                                            className="h-8 w-8 text-[#1554c0] dark:text-[#6ba3ff]"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1 p-5">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#1554c0] dark:text-[#6ba3ff]">
                                                            {
                                                                course.category ??
                                                                'Course'
                                                            }
                                                        </p>

                                                        <h3 className="mt-1 truncate text-base font-bold text-slate-950 dark:text-white">
                                                            {
                                                                course.title
                                                            }
                                                        </h3>
                                                    </div>

                                                    <span className="shrink-0 rounded-full bg-[#edf4ff] px-2.5 py-1 text-[10px] font-bold text-[#1554c0] dark:bg-[#172945] dark:text-[#6ba3ff]">
                                                        {
                                                            course.level
                                                        }
                                                    </span>
                                                </div>

                                                <div className="mt-5">
                                                    <div className="flex items-center justify-between text-[10px] font-semibold">
                                                        <span className="text-slate-400">
                                                            Progress
                                                        </span>

                                                        <span className="text-[#1554c0] dark:text-[#6ba3ff]">
                                                            {
                                                                progress
                                                            }
                                                            %
                                                        </span>
                                                    </div>

                                                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                        <div
                                                            className="h-full rounded-full bg-gradient-to-r from-[#1554c0] to-[#6a5cff] transition-all"
                                                            style={{
                                                                width: `${progress}%`,
                                                            }}
                                                        />
                                                    </div>

                                                    <p className="mt-2 text-[10px] text-slate-400">
                                                        {
                                                            course.completed_lessons
                                                        }{" "}
                                                        of{" "}
                                                        {
                                                            course.total_lessons
                                                        }{" "}
                                                        lessons completed
                                                    </p>
                                                </div>

                                                {isPendingAccess ? (
                                                    <button
                                                        type="button"
                                                        disabled
                                                        className="mt-5 flex w-full cursor-not-allowed items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs font-semibold text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300"
                                                    >
                                                        <span className="flex items-center gap-2">
                                                            <Icon
                                                                name="clock"
                                                                className="h-3.5 w-3.5"
                                                            />
                                                            Pending access
                                                        </span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            isLoading
                                                        }
                                                        onClick={() =>
                                                            continueLearning(
                                                                course,
                                                            )
                                                        }
                                                        className="mt-5 flex w-full items-center justify-between rounded-xl bg-slate-50 px-3.5 py-3 text-xs font-semibold text-slate-700 transition hover:bg-[#1554c0] hover:text-white disabled:cursor-wait disabled:opacity-70 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-[#4c8dff] dark:hover:text-[#07101f]"
                                                    >
                                                        <span className="flex items-center gap-2">
                                                            {isLoading ? (
                                                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-[#1554c0]" />
                                                            ) : (
                                                                <Icon
                                                                    name="play"
                                                                    className="h-3.5 w-3.5"
                                                                />
                                                            )}

                                                            {isLoading
                                                                ? 'Opening course...'
                                                                : actionLabel}
                                                        </span>

                                                        {!isLoading && (
                                                            <Icon
                                                                name="arrow"
                                                                className="h-3.5 w-3.5"
                                                            />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="mt-4">
                            <EmptyState
                                icon="book"
                                title="No enrolled courses yet"
                                description="Once you enroll in a course, it will appear here with its learning progress and access status."
                                action={
                                    <a
                                        href="#course-catalogue"
                                        className="inline-flex items-center gap-2 rounded-xl bg-[#1554c0] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1048a8]"
                                    >
                                        Explore courses
                                        <Icon
                                            name="arrow"
                                            className="h-3.5 w-3.5"
                                        />
                                    </a>
                                }
                            />
                        </div>
                    )}
                </section>

                {/* ========================================================
                    CATALOGUE
                ======================================================== */}

                <section id="course-catalogue">
                    <SectionHeader
                        title="Course catalogue"
                        description="Explore published courses, preview their curriculum, and choose what you want to learn next."
                        action={
                            <div className="hidden items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400 sm:flex">
                                {filteredCatalogue.length}{" "}
                                courses
                            </div>
                        }
                    />

                    {filteredCatalogue.length > 0 ? (
                        <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {filteredCatalogue.map(
                                (course) => {
                                    const thumbnail =
                                        assetUrl(
                                            course.thumbnail_path,
                                        )

                                    const isFullAccess =
                                        course.access_granted ||
                                        course.access_level === 'full'

                                    const isPendingAccess =
                                        course.enrolled && !isFullAccess

                                    return (
                                        <Card
                                            key={course.id}
                                            className="group overflow-hidden p-0 transition hover:-translate-y-0.5 hover:shadow-lg"
                                        >
                                            <div className="relative h-44 overflow-hidden bg-gradient-to-br from-[#1554c0] to-[#6a5cff]">
                                                {thumbnail ? (
                                                    <img
                                                        src={
                                                            thumbnail
                                                        }
                                                        alt={
                                                            course.title
                                                        }
                                                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center">
                                                        <Icon
                                                            name="book"
                                                            className="h-10 w-10 text-white/80"
                                                        />
                                                    </div>
                                                )}

                                                <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
                                                    <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-slate-700">
                                                        {course.level ??
                                                            'All levels'}
                                                    </span>

                                                    <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-slate-700">
                                                        {course.access_type ===
                                                        'free'
                                                            ? 'Free'
                                                            : formatPrice(
                                                                  course.price,
                                                                  course.currency,
                                                              )}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="p-5">
                                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#1554c0] dark:text-[#6ba3ff]">
                                                    {
                                                        course.category ??
                                                        'Course'
                                                    }
                                                </p>

                                                <h3 className="mt-1.5 line-clamp-2 text-base font-bold text-slate-950 dark:text-white">
                                                    {
                                                        course.title
                                                    }
                                                </h3>

                                                <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                                    {
                                                        course.short_description ??
                                                        course.description ??
                                                        'Explore this course and discover what you will learn.'
                                                    }
                                                </p>

                                                <div className="mt-4 flex items-center gap-3 text-[10px] font-medium text-slate-400">
                                                    <span>
                                                        {
                                                            course.module_count
                                                        }{" "}
                                                        {course.module_count ===
                                                        1
                                                            ? 'module'
                                                            : 'modules'}
                                                    </span>

                                                    <span>
                                                        •
                                                    </span>

                                                    <span>
                                                        {
                                                            course.lesson_count
                                                        }{" "}
                                                        {course.lesson_count ===
                                                        1
                                                            ? 'lesson'
                                                            : 'lessons'}
                                                    </span>

                                                    {course.preview_available && (
                                                        <>
                                                            <span>
                                                                •
                                                            </span>

                                                            <span className="text-[#1554c0] dark:text-[#6ba3ff]">
                                                                {
                                                                    course.preview_lesson_count
                                                                }{" "}
                                                                preview
                                                            </span>
                                                        </>
                                                    )}
                                                </div>

                                                <div className="mt-5 flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openPreview(
                                                                course,
                                                            )
                                                        }
                                                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-[#1554c0]/30 hover:bg-[#edf4ff] hover:text-[#1554c0] dark:border-slate-700 dark:text-slate-300 dark:hover:border-[#6ba3ff]/30 dark:hover:bg-[#172945] dark:hover:text-[#6ba3ff]"
                                                    >
                                                        <Icon
                                                            name="book"
                                                            className="h-3.5 w-3.5"
                                                        />
                                                        Preview
                                                    </button>

                                                    {isFullAccess ? (
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                loadingCourseSlug ===
                                                                course.slug
                                                            }
                                                            onClick={() => {
                                                                const currentCourse =
                                                                    courses.find(
                                                                        (item) =>
                                                                            item.id ===
                                                                            course.id,
                                                                    )

                                                                if (currentCourse) {
                                                                    continueLearning(
                                                                        currentCourse,
                                                                    )
                                                                    return
                                                                }

                                                                setLoadingCourseSlug(
                                                                    course.slug,
                                                                )

                                                                router.visit(
                                                                    `/courses/${encodeURIComponent(course.slug)}/learn`,
                                                                    {
                                                                        onFinish: () =>
                                                                            setLoadingCourseSlug(
                                                                                null,
                                                                            ),
                                                                        onError: () =>
                                                                            setLoadingCourseSlug(
                                                                                null,
                                                                            ),
                                                                    },
                                                                )
                                                            }}
                                                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1554c0] px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1048a8] disabled:cursor-wait disabled:opacity-70"
                                                        >
                                                            {loadingCourseSlug ===
                                                            course.slug ? (
                                                                <>
                                                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                                                    Opening...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Icon
                                                                        name="play"
                                                                        className="h-3.5 w-3.5"
                                                                    />
                                                                    Continue learning
                                                                </>
                                                            )}
                                                        </button>
                                                    ) : isPendingAccess ? (
                                                        <button
                                                            type="button"
                                                            disabled
                                                            className="flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300"
                                                        >
                                                            <Icon
                                                                name="clock"
                                                                className="h-3.5 w-3.5"
                                                            />
                                                            Pending access
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                loadingCourseSlug ===
                                                                course.slug
                                                            }
                                                            onClick={() =>
                                                                enrollCourse(
                                                                    course,
                                                                )
                                                            }
                                                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1554c0] px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1048a8] disabled:cursor-wait disabled:opacity-70"
                                                        >
                                                            {loadingCourseSlug ===
                                                            course.slug ? (
                                                                <>
                                                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                                                    Enrolling...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Icon
                                                                        name="play"
                                                                        className="h-3.5 w-3.5"
                                                                    />
                                                                    Enroll
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    )
                                },
                            )}
                        </div>
                    ) : (
                        <div className="mt-4">
                            <EmptyState
                                icon="search"
                                title="No courses match your search"
                                description="Try another course name, category, or skill."
                                action={
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSearch(
                                                '',
                                            )
                                        }
                                        className="rounded-xl bg-[#1554c0] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#1048a8]"
                                    >
                                        Clear search
                                    </button>
                                }
                            />
                        </div>
                    )}
                </section>
            </div>

            {/* ============================================================
                PREVIEW MODAL
            ============================================================ */}

            {previewCourse && (
                <div
                    className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="course-preview-title"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closePreview()
                        }
                    }}
                >
                    <div
                        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.25)] dark:border-slate-700 dark:bg-[#101827]"
                        onMouseDown={(event) =>
                            event.stopPropagation()
                        }
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">
                            <div className="min-w-0 pr-5">
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1554c0] dark:text-[#6ba3ff]">
                                    Course preview
                                </p>

                                <h2
                                    id="course-preview-title"
                                    className="mt-1.5 text-xl font-bold tracking-tight text-slate-950 dark:text-white"
                                >
                                    {
                                        previewCourse.title
                                    }
                                </h2>

                                <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-medium text-slate-400">
                                    <span>
                                        {
                                            previewCourse.module_count
                                        }{" "}
                                        modules
                                    </span>

                                    <span>
                                        •
                                    </span>

                                    <span>
                                        {
                                            previewCourse.lesson_count
                                        }{" "}
                                        lessons
                                    </span>

                                    {previewCourse.preview_lesson_count >
                                        0 && (
                                        <>
                                            <span>
                                                •
                                            </span>

                                            <span className="font-semibold text-[#1554c0] dark:text-[#6ba3ff]">
                                                {
                                                    previewCourse.preview_lesson_count
                                                }{" "}
                                                available
                                                to preview
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    closePreview
                                }
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                                aria-label="Close preview"
                            >
                                <Icon
                                    name="x"
                                    className="h-4 w-4"
                                />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto px-6 py-6">
                            <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                                        About this course
                                    </h3>

                                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                        {
                                            previewCourse.description ??
                                            previewCourse.short_description ??
                                            'Explore this course to understand what you will learn.'
                                        }
                                    </p>

                                    <div className="mt-6">
                                        <div className="flex items-end justify-between gap-4">
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                                                    What you will
                                                    see
                                                </h3>

                                                <p className="mt-1 text-xs text-slate-400">
                                                    A small preview
                                                    of the learning
                                                    curriculum.
                                                </p>
                                            </div>

                                            <span className="text-[10px] font-semibold text-slate-400">
                                                Preview only
                                            </span>
                                        </div>

                                        <div className="mt-4 space-y-3">
                                            {previewCourse.preview_modules.map(
                                                (
                                                    module,
                                                    moduleIndex,
                                                ) => (
                                                    <div
                                                        key={
                                                            module.id
                                                        }
                                                        className="rounded-2xl border border-slate-200 dark:border-slate-800"
                                                    >
                                                        <div className="flex gap-3 p-4">
                                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#edf4ff] text-xs font-bold text-[#1554c0] dark:bg-[#172945] dark:text-[#6ba3ff]">
                                                                {moduleIndex +
                                                                    1}
                                                            </div>

                                                            <div className="min-w-0 flex-1">
                                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                                                    {
                                                                        module.title
                                                                    }
                                                                </h4>

                                                                {module.description && (
                                                                    <p className="mt-1 text-xs leading-5 text-slate-400">
                                                                        {
                                                                            module.description
                                                                        }
                                                                    </p>
                                                                )}

                                                                <div className="mt-3 space-y-2">
                                                                    {module.lessons
                                                                        .slice(
                                                                            0,
                                                                            4,
                                                                        )
                                                                        .map(
                                                                            (
                                                                                lesson,
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        lesson.id
                                                                                    }
                                                                                    className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-900/70"
                                                                                >
                                                                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white text-[#1554c0] shadow-sm dark:bg-slate-800 dark:text-[#6ba3ff]">
                                                                                        <Icon
                                                                                            name="play"
                                                                                            className="h-3 w-3"
                                                                                        />
                                                                                    </div>

                                                                                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700 dark:text-slate-200">
                                                                                        {
                                                                                            lesson.title
                                                                                        }
                                                                                    </span>

                                                                                    {lesson.duration_minutes !==
                                                                                        null && (
                                                                                        <span className="text-[10px] text-slate-400">
                                                                                            {
                                                                                                lesson.duration_minutes
                                                                                            }{" "}
                                                                                            min
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            ),
                                                                        )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ),
                                            )}

                                            {previewCourse.preview_modules.length ===
                                                0 && (
                                                <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-8 text-center dark:border-slate-700">
                                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                        Preview
                                                        content
                                                        coming soon
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-400">
                                                        The course is
                                                        published, but
                                                        no preview
                                                        lessons have
                                                        been configured
                                                        yet.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/70">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                            Course details
                                        </p>

                                        <div className="mt-4 space-y-4">
                                            <div>
                                                <p className="text-[10px] text-slate-400">
                                                    Level
                                                </p>

                                                <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                    {
                                                        previewCourse.level ??
                                                        'All levels'
                                                    }
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-[10px] text-slate-400">
                                                    Category
                                                </p>

                                                <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                    {
                                                        previewCourse.category ??
                                                        'General'
                                                    }
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-[10px] text-slate-400">
                                                    Full course
                                                </p>

                                                <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                    {
                                                        previewCourse.module_count
                                                    }{" "}
                                                    modules
                                                </p>

                                                <p className="mt-0.5 text-xs text-slate-400">
                                                    {
                                                        previewCourse.lesson_count
                                                    }{" "}
                                                    total lessons
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-[10px] text-slate-400">
                                                    Course fee
                                                </p>

                                                <p className="mt-0.5 text-lg font-bold text-slate-950 dark:text-white">
                                                    {previewCourse.access_type ===
                                                    'free'
                                                        ? 'Free'
                                                        : formatPrice(
                                                              previewCourse.price,
                                                              previewCourse.currency,
                                                          )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {previewCourse.preview_lesson_count <
                                        previewCourse.lesson_count && (
                                        <div className="mt-3 rounded-2xl border border-[#1554c0]/10 bg-[#edf4ff] p-4 dark:border-[#6ba3ff]/10 dark:bg-[#172945]">
                                            <p className="text-xs font-bold text-[#1554c0] dark:text-[#6ba3ff]">
                                                Preview access
                                            </p>

                                            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                                You are seeing selected
                                                lessons only. The complete
                                                curriculum and protected
                                                learning materials become
                                                available with full access.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex flex-col gap-3 border-t border-slate-100 bg-white px-6 py-4 dark:border-slate-800 dark:bg-[#101827] sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs text-slate-400">
                                Preview the course before deciding
                                whether it is right for you.
                            </p>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={
                                        closePreview
                                    }
                                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    Close
                                </button>

                                <a
                                    href={`/courses/${previewCourse.slug}`}
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#1554c0] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1048a8]"
                                >
                                    View course
                                    <Icon
                                        name="arrow"
                                        className="h-3.5 w-3.5"
                                    />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </StudentLayout>
    )
}