import { Head, Link, router } from '@inertiajs/react'
import { useState } from 'react'
import StudentLayout from '../Components/StudentLayout'
import { Card, EmptyState, Icon, SectionHeader, formatDate } from '../Components/StudentUI'
import type { DashboardStats, Student } from '../Components/student-types'

interface LatestAttempt {
    id: number
    attempt_number: number
    status: string
    score: number | null
    max_score: number | null
    percentage: number | string | null
    passed: boolean | null
    started_at: string | null
    submitted_at: string | null
    graded_at: string | null
    violation_count: number
    termination_reason: string | null
}

interface QuizItem {
    id: number
    title: string
    description: string | null
    course: string | null
    course_slug: string | null
    thumbnail_path: string | null
    question_count: number
    time_limit_minutes: number | null
    passing_score: number
    max_attempts: number | null
    attempts_used: number
    due_at: string | null
    available_from: string | null
    latest_attempt: LatestAttempt | null
    is_passed: boolean
    attempts_exhausted: boolean
}

interface Props {
    student: Student
    stats: DashboardStats
    quizzes?: QuizItem[]
}

function status(item: QuizItem): string {
    if (item.is_passed) return 'Passed'
    if (item.attempts_exhausted) return 'Attempts exhausted'
    if (item.latest_attempt?.status === 'in_progress') return 'In progress'
    if (item.latest_attempt?.status === 'graded') return 'Available'
    return 'Not started'
}

function statusTone(item: QuizItem): string {
    if (item.is_passed) return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    if (item.latest_attempt?.status === 'in_progress') return 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
    if (item.attempts_exhausted) return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
    return 'bg-[#1554c0]/[0.07] text-[#1554c0] dark:bg-[#4c8dff]/10 dark:text-[#6ba3ff]'
}

function actionLabel(item: QuizItem): string {
    if (item.is_passed || item.attempts_exhausted) return 'View result'
    if (item.latest_attempt?.status === 'in_progress') return 'Continue quiz'
    return item.attempts_used > 0 ? 'Try again' : 'Start quiz'
}

export default function Quizzes({ student, stats, quizzes = [] }: Props) {
    const current = quizzes.filter((item) => !item.is_passed && !item.attempts_exhausted)
    const completed = quizzes.filter((item) => item.is_passed || item.attempts_exhausted)
    const attempted = quizzes.filter((item) => item.attempts_used > 0)
    const passed = quizzes.filter((item) => item.is_passed)

    return (
        <StudentLayout student={student} stats={stats} title="Quizzes">
            <Head title="Quizzes" />

            <div className="w-full">
                <div className="mb-6">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1554c0]">
                        Learning assessments
                    </p>
                    <h1 className="mt-1.5 text-2xl font-bold tracking-[-0.03em] text-slate-950 dark:text-white sm:text-3xl">
                        Quizzes
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                        Take secure assessments, keep your answers saved automatically and review your results after submission.
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                    <Card className="p-4 sm:p-5">
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Available</p>
                        <p className="mt-1.5 text-2xl font-bold">{quizzes.length}</p>
                        <p className="mt-1 text-[11px] text-slate-500">Available to you</p>
                    </Card>
                    <Card className="p-4 sm:p-5">
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Needs attention</p>
                        <p className="mt-1.5 text-2xl font-bold text-[#1554c0]">{current.length}</p>
                        <p className="mt-1 text-[11px] text-slate-500">Quizzes still to complete</p>
                    </Card>
                    <Card className="p-4 sm:p-5">
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Passed</p>
                        <p className="mt-1.5 text-2xl font-bold">{passed.length}</p>
                        <p className="mt-1 text-[11px] text-slate-500">Successful assessments</p>
                    </Card>
                </div>

                <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.75fr)]">
                    <div className="min-w-0">
                        {current.length ? (
                            <section>
                                <SectionHeader
                                    title="Current quizzes"
                                    description="Your available assessments and anything still requiring your attention."
                                    action={<span className="rounded-full bg-[#1554c0]/[0.07] px-3 py-1.5 text-[10px] font-semibold text-[#1554c0] dark:bg-[#6ba3ff]/10 dark:text-[#8bb8ff]">{current.length} active</span>}
                                />
                                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                                    {current.map((item) => <QuizCard key={item.id} item={item} />)}
                                </div>
                            </section>
                        ) : null}

                        {completed.length ? (
                            <section className={current.length ? 'mt-7' : ''}>
                                <SectionHeader
                                    title="Completed quizzes"
                                    description="Passed assessments and quizzes where no further attempts remain."
                                    action={<span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">{completed.length} completed</span>}
                                />
                                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                                    {completed.map((item) => <QuizCard key={item.id} item={item} />)}
                                </div>
                            </section>
                        ) : null}

                        {!quizzes.length ? (
                            <div>
                                <EmptyState
                                    icon="quiz"
                                    title="No quizzes yet"
                                    description="Published quizzes from courses with active learning access will appear here."
                                />
                            </div>
                        ) : null}
                    </div>

                    <aside className="space-y-4">
                        <Card className="p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Your progress</p>
                                    <h2 className="mt-1 text-lg font-bold tracking-[-0.02em]">Quiz activity</h2>
                                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">A quick view of attempts and successful assessments.</p>
                                </div>
                                <div className="rounded-xl bg-[#edf4ff] px-3 py-2 text-right dark:bg-[#172945]">
                                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#1554c0] dark:text-[#8bb8ff]">Passed</p>
                                    <p className="mt-0.5 text-xl font-bold">{passed.length}</p>
                                </div>
                            </div>
                            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div
                                    className="h-full rounded-full bg-[#1554c0] transition-all dark:bg-[#4c8dff]"
                                    style={{ width: `${quizzes.length ? Math.round((passed.length / quizzes.length) * 100) : 0}%` }}
                                />
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                                <span>{attempted.length} of {quizzes.length} attempted</span>
                                <span>{quizzes.length ? Math.round((passed.length / quizzes.length) * 100) : 0}% passed</span>
                            </div>
                        </Card>

                        <Card className="p-5">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Secure assessment</p>
                            <h2 className="mt-1 text-lg font-bold tracking-[-0.02em]">Before you start</h2>
                            <div className="mt-4 space-y-3">
                                {[
                                    ['fullscreen', 'Stay in the quiz window', 'Leaving fullscreen or the active tab counts as a violation.'],
                                    ['check', 'Answers save automatically', 'Your answers are persisted while the attempt is in progress.'],
                                    ['clock', 'Watch the timer', 'Timed quizzes submit automatically when the server deadline is reached.'],
                                    ['shield', 'Three violations end the attempt', 'The third recorded security violation automatically submits the quiz.'],
                                ].map(([icon, title, description]) => (
                                    <div key={title} className="flex gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900/70">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#8bb8ff]">
                                            <Icon name={icon as any} className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{title}</p>
                                            <p className="mt-0.5 text-[10px] leading-4 text-slate-400">{description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card className="p-5">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Results</p>
                            <h2 className="mt-1 text-lg font-bold tracking-[-0.02em]">What happens after submission</h2>
                            <div className="mt-4 space-y-3">
                                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-900/70">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Attempted</span>
                                    <span className="text-xs font-bold">{attempted.length}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-900/70">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Passed</span>
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{passed.length}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-900/70">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Still available</span>
                                    <span className="text-xs font-bold text-[#1554c0] dark:text-[#8bb8ff]">{current.length}</span>
                                </div>
                            </div>
                            <p className="mt-4 text-[10px] leading-5 text-slate-400">
                                Results are calculated by the server from the quiz answer key. The browser never controls the final score.
                            </p>
                        </Card>
                    </aside>
                </div>

                {quizzes.length ? (
                    <p className="mt-7 text-center text-[10px] text-slate-400">
                        Timed quizzes use a server-controlled deadline, answers are autosaved and completed attempts cannot be edited.
                    </p>
                ) : null}
            </div>
        </StudentLayout>
    )
}

function QuizCard({ item }: { item: QuizItem }) {
    const tone = statusTone(item)
    const label = actionLabel(item)
    const [opening, setOpening] = useState(false)

    const openQuiz = () => {
        if (opening) return
        setOpening(true)

        router.get(`/quizzes/${item.id}`, {}, {
            preserveScroll: true,
            onError: () => setOpening(false),
            onFinish: () => setOpening(false),
        })
    }

    return (
        <Card className="overflow-hidden p-0 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex flex-col gap-4 p-4 sm:p-5">
                <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#6ba3ff]">
                        <Icon name="quiz" className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${tone}`}>{status(item)}</span>
                            {item.latest_attempt?.percentage !== null && item.latest_attempt?.percentage !== undefined ? (
                                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
                                    {Number(item.latest_attempt.percentage).toFixed(0)}%
                                </span>
                            ) : null}
                        </div>
                        <h2 className="mt-2 text-sm font-bold text-slate-950 dark:text-white">{item.title}</h2>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.course ?? 'Course'}</p>
                        {item.description ? (
                            <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-slate-400 dark:text-slate-500">{item.description}</p>
                        ) : null}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-[10px] font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                        <Icon name="quiz" className="h-3.5 w-3.5" />
                        {item.question_count} question{item.question_count === 1 ? '' : 's'}
                    </span>
                    {item.time_limit_minutes ? (
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-[10px] font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                            <Icon name="clock" className="h-3.5 w-3.5" />
                            {item.time_limit_minutes} min
                        </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-[10px] font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                        Pass {item.passing_score}%
                    </span>
                    <button
                        type="button"
                        onClick={openQuiz}
                        disabled={opening}
                        className="ml-auto inline-flex min-w-[108px] items-center justify-center gap-2 rounded-xl bg-[#1554c0] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#1249a8] disabled:cursor-wait disabled:opacity-70"
                    >
                        {opening ? (
                            <>
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-r-transparent" aria-hidden="true" />
                                Opening…
                            </>
                        ) : label}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 border-t border-slate-100 dark:border-slate-800">
                <div className="p-3.5 sm:px-5">
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">Attempts</p>
                    <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {item.attempts_used}{item.max_attempts ? ` / ${item.max_attempts}` : ' used'}
                    </p>
                </div>
                <div className="border-l border-slate-100 p-3.5 dark:border-slate-800 sm:px-5">
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">Deadline</p>
                    <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {item.due_at ? formatDate(item.due_at) : 'No deadline'}
                    </p>
                </div>
            </div>
        </Card>
    )
}
