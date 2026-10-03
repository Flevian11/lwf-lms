import { Head, Link } from '@inertiajs/react'
import { useState } from 'react'
import StudentLayout from '../Components/StudentLayout'
import {
    Card,
    EmptyState,
    Icon,
    StatCard,
    assetUrl,
} from '../Components/StudentUI'
import type { DashboardStats, Student } from '../Components/student-types'

/* ------------------------------------------------------------------ types */

interface LessonItem {
    id: number
    title: string
    slug: string
    type: string
    duration_minutes: number | null
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

interface CourseProgress {
    id: number
    status: string
    enrolled_at: string | null
    completed_at: string | null
    course: {
        id: number
        title: string
        slug: string
        thumbnail_path: string | null
        level: string
    }
    modules: ModuleItem[]
    total_lessons: number
    completed_lessons: number
    percent: number
}

interface Summary {
    total_courses: number
    completed_courses: number
    total_lessons: number
    completed_lessons: number
    overall_percent: number
}

interface Props {
    student: Student
    stats: DashboardStats
    courses: CourseProgress[]
    summary: Summary
}

/* ------------------------------------------------------------------ page */

export default function Progress({ student, stats, courses, summary }: Props) {
    const [expanded, setExpanded] = useState<number | null>(
        courses[0]?.id ?? null,
    )

    return (
        <>
            <Head title="My Progress" />
            <StudentLayout student={student} stats={stats} title="My Progress">
                <div className="space-y-6">
                    {/* Hero */}
                    <Card className="relative overflow-hidden p-6 sm:p-7">
                        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#1554c0]/[0.06] blur-3xl" />
                        <div className="relative">
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1554c0] dark:text-[#6ba3ff]">
                                Learning analytics
                            </p>
                            <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-900 dark:text-white sm:text-3xl">
                                My Progress
                            </h1>
                            <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500 dark:text-slate-400">
                                Track lesson completion across every course you are
                                enrolled in. Your instructor marks topics and
                                subtopics complete — the progress shown here updates
                                automatically.
                            </p>
                        </div>
                    </Card>

                    {/* Stat cards */}
                    <section className="grid gap-3 sm:grid-cols-3">
                        <StatCard
                            icon="book"
                            label="Courses enrolled"
                            value={summary.total_courses}
                            detail={`${summary.completed_courses} completed`}
                        />
                        <StatCard
                            icon="check"
                            label="Lessons completed"
                            value={summary.completed_lessons}
                            detail={`out of ${summary.total_lessons} total lessons`}
                        />
                        <StatCard
                            icon="target"
                            label="Overall progress"
                            value={`${summary.overall_percent}%`}
                            detail="Average across all courses"
                            progress={summary.overall_percent}
                        />
                    </section>

                    {/* Course list */}
                    {courses.length === 0 ? (
                        <EmptyState
                            icon="book"
                            title="No enrollments yet"
                            description="Once you enroll in a course, your progress will appear here."
                            action={
                                <Link
                                    href="/courses"
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#1554c0] px-3.5 py-2 text-[11px] font-bold text-white transition hover:bg-[#0f4298]"
                                >
                                    Browse courses
                                    <Icon name="arrow" className="h-3.5 w-3.5" />
                                </Link>
                            }
                        />
                    ) : (
                        <div className="space-y-4">
                            {courses.map(course => {
                                const isOpen = expanded === course.id

                                return (
                                    <Card key={course.id} className="overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setExpanded(isOpen ? null : course.id)
                                            }
                                            className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-slate-50/60 dark:hover:bg-slate-900/40"
                                        >
                                            {assetUrl(course.course.thumbnail_path) ? (
                                                <img
                                                    src={
                                                        assetUrl(
                                                            course.course.thumbnail_path,
                                                        ) ?? ''
                                                    }
                                                    alt=""
                                                    className="h-12 w-12 rounded-xl object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#6ba3ff]">
                                                    <Icon
                                                        name="book"
                                                        className="h-5 w-5"
                                                    />
                                                </div>
                                            )}

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                                                    {course.course.title}
                                                </p>
                                                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                                    {course.course.level}
                                                </p>
                                                <div className="mt-2 flex items-center gap-3">
                                                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                        <div
                                                            className="h-full rounded-full bg-gradient-to-r from-[#1554c0] to-[#6a5cff] transition-all duration-700"
                                                            style={{
                                                                width: `${course.percent}%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                                                        {course.percent}%
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-[10px] text-slate-400">
                                                    {course.completed_lessons} of{' '}
                                                    {course.total_lessons} lessons complete
                                                </p>
                                            </div>

                                            <Icon
                                                name="chevron"
                                                className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                                                    isOpen ? 'rotate-90' : ''
                                                }`}
                                            />
                                        </button>

                                        {isOpen ? (
                                            <div className="border-t border-slate-100 dark:border-slate-800">
                                                {course.modules.length === 0 ? (
                                                    <p className="px-4 py-6 text-center text-xs text-slate-400">
                                                        No modules published yet.
                                                    </p>
                                                ) : (
                                                    course.modules.map(module => {
                                                        const moduleDone =
                                                            module.total_lessons > 0 &&
                                                            module.completed_lessons ===
                                                                module.total_lessons

                                                        return (
                                                            <div
                                                                key={module.id}
                                                                className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                                                            >
                                                                <div className="flex items-center justify-between gap-3 bg-slate-50/60 px-4 py-2.5 dark:bg-slate-900/40">
                                                                    <p className="truncate text-[11px] font-bold text-slate-700 dark:text-slate-200">
                                                                        {module.title}
                                                                    </p>
                                                                    <span
                                                                        className={`shrink-0 text-[10px] font-bold ${
                                                                            moduleDone
                                                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                                                : 'text-slate-400'
                                                                        }`}
                                                                    >
                                                                        {
                                                                            module.completed_lessons
                                                                        }
                                                                        /
                                                                        {
                                                                            module.total_lessons
                                                                        }
                                                                    </span>
                                                                </div>

                                                                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                                                                    {module.lessons.map(
                                                                        lesson => (
                                                                            <li
                                                                                key={
                                                                                    lesson.id
                                                                                }
                                                                                className="flex items-center gap-3 px-4 py-2.5"
                                                                            >
                                                                                <span
                                                                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                                                                        lesson.completed
                                                                                            ? 'border-emerald-500 bg-emerald-500 text-white'
                                                                                            : 'border-slate-300 bg-white text-transparent dark:border-slate-600 dark:bg-slate-900'
                                                                                    }`}
                                                                                >
                                                                                    <Icon
                                                                                        name="check"
                                                                                        className="h-3 w-3"
                                                                                    />
                                                                                </span>
                                                                                <div className="min-w-0 flex-1">
                                                                                    <p
                                                                                        className={`truncate text-[12px] font-semibold ${
                                                                                            lesson.completed
                                                                                                ? 'text-slate-700 dark:text-slate-200'
                                                                                                : 'text-slate-900 dark:text-white'
                                                                                        }`}
                                                                                    >
                                                                                        {
                                                                                            lesson.title
                                                                                        }
                                                                                    </p>
                                                                                    <p className="text-[10px] text-slate-400">
                                                                                        {
                                                                                            lesson.type
                                                                                        }
                                                                                        {lesson.duration_minutes
                                                                                            ? ` · ${lesson.duration_minutes} min`
                                                                                            : ''}
                                                                                    </p>
                                                                                </div>
                                                                            </li>
                                                                        ),
                                                                    )}
                                                                </ul>
                                                            </div>
                                                        )
                                                    })
                                                )}
                                            </div>
                                        ) : null}
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </div>
            </StudentLayout>
        </>
    )
}