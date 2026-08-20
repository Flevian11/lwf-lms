import { Link, usePage } from '@inertiajs/react'
import type { IconName, PageProps } from '../Components/student-types'
import StudentLayout from '../Components/StudentLayout'
import {
    Card,
    EmptyState,
    Icon,
    SectionHeader,
    StatCard,
    assetUrl,
    formatDate,
    formatDateTime,
    initials,
} from '../Components/StudentUI'

interface DashboardPageProps extends Record<string, unknown> {
    student: PageProps['student']
    stats: PageProps['stats']
    weekly_progress?: PageProps['weekly_progress']
    current_courses?: PageProps['current_courses']
    upcoming_assignments?: PageProps['upcoming_assignments']
    upcoming_quizzes?: PageProps['upcoming_quizzes']
    recent_activity?: PageProps['recent_activity']
    achievements?: PageProps['achievements']
    recommendations?: PageProps['recommendations']
    leaderboard?: PageProps['leaderboard']
}

export default function Dashboard() {
    const {
        student,
        stats,
        weekly_progress,
        current_courses,
        upcoming_assignments,
        upcoming_quizzes,
        recent_activity,
        achievements,
        recommendations,
        leaderboard,
    } = usePage<DashboardPageProps>().props

    const weekly = weekly_progress ?? {
        days: [],
        total_activities: 0,
        total_points: 0,
    }

    const courses = current_courses ?? []
    const assignments = upcoming_assignments ?? []
    const quizzes = upcoming_quizzes ?? []
    const activities = recent_activity ?? []
    const earnedAchievements = achievements ?? []
    const recommendedCourses = recommendations ?? []
    const board = leaderboard ?? {
        rank: 0,
        total_points: 0,
        top_students: [],
    }

    const firstName = student.name.trim().split(/\s+/)[0] || 'there'

    const searchCourses = [
        ...courses,
        ...recommendedCourses.filter(
            (recommended) => !courses.some((course) => course.id === recommended.id),
        ),
    ]

    const upcomingWork = [
        ...assignments.map((item) => ({ ...item, kind: 'Assignment' as const })),
        ...quizzes.map((item) => ({ ...item, kind: 'Quiz' as const })),
    ]
        .sort((a, b) => {
            if (!a.due_at) return 1
            if (!b.due_at) return -1
            return new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
        })
        .slice(0, 6)

    const maxActivities = Math.max(1, ...weekly.days.map((day) => day.activities))

    return (
        <StudentLayout
            student={student}
            stats={stats}
            title="Student Dashboard"
            searchCourses={searchCourses}
            searchAssignments={assignments}
            searchQuizzes={quizzes}
        >
                        <section className="relative isolate overflow-hidden rounded-[26px] bg-[#10213f] p-6 text-white shadow-[0_18px_45px_rgba(21,84,192,0.14)] sm:p-8 lg:p-9">
                            <style>{`
                                @keyframes flevianLiveGradient {
                                    0% { background-position: 0% 50%; }
                                    50% { background-position: 100% 50%; }
                                    100% { background-position: 0% 50%; }
                                }
                                @keyframes flevianAuroraOne {
                                    0%, 100% { transform: translate3d(-12px, -8px, 0) scale(1); }
                                    50% { transform: translate3d(58px, 28px, 0) scale(1.22); }
                                }
                                @keyframes flevianAuroraTwo {
                                    0%, 100% { transform: translate3d(22px, -18px, 0) scale(1); }
                                    50% { transform: translate3d(-55px, 36px, 0) scale(1.18); }
                                }
                                @keyframes flevianAuroraThree {
                                    0%, 100% { transform: translate3d(0, 22px, 0) scale(1); }
                                    50% { transform: translate3d(-25px, -28px, 0) scale(1.2); }
                                }
                                @media (prefers-reduced-motion: reduce) {
                                    .flevian-live-gradient,
                                    .flevian-aurora {
                                        animation: none !important;
                                    }
                                }
                            `}</style>

                            <div
                                className="flevian-live-gradient pointer-events-none absolute -inset-[35%] opacity-100"
                                style={{
                                    background:
                                        'linear-gradient(120deg, #10213f 0%, #173b72 25%, #285fc4 48%, #4438a8 68%, #173b72 82%, #10213f 100%)',
                                    backgroundSize: '260% 260%',
                                    animation: 'flevianLiveGradient 18s ease-in-out infinite',
                                }}
                            />
                            <div
                                className="flevian-aurora pointer-events-none absolute -left-28 -top-32 h-80 w-80 rounded-full bg-[#6ba3ff]/35 blur-[70px]"
                                style={{ animation: 'flevianAuroraOne 11s ease-in-out infinite' }}
                            />
                            <div
                                className="flevian-aurora pointer-events-none absolute -right-28 -top-24 h-96 w-96 rounded-full bg-[#7566ff]/30 blur-[80px]"
                                style={{ animation: 'flevianAuroraTwo 14s ease-in-out infinite' }}
                            />
                            <div
                                className="flevian-aurora pointer-events-none absolute -bottom-40 left-[35%] h-80 w-80 rounded-full bg-[#3487ff]/25 blur-[75px]"
                                style={{ animation: 'flevianAuroraThree 16s ease-in-out infinite' }}
                            />
                            <div className="pointer-events-none absolute inset-0 bg-[#071225]/25 backdrop-blur-[2px]" />
                            <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:42px_42px]" />

                            <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
                                <div className="max-w-2xl">
                                    <div className="mb-3 flex items-center gap-2 text-[#a9c7ff]">
                                        <Icon
                                            name="sparkles"
                                            className="h-4 w-4"
                                        />
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                                            Student Dashboard
                                        </span>
                                    </div>

                                    <h1 className="text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
                                        Welcome back, {firstName}.
                                    </h1>

                                    <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100/80">
                                        Keep building your learning streak,
                                        complete your courses and stay ahead of
                                        upcoming assessments.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 sm:min-w-[270px]">
                                    <div className="rounded-2xl border border-white/[0.14] bg-white/[0.09] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-lg">
                                        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-blue-100/70">
                                            Total points
                                        </p>
                                        <p className="mt-2 text-2xl font-bold">
                                            {stats.points.total}
                                        </p>
                                        <p className="mt-1 text-[10px] text-blue-100/60">
                                            earned across learning
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-white/[0.14] bg-white/[0.09] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-lg">
                                        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-blue-100/70">
                                            Current streak
                                        </p>
                                        <p className="mt-2 flex items-center gap-1.5 text-2xl font-bold">
                                            <Icon
                                                name="flame"
                                                className="h-5 w-5 text-orange-300"
                                            />
                                            {stats.streak.current}
                                        </p>
                                        <p className="mt-1 text-[10px] text-blue-100/60">
                                            consecutive days
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <StatCard
                                icon="book"
                                label="Active courses"
                                value={stats.courses.active}
                                detail={`${stats.courses.completed} completed course${stats.courses.completed === 1 ? '' : 's'}`}
                            />

                            <StatCard
                                icon="chart"
                                label="Overall progress"
                                value={`${stats.progress.percentage}%`}
                                detail={`${stats.progress.completed_lessons} of ${stats.progress.tracked_lessons} tracked lessons completed`}
                                progress={stats.progress.percentage}
                            />

                            <StatCard
                                icon="sparkles"
                                label="Learning points"
                                value={stats.points.total}
                                detail={`${weekly.total_points} point${weekly.total_points === 1 ? '' : 's'} earned this week`}
                            />

                            <StatCard
                                icon="flame"
                                label="Best streak"
                                value={stats.streak.longest}
                                detail="consecutive learning days"
                            />
                        </section>

                        <section className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_0.95fr]">
                            <Card className="p-5 sm:p-6">
                                <SectionHeader
                                    title="Weekly progress"
                                    description="Your learning activity over the last seven days"
                                    action={
                                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                            {weekly.total_activities}{' '}
                                            activit
                                            {weekly.total_activities === 1
                                                ? 'y'
                                                : 'ies'}
                                        </span>
                                    }
                                />

                                {weekly.days.length ? (
                                    <div className="mt-6">
                                        {weekly.total_activities === 0 ? (
                                            <div className="relative overflow-hidden rounded-2xl border border-dashed border-[#dbe5f3] bg-gradient-to-br from-[#f8fbff] via-white to-[#f7f5ff] px-5 py-6 dark:border-slate-800 dark:from-[#101827] dark:via-[#111b2d] dark:to-[#17152d]">
                                                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#edf4ff]/70 to-transparent dark:from-[#172945]/30" />
                                                <div className="relative">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#d7e2f2] dark:to-[#263a5a]" />
                                                        <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-300 dark:text-slate-600">
                                                            This week
                                                        </span>
                                                        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#d7e2f2] dark:to-[#263a5a]" />
                                                    </div>

                                                    <div className="mt-5 flex items-start gap-2 sm:gap-4">
                                                        {weekly.days.map((day) => (
                                                            <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
                                                                <div
                                                                    className="h-3.5 w-3.5 rounded-full border-2 border-[#b9ccef] bg-white shadow-[0_0_0_3px_rgba(185,204,239,0.15)] dark:border-[#35527d] dark:bg-[#15243b]"
                                                                    title={`${day.label}: no activity`}
                                                                />
                                                                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                                                                    {day.label}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="mx-auto mt-5 flex max-w-md items-center justify-center gap-3 rounded-xl bg-white/80 px-4 py-3 text-center ring-1 ring-[#e5ebf5] backdrop-blur-sm dark:bg-[#0d1626]/75 dark:ring-slate-800">
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#6ba3ff]">
                                                            <Icon name="chart" className="h-4 w-4" />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                                                                No learning activity yet
                                                            </p>
                                                            <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
                                                                Complete a lesson, quiz or assignment and your progress will appear here.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <div className="flex h-48 items-end gap-2 border-b border-slate-100 px-1 pb-0 sm:gap-4 dark:border-slate-800">
                                                    {weekly.days.map((day) => {
                                                        const height = Math.max(
                                                            10,
                                                            Math.round((day.activities / maxActivities) * 100),
                                                        )
                                                        return (
                                                            <div key={day.date} className="group flex h-full flex-1 flex-col justify-end">
                                                                <div className="mb-2 text-center text-[10px] font-semibold text-slate-400 opacity-0 transition group-hover:opacity-100">
                                                                    {day.points} pts
                                                                </div>
                                                                <div
                                                                    className="w-full rounded-t-xl bg-gradient-to-t from-[#1554c0] to-[#6ba3ff] opacity-90 transition-all duration-500 group-hover:opacity-100"
                                                                    style={{ height: `${height}%` }}
                                                                    title={`${day.activities} activities · ${day.points} points`}
                                                                />
                                                            </div>
                                                        )
                                                    })}
                                                </div>

                                                <div className="mt-3 flex gap-2 sm:gap-4">
                                                    {weekly.days.map((day) => (
                                                        <div key={day.date} className="flex-1 text-center text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                                            {day.label}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-5 grid grid-cols-2 gap-3">
                                            <div className="rounded-xl bg-slate-50/80 p-3 dark:bg-slate-900/70">
                                                <p className="text-[10px] uppercase tracking-[0.1em] text-slate-400">Activities</p>
                                                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{weekly.total_activities}</p>
                                            </div>
                                            <div className="rounded-xl bg-slate-50/80 p-3 dark:bg-slate-900/70">
                                                <p className="text-[10px] uppercase tracking-[0.1em] text-slate-400">Points this week</p>
                                                <p className="mt-1 text-sm font-bold text-[#1554c0] dark:text-[#6ba3ff]">{weekly.total_points}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <EmptyState
                                        icon="chart"
                                        title="Your weekly activity will appear here"
                                        description="Complete lessons, quizzes and assignments to build your learning activity history."
                                    />
                                )}
                            </Card>

                            <Card className="p-5 sm:p-6">
                                <SectionHeader
                                    title="Upcoming work"
                                    description="What needs your attention next"
                                    action={
                                        <span className="rounded-full bg-[#1554c0]/[0.07] px-3 py-1.5 text-[10px] font-semibold text-[#1554c0] dark:bg-[#4c8dff]/10 dark:text-[#6ba3ff]">
                                            {upcomingWork.length} items
                                        </span>
                                    }
                                />

                                {upcomingWork.length ? (
                                    <div className="space-y-2">
                                        {upcomingWork.map((item) => (
                                            <Link
                                                key={`${item.kind}-${item.id}`}
                                                href={
                                                    item.kind === 'Assignment'
                                                        ? `/assignments/${item.id}`
                                                        : `/quizzes/${item.id}`
                                                }
                                                className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-[#c9d8ef] hover:bg-slate-50 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                                            >
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1554c0]/[0.07] text-[#1554c0] dark:bg-[#4c8dff]/10 dark:text-[#6ba3ff]">
                                                    <Icon
                                                        name={
                                                            item.kind ===
                                                            'Assignment'
                                                                ? 'assignment'
                                                                : 'quiz'
                                                        }
                                                        className="h-4 w-4"
                                                    />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                                                        {item.title}
                                                    </p>
                                                    <p className="mt-0.5 truncate text-[10px] text-slate-500 dark:text-slate-400">
                                                        {item.course ?? 'Course'}
                                                    </p>
                                                </div>

                                                <div className="shrink-0 text-right">
                                                    <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-200">
                                                        {formatDate(item.due_at)}
                                                    </p>
                                                    <p className="mt-0.5 text-[9px] text-slate-400">
                                                        {item.kind}
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState
                                        icon="calendar"
                                        title="You are all caught up"
                                        description="No upcoming assignments or quizzes require your attention right now."
                                    />
                                )}
                            </Card>
                        </section>

                        <section className="mt-8">
                            <SectionHeader
                                title="Continue learning"
                                description="Pick up where you left off"
                                action={
                                    <Link
                                        href="/courses"
                                        className="hidden items-center gap-1 text-xs font-semibold text-[#1554c0] hover:underline dark:text-[#6ba3ff] sm:flex"
                                    >
                                        View all courses
                                        <Icon
                                            name="arrow"
                                            className="h-3.5 w-3.5"
                                        />
                                    </Link>
                                }
                            />

                            {courses.length ? (
                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    {courses.slice(0, 6).map((course) => {
                                        const thumbnail = assetUrl(
                                            course.thumbnail_path,
                                        )

                                        return (
                                            <Card
                                                key={course.id}
                                                className="overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[0_15px_40px_rgba(23,32,51,0.08)]"
                                            >
                                                <div className="relative h-36 overflow-hidden bg-gradient-to-br from-[#eaf1ff] to-[#f5f2ff] dark:from-[#15213a] dark:to-[#1b1832]">
                                                    {thumbnail ? (
                                                        <img
                                                            src={thumbnail}
                                                            alt=""
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full items-center justify-center text-[#1554c0]/25 dark:text-[#6ba3ff]/25">
                                                            <Icon
                                                                name="book"
                                                                className="h-14 w-14"
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/35 to-transparent" />

                                                    <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#1554c0] backdrop-blur dark:bg-slate-950/80 dark:text-[#6ba3ff]">
                                                        {course.level}
                                                    </div>

                                                    {course.progress === 100 ? (
                                                        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[9px] font-bold text-white">
                                                            <Icon
                                                                name="check"
                                                                className="h-3 w-3"
                                                            />
                                                            Complete
                                                        </div>
                                                    ) : null}
                                                </div>

                                                <div className="p-5">
                                                    <p className="text-[10px] font-medium text-slate-400">
                                                        {course.category ??
                                                            'Learning'}
                                                    </p>

                                                    <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-slate-900 dark:text-white">
                                                        {course.title}
                                                    </h3>

                                                    <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                                                        {course.completed_lessons}{' '}
                                                        of{' '}
                                                        {course.total_lessons}{' '}
                                                        lessons completed
                                                    </p>

                                                    <div className="mt-4">
                                                        <div className="flex items-center justify-between text-[10px] font-semibold">
                                                            <span className="text-slate-400">
                                                                Progress
                                                            </span>
                                                            <span className="text-[#1554c0] dark:text-[#6ba3ff]">
                                                                {
                                                                    course.progress
                                                                }
                                                                %
                                                            </span>
                                                        </div>

                                                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                            <div
                                                                className="h-full rounded-full bg-gradient-to-r from-[#1554c0] to-[#6a5cff]"
                                                                style={{
                                                                    width: `${course.progress}%`,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <Link
                                                        href={`/courses/${course.slug}`}
                                                        className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-[#1554c0] hover:text-white dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-[#4c8dff] dark:hover:text-[#07101f]"
                                                    >
                                                        {course.progress === 0
                                                            ? 'Start course'
                                                            : course.progress ===
                                                                100
                                                              ? 'Review course'
                                                              : 'Continue course'}

                                                        <Icon
                                                            name="arrow"
                                                            className="h-3.5 w-3.5"
                                                        />
                                                    </Link>
                                                </div>
                                            </Card>
                                        )
                                    })}
                                </div>
                            ) : (
                                <EmptyState
                                    icon="book"
                                    title="No active courses yet"
                                    description="Once you enroll in a course, your active learning journey and lesson progress will appear here."
                                    action={
                                        <Link
                                            href="/courses"
                                            className="inline-flex items-center gap-2 rounded-xl bg-[#1554c0] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#1048a8]"
                                        >
                                            Explore courses
                                            <Icon
                                                name="arrow"
                                                className="h-3.5 w-3.5"
                                            />
                                        </Link>
                                    }
                                />
                            )}
                        </section>

                        <section className="mt-8 grid gap-6 lg:grid-cols-2">
                            <Card className="p-5 sm:p-6">
                                <SectionHeader
                                    title="Recommended for you"
                                    description="Courses matched to your selected learning interests"
                                    action={
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1554c0]/[0.07] text-[#1554c0] dark:bg-[#4c8dff]/10 dark:text-[#6ba3ff]">
                                            <Icon
                                                name="sparkles"
                                                className="h-4 w-4"
                                            />
                                        </div>
                                    }
                                />

                                {recommendedCourses.length ? (
                                    <div className="space-y-3">
                                        {recommendedCourses
                                            .slice(0, 5)
                                            .map((course) => {
                                                const thumbnail = assetUrl(
                                                    course.thumbnail_path,
                                                )

                                                return (
                                                    <Link
                                                        key={course.id}
                                                        href={`/courses/${course.slug}`}
                                                        className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-[#c9d8ef] hover:bg-slate-50 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                                                    >
                                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#edf3ff] text-[#1554c0] dark:bg-[#17243c] dark:text-[#6ba3ff]">
                                                            {thumbnail ? (
                                                                <img
                                                                    src={
                                                                        thumbnail
                                                                    }
                                                                    alt=""
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            ) : (
                                                                <Icon
                                                                    name="book"
                                                                    className="h-5 w-5"
                                                                />
                                                            )}
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                                                                {course.title}
                                                            </p>
                                                            <p className="mt-1 truncate text-[10px] text-slate-500 dark:text-slate-400">
                                                                {course.category ??
                                                                    'Course'}{' '}
                                                                ·{' '}
                                                                {course.level}
                                                            </p>
                                                        </div>

                                                        <span className="shrink-0 rounded-full bg-[#1554c0]/[0.07] px-2 py-1 text-[9px] font-semibold text-[#1554c0] dark:bg-[#4c8dff]/10 dark:text-[#6ba3ff]">
                                                            View
                                                        </span>
                                                    </Link>
                                                )
                                            })}
                                    </div>
                                ) : (
                                    <EmptyState
                                        icon="sparkles"
                                        title="Recommendations are building"
                                        description="Select learning interests during onboarding and publish courses to receive personalized recommendations."
                                    />
                                )}
                            </Card>

                            <Card className="p-5 sm:p-6">
                                <SectionHeader
                                    title="Achievements"
                                    description="Milestones you have unlocked"
                                    action={
                                        <Link
                                            href="/achievements"
                                            className="text-xs font-semibold text-[#1554c0] dark:text-[#6ba3ff]"
                                        >
                                            View all
                                        </Link>
                                    }
                                />

                                {earnedAchievements.length ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        {earnedAchievements
                                            .slice(0, 4)
                                            .map((achievement) => (
                                                <div
                                                    key={achievement.id}
                                                    className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/40"
                                                >
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                                                        <Icon
                                                            name="trophy"
                                                            className="h-4 w-4"
                                                        />
                                                    </div>

                                                    <p className="mt-3 line-clamp-1 text-xs font-semibold text-slate-800 dark:text-slate-100">
                                                        {achievement.name}
                                                    </p>

                                                    <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
                                                        {achievement.description}
                                                    </p>

                                                    <p className="mt-2 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                                        +{achievement.points} pts
                                                    </p>
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <EmptyState
                                        icon="trophy"
                                        title="Your first achievement is waiting"
                                        description="Complete learning activities and milestones to unlock achievements and earn points."
                                    />
                                )}
                            </Card>
                        </section>

                        <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                            <Card className="p-5 sm:p-6">
                                <SectionHeader
                                    title="Recent activity"
                                    description="Your latest learning actions"
                                />

                                {activities.length ? (
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {activities.slice(0, 8).map((activity) => {
                                            const title =
                                                activity.lesson ??
                                                activity.assignment ??
                                                activity.quiz ??
                                                activity.course ??
                                                'Learning activity'

                                            const icon: IconName =
                                                activity.type === 'quiz'
                                                    ? 'quiz'
                                                    : activity.type ===
                                                        'assignment'
                                                      ? 'assignment'
                                                      : 'book'

                                            return (
                                                <div
                                                    key={activity.id}
                                                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                                                >
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1554c0]/[0.07] text-[#1554c0] dark:bg-[#4c8dff]/10 dark:text-[#6ba3ff]">
                                                        <Icon
                                                            name={icon}
                                                            className="h-4 w-4"
                                                        />
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                                                            {title}
                                                        </p>

                                                        <p className="mt-0.5 truncate text-[10px] text-slate-500 dark:text-slate-400">
                                                            {activity.course ??
                                                                'Learning activity'}{' '}
                                                            ·{' '}
                                                            {formatDateTime(
                                                                activity.occurred_at,
                                                            )}
                                                        </p>
                                                    </div>

                                                    <span className="shrink-0 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                                        {activity.points > 0
                                                            ? `+${activity.points}`
                                                            : '—'}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <EmptyState
                                        icon="clock"
                                        title="No recent activity"
                                        description="Your latest lesson, assignment and quiz activity will appear here."
                                    />
                                )}
                            </Card>

                            <Card className="p-5 sm:p-6">
                                <SectionHeader
                                    title="Leaderboard"
                                    description="Points earned across the LMS"
                                    action={
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                                            <Icon
                                                name="trophy"
                                                className="h-4 w-4"
                                            />
                                        </div>
                                    }
                                />

                                <div className="mb-4 rounded-2xl bg-gradient-to-r from-[#f2f6ff] to-[#f7f4ff] p-4 dark:from-[#121e33] dark:to-[#18152f]">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
                                                Your position
                                            </p>
                                            <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
                                                {board.rank
                                                    ? `#${board.rank}`
                                                    : '—'}
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
                                                Points
                                            </p>
                                            <p className="mt-1 text-lg font-bold text-[#1554c0] dark:text-[#6ba3ff]">
                                                {board.total_points}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {board.top_students.length ? (
                                    <div className="space-y-2">
                                        {board.top_students
                                            .slice(0, 5)
                                            .map((entry) => (
                                                <div
                                                    key={entry.user_id}
                                                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                                                        entry.user_id ===
                                                        student.id
                                                            ? 'bg-[#1554c0]/[0.06] ring-1 ring-[#1554c0]/10 dark:bg-[#4c8dff]/10 dark:ring-[#4c8dff]/20'
                                                            : ''
                                                    }`}
                                                >
                                                    <span className="w-5 text-center text-[10px] font-bold text-slate-400">
                                                        {entry.rank}
                                                    </span>

                                                    {entry.avatar_path ? (
                                                        <img
                                                            src={
                                                                assetUrl(
                                                                    entry.avatar_path,
                                                                ) ?? ''
                                                            }
                                                            alt=""
                                                            className="h-8 w-8 rounded-lg object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                            {initials(
                                                                entry.name ??
                                                                    'Student',
                                                            )}
                                                        </div>
                                                    )}

                                                    <p className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                                                        {entry.name ??
                                                            'Student'}
                                                    </p>

                                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                                        {entry.points}
                                                    </span>
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <EmptyState
                                        icon="chart"
                                        title="Leaderboard is waiting for activity"
                                        description="Earn learning points to appear on the leaderboard."
                                    />
                                )}
                            </Card>
                        </section>
        </StudentLayout>
    )
}
