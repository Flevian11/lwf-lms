import { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import StudentLayout from '../Components/StudentLayout'
import { Card, Icon, formatDateTime } from '../Components/StudentUI'
import type { DashboardStats, Student } from '../Components/student-types'

interface QuizData {
    id: number
    title: string
    description: string | null
    course: { id: number; title: string; slug: string; thumbnail_path: string | null }
    time_limit_minutes: number | null
    passing_score: number
    max_attempts: number | null
    due_at: string | null
    available_from: string | null
    question_count: number
    shuffle_questions: boolean
    shuffle_options: boolean
}

interface AttemptSummary {
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
    expires_at: string | null
    violation_count: number
    termination_reason: string | null
}

interface Props {
    student: Student
    stats: DashboardStats
    quiz: QuizData
    latest_attempt: AttemptSummary | null
    active_attempt: AttemptSummary | null
    attempts_used: number
    violation_limit: number
}


export default function Quiz({ student, stats, quiz, latest_attempt, active_attempt, attempts_used, violation_limit }: Props) {
    const [processing, setProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const start = async () => {
        setError(null)
        setProcessing(true)

        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen()
            }

            if (!document.fullscreenElement) {
                throw new Error('Fullscreen mode is required before this quiz can start.')
            }

            router.post(`/quizzes/${quiz.id}/start`, {}, {
                preserveScroll: true,
                onError: (errors) => {
                    setError(errors.quiz ?? 'The quiz could not be started.')
                    setProcessing(false)
                },
            })
        } catch (exception) {
            setError(exception instanceof Error ? exception.message : 'Fullscreen mode is required before this quiz can start.')
            setProcessing(false)
        }
    }

    const canTry = !active_attempt && !(quiz.max_attempts !== null && attempts_used >= quiz.max_attempts) && !latest_attempt?.passed

    return (
        <StudentLayout student={student} stats={stats} title={quiz.title}>
            <Head title={quiz.title} />
            <div className="w-full">
                <Link href="/quizzes" className="inline-flex items-center gap-2 text-xs font-semibold text-[#1554c0] dark:text-[#6ba3ff]">
                    <span>←</span> Back to quizzes
                </Link>

                <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.75fr)]">
                    <Card className="overflow-hidden p-0">
                        <div className="border-b border-slate-100 bg-gradient-to-r from-[#edf4ff] via-white to-[#f7f4ff] p-6 dark:border-slate-800 dark:from-[#14243d] dark:via-[#111827] dark:to-[#19152f] sm:p-8">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#1554c0] shadow-sm dark:bg-slate-900 dark:text-[#6ba3ff]">
                                <Icon name="quiz" className="h-6 w-6" />
                            </div>
                            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#1554c0] dark:text-[#6ba3ff]">Secure assessment</p>
                            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{quiz.title}</h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{quiz.description ?? 'Complete this assessment under secure quiz mode.'}</p>
                        </div>

                        <div className="p-6 sm:p-8">
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                                <div className="flex gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                                        <Icon name="shield" className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-amber-900 dark:text-amber-200">Secure quiz mode</p>
                                        <p className="mt-1 text-[11px] leading-5 text-amber-800 dark:text-amber-300">
                                            The quiz requires fullscreen mode. Leaving the quiz tab or exiting fullscreen is recorded as a violation. At {violation_limit} violations, the attempt is automatically submitted.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {error ? (
                                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
                                    {error}
                                </div>
                            ) : null}

                            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                <Info label="Questions" value={`${quiz.question_count}`} icon="quiz" />
                                <Info label="Time limit" value={quiz.time_limit_minutes ? `${quiz.time_limit_minutes} minutes` : 'No time limit'} icon="clock" />
                                <Info label="Pass mark" value={`${quiz.passing_score}%`} icon="target" />
                                <Info label="Attempts" value={quiz.max_attempts ? `${attempts_used} of ${quiz.max_attempts} used` : `${attempts_used} used · unlimited`} icon="chart" />
                            </div>

                            <div className="mt-6 flex flex-wrap items-center gap-3">
                                {active_attempt ? (
                                    <button
                                        type="button"
                                        onClick={start}
                                        disabled={processing}
                                        className="rounded-xl bg-[#1554c0] px-5 py-3 text-xs font-bold text-white shadow-lg shadow-[#1554c0]/20 transition hover:bg-[#1249a8] disabled:opacity-50"
                                    >
                                        {processing ? <span className="inline-flex items-center gap-2"><Spinner /> Opening secure mode…</span> : 'Continue quiz'}
                                    </button>
                                ) : latest_attempt?.status !== 'in_progress' && latest_attempt?.submitted_at && (latest_attempt.passed || quiz.max_attempts === attempts_used) ? (
                                    <Link href={`/quizzes/${quiz.id}/attempts/${latest_attempt.id}/result`} className="rounded-xl border border-slate-200 px-5 py-3 text-xs font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                                        View latest result
                                    </Link>
                                ) : canTry ? (
                                    <button
                                        type="button"
                                        onClick={start}
                                        disabled={processing}
                                        className="rounded-xl bg-[#1554c0] px-5 py-3 text-xs font-bold text-white shadow-lg shadow-[#1554c0]/20 transition hover:bg-[#1249a8] disabled:opacity-50"
                                    >
                                        {processing ? <span className="inline-flex items-center gap-2"><Spinner /> Opening secure mode…</span> : attempts_used ? 'Start another attempt' : 'Start secure quiz'}
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    </Card>

                    <div className="space-y-4">
                        <Card className="p-5">
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Assessment rules</p>
                            <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                                <Rule icon="shield" text="Fullscreen mode is required during the attempt." />
                                <Rule icon="clock" text="The server controls the official countdown and expiry." />
                                <Rule icon="check" text="Answers are saved to the server automatically." />
                                <Rule icon="target" text={`Three security violations automatically submit the attempt.`} />
                            </div>
                        </Card>

                        {quiz.due_at ? (
                            <Card className="p-5">
                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Deadline</p>
                                <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{formatDateTime(quiz.due_at)}</p>
                                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">A new attempt cannot be started after the deadline.</p>
                            </Card>
                        ) : null}
                    </div>
                </div>
            </div>

            {processing ? (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-md" role="status" aria-live="polite">
                    <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-950 p-7 text-center shadow-2xl">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1554c0]/15">
                            <Spinner className="h-6 w-6 text-[#6ba3ff]" />
                        </div>
                        <h2 className="mt-5 text-base font-bold text-white">Preparing your secure quiz</h2>
                        <p className="mt-2 text-xs leading-5 text-slate-400">Entering fullscreen mode and opening your protected attempt. Please wait.</p>
                        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-800">
                            <div className="h-full w-2/3 animate-pulse rounded-full bg-[#1554c0]" />
                        </div>
                    </div>
                </div>
            ) : null}
        </StudentLayout>
    )
}

function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
    return <span className={`${className} animate-spin rounded-full border-2 border-current border-r-transparent`} aria-hidden="true" />
}

function Info({ label, value, icon }: { label: string; value: string; icon: 'quiz' | 'clock' | 'target' | 'chart' }) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3.5 dark:border-slate-800">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#6ba3ff]"><Icon name={icon} className="h-4 w-4" /></div>
            <div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">{label}</p><p className="mt-1 text-xs font-bold text-slate-800 dark:text-slate-200">{value}</p></div>
        </div>
    )
}

function Rule({ icon, text }: { icon: 'shield' | 'clock' | 'check' | 'target'; text: string }) {
    return <div className="flex gap-3"><Icon name={icon} className="mt-0.5 h-4 w-4 shrink-0 text-[#1554c0] dark:text-[#6ba3ff]" /><span>{text}</span></div>
}
