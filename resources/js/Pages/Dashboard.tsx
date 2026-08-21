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

    const chartMax = Math.max(1, ...weekly.days.map((day) => day.activities))
    const chartPeak = weekly.days.reduce(
        (peak, day) => (day.activities > peak.activities ? day : peak),
        weekly.days[0] ?? { activities: 0, label: '—', date: '', points: 0 },
    )

    const courseIcon = (course: (typeof courses)[number]): IconName => {
        const category = `${course.category ?? ''} ${course.title}`.toLowerCase()

        if (category.includes('git') || category.includes('version')) return 'chart'
        if (category.includes('javascript') || category.includes('react') || category.includes('frontend')) return 'book'
        if (category.includes('design') || category.includes('ui') || category.includes('ux')) return 'sparkles'
        if (category.includes('database') || category.includes('sql')) return 'chart'
        if (category.includes('python')) return 'book'
        if (category.includes('laravel') || category.includes('php') || category.includes('backend')) return 'book'
        return 'book'
    }

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
                            <Card className="relative overflow-hidden p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
                                            Active courses
                                        </p>
                                        <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
                                            {stats.courses.active}
                                        </p>
                                    </div>
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#6ba3ff]">
                                        <Icon name="book" className="h-5 w-5" />
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center">
                                    {courses.slice(0, 4).map((course, index) => {
                                        const thumbnail = assetUrl(course.thumbnail_path)

                                        return (
                                            <div
                                                key={course.id}
                                                className={`relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[#edf4ff] text-[#1554c0] shadow-sm dark:border-slate-900 dark:bg-[#172945] dark:text-[#6ba3ff] ${index > 0 ? '-ml-2' : ''}`}
                                                title={course.title}
                                            >
                                                {thumbnail ? (
                                                    <img src={thumbnail} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <Icon name={courseIcon(course)} className="h-4 w-4" />
                                                )}
                                            </div>
                                        )
                                    })}

                                    {courses.length > 4 ? (
                                        <div className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-bold text-slate-600 shadow-sm dark:border-slate-900 dark:bg-slate-800 dark:text-slate-300">
                                            +{courses.length - 4}
                                        </div>
                                    ) : null}

                                    <p className="ml-3 min-w-0 truncate text-[10px] leading-4 text-slate-500 dark:text-slate-400">
                                        {courses.length === 1
                                            ? `Focused on ${courses[0].title}`
                                            : courses.length > 1
                                              ? `${courses.length} learning paths in progress`
                                              : 'Your enrolled courses will appear here'}
                                    </p>
                                </div>

                                <p className="mt-3 text-[10px] text-slate-400 dark:text-slate-500">
                                    {stats.courses.completed} completed course{stats.courses.completed === 1 ? '' : 's'}
                                </p>
                            </Card>

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
                                            <div className="relative mt-2">
                                                <div className="mb-4 flex items-end justify-between gap-4">
                                                    <div>
                                                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                            Learning rhythm
                                                        </p>
                                                        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                                                            {chartPeak.activities} activit{chartPeak.activities === 1 ? 'y' : 'ies'} on {chartPeak.label}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-xl bg-[#edf4ff] px-3 py-2 text-right dark:bg-[#172945]">
                                                        <p className="text-[9px] uppercase tracking-[0.1em] text-slate-400">Points</p>
                                                        <p className="mt-0.5 text-sm font-bold text-[#1554c0] dark:text-[#6ba3ff]">{weekly.total_points}</p>
                                                    </div>
                                                </div>

                                                <div className="relative h-64 overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-b from-[#f8fbff] via-white to-[#f6f4ff] dark:border-slate-800 dark:from-[#111b2c] dark:via-[#0f1827] dark:to-[#17152d]">
                                                    <div className="pointer-events-none absolute inset-x-0 top-8 h-px bg-slate-200/70 dark:bg-slate-800" />
                                                    <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-slate-200/60 dark:bg-slate-800/80" />
                                                    <div className="pointer-events-none absolute inset-x-0 bottom-14 h-px bg-slate-200/70 dark:bg-slate-800" />

                                                    <svg
                                                        viewBox="0 0 700 260"
                                                        preserveAspectRatio="none"
                                                        className="absolute inset-x-0 top-0 h-[205px] w-full"
                                                        role="img"
                                                        aria-label="Seven day learning activity chart"
                                                    >
                                                        <defs>
                                                            <linearGradient id="weeklyActivityFill" x1="0" x2="0" y1="0" y2="1">
                                                                <stop offset="0%" stopColor="#1554c0" stopOpacity="0.28" />
                                                                <stop offset="100%" stopColor="#6a5cff" stopOpacity="0.02" />
                                                            </linearGradient>
                                                            <linearGradient id="weeklyActivityBars" x1="0" x2="0" y1="0" y2="1">
                                                                <stop offset="0%" stopColor="#1554c0" stopOpacity="0.22" />
                                                                <stop offset="100%" stopColor="#1554c0" stopOpacity="0.04" />
                                                            </linearGradient>
                                                        </defs>

                                                        {weekly.days.map((day, index) => {
                                                            const x = weekly.days.length > 1 ? 54 + (index / (weekly.days.length - 1)) * 592 : 350
                                                            const barHeight = Math.max(8, (day.activities / chartMax) * 125)
                                                            const barY = 178 - barHeight
                                                            const y = 172 - (day.activities / chartMax) * 128
                                                            const active = day.date === chartPeak.date

                                                            return (
                                                                <g key={day.date}>
                                                                    <rect
                                                                        x={x - 22}
                                                                        y={barY}
                                                                        width="44"
                                                                        height={barHeight}
                                                                        rx="14"
                                                                        fill="url(#weeklyActivityBars)"
                                                                    />
                                                                    <line
                                                                        x1={x}
                                                                        x2={x}
                                                                        y1={y + 8}
                                                                        y2={178}
                                                                        stroke="#1554c0"
                                                                        strokeOpacity={active ? 0.18 : 0.07}
                                                                        strokeWidth="2"
                                                                    />
                                                                    <circle
                                                                        cx={x}
                                                                        cy={y}
                                                                        r={active ? 7 : 5}
                                                                        fill="white"
                                                                        stroke="#1554c0"
                                                                        strokeWidth={active ? 3 : 2}
                                                                    />
                                                                    {active ? (
                                                                        <circle cx={x} cy={y} r="11" fill="#1554c0" fillOpacity="0.08" />
                                                                    ) : null}
                                                                    <text
                                                                        x={x}
                                                                        y={Math.max(18, y - 15)}
                                                                        textAnchor="middle"
                                                                        className="fill-slate-600 text-[12px] font-semibold dark:fill-slate-300"
                                                                    >
                                                                        {day.activities}
                                                                    </text>
                                                                </g>
                                                            )
                                                        })}

                                                        <path
                                                            d={weekly.days.map((day, index) => {
                                                                const x = weekly.days.length > 1 ? 54 + (index / (weekly.days.length - 1)) * 592 : 350
                                                                const y = 172 - (day.activities / chartMax) * 128
                                                                return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
                                                            }).join(' ')}
                                                            fill="none"
                                                            stroke="#1554c0"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="4"
                                                            vectorEffect="non-scaling-stroke"
                                                        />
                                                    </svg>

                                                    <div className="absolute inset-x-4 bottom-3 flex justify-between gap-2">
                                                        {weekly.days.map((day) => (
                                                            <div key={day.date} className="group relative min-w-0 flex-1 text-center">
                                                                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                                                    {day.label}
                                                                </span>
                                                                <span className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[9px] font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100 dark:bg-white dark:text-slate-900">
                                                                    {day.activities} activit{day.activities === 1 ? 'y' : 'ies'} · {day.points} pts
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
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
                                title="My learning"
                                description="Your enrolled courses and current learning status"
                                action={
                                    <Link
                                        href="/courses"
                                        className="hidden items-center gap-1 text-xs font-semibold text-[#1554c0] hover:underline dark:text-[#6ba3ff] sm:flex"
                                    >
                                        View all courses
                                        <Icon name="arrow" className="h-3.5 w-3.5" />
                                    </Link>
                                }
                            />

                            <Card className="mt-4 overflow-hidden">
                                {courses.length ? (
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {courses.slice(0, 6).map((course) => {
                                            const thumbnail = assetUrl(course.thumbnail_path)
                                            const pendingAccess = course.access_granted === false
                                            const completed = course.progress === 100

                                            return (
                                                <div
                                                    key={course.id}
                                                    className="flex flex-col gap-4 p-4 transition hover:bg-slate-50/80 sm:flex-row sm:items-center sm:p-5 dark:hover:bg-slate-900/50"
                                                >
                                                    <div className="flex min-w-0 flex-1 items-center gap-4">
                                                        <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-[#eaf1ff] to-[#f5f2ff] dark:from-[#15213a] dark:to-[#1b1832]">
                                                            {thumbnail ? (
                                                                <img src={thumbnail} alt="" className="h-full w-full object-cover" />
                                                            ) : (
                                                                <div className="flex h-full w-full items-center justify-center text-[#1554c0]/25 dark:text-[#6ba3ff]/25">
                                                                    <Icon name="book" className="h-7 w-7" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400">
                                                                    {course.category ?? 'Learning'}
                                                                </p>
                                                                {pendingAccess ? (
                                                                    <span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.06em] text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                                                                        Pending access
                                                                    </span>
                                                                ) : completed ? (
                                                                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.06em] text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                                                                        Complete
                                                                    </span>
                                                                ) : null}
                                                            </div>

                                                            <h3 className="mt-1 line-clamp-1 text-sm font-semibold text-slate-900 dark:text-white">
                                                                {course.title}
                                                            </h3>

                                                            <div className="mt-2 flex max-w-md items-center gap-3">
                                                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                                    <div
                                                                        className="h-full rounded-full bg-gradient-to-r from-[#1554c0] to-[#6a5cff]"
                                                                        style={{ width: `${course.progress}%` }}
                                                                    />
                                                                </div>
                                                                <span className="shrink-0 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                                                    {course.progress}%
                                                                </span>
                                                            </div>

                                                            <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                                                                {course.completed_lessons} of {course.total_lessons} lessons completed
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex shrink-0 items-center gap-2 sm:w-44 sm:justify-end">
                                                        {pendingAccess ? (
                                                            <span className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                                                                <Icon name="clock" className="h-3.5 w-3.5" />
                                                                Pending access
                                                            </span>
                                                        ) : (
                                                            <Link
                                                                href={`/courses/${course.slug}/learn`}
                                                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1554c0] px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1048a8]"
                                                            >
                                                                {completed ? 'Review course' : course.progress > 0 ? 'Continue learning' : 'Start learning'}
                                                                <Icon name="arrow" className="h-3.5 w-3.5" />
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-5 sm:p-6">
                                        <EmptyState
                                            icon="book"
                                            title="No active courses yet"
                                            description="Once you enroll in a course, your learning journey will appear here."
                                            action={
                                                <Link
                                                    href="/courses"
                                                    className="inline-flex items-center gap-2 rounded-xl bg-[#1554c0] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#1048a8]"
                                                >
                                                    Explore courses
                                                    <Icon name="arrow" className="h-3.5 w-3.5" />
                                                </Link>
                                            }
                                        />
                                    </div>
                                )}
                            </Card>
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
                                                activity.type === 'course_enrollment'
                                                    ? `Enrolled in ${activity.course ?? 'course'}`
                                                    : activity.lesson ??
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
