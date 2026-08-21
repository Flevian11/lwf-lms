import { Head, Link } from '@inertiajs/react'
import StudentLayout from '../Components/StudentLayout'
import { Card, Icon, formatDateTime } from '../Components/StudentUI'
import type { DashboardStats, Student } from '../Components/student-types'

interface QuizData {
    id: number
    title: string
    description: string | null
    course: { id: number; title: string; slug: string; thumbnail_path: string | null }
    passing_score: number
    time_limit_minutes: number | null
}

interface Attempt {
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

interface Answer {
    question_id: number
    question: string | null
    type: string | null
    points: number | null
    selected_option_id: number | null
    selected_option_ids: number[]
    selected_option_text: string | null
    selected_option_texts: string[]
    is_correct: boolean | null
    points_awarded: number
    explanation: string | null
}

interface Props {
    student: Student
    stats: DashboardStats
    quiz: QuizData
    attempt: Attempt
    answers: Answer[]
}

function terminationLabel(reason: string | null): string {
    if (reason === 'time_expired') return 'Automatically submitted when time expired'
    if (reason === 'three_violations') return 'Automatically submitted after three security violations'
    return 'Submitted by student'
}

export default function QuizResult({ student, stats, quiz, attempt, answers }: Props) {
    const percentage = attempt.percentage ?? 0

    return (
        <StudentLayout student={student} stats={stats} title={`${quiz.title} · Result`}>
            <Head title={`${quiz.title} · Result`} />
            <div className="w-full">
                <Link href={`/quizzes/${quiz.id}`} className="text-xs font-semibold text-[#1554c0] dark:text-[#6ba3ff]">← Back to quiz</Link>

                <Card className="mt-5 overflow-hidden p-0">
                    <div className={`p-6 sm:p-8 ${attempt.passed ? 'bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-950/30 dark:to-[#111827]' : 'bg-gradient-to-r from-amber-50 to-white dark:from-amber-950/20 dark:to-[#111827]'}`}>
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Quiz result</p>
                                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{quiz.title}</h1>
                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Attempt {attempt.attempt_number} · {terminationLabel(attempt.termination_reason)}</p>
                            </div>
                            <div className="text-left sm:text-right">
                                <p className="text-4xl font-black tracking-tight text-slate-950 dark:text-white">{attempt.score ?? 0}<span className="text-base font-semibold text-slate-400"> / {attempt.max_score ?? 0}</span></p>
                                <p className={`mt-1 text-xs font-bold ${attempt.passed ? 'text-emerald-600 dark:text-emerald-300' : 'text-amber-600 dark:text-amber-300'}`}>{Number(percentage).toFixed(0)}% · {attempt.passed ? 'Passed' : 'Not passed'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 border-t border-slate-100 dark:border-slate-800 sm:grid-cols-4">
                        <Meta label="Pass mark" value={`${quiz.passing_score}%`} />
                        <Meta label="Submitted" value={formatDateTime(attempt.submitted_at)} />
                        <Meta label="Security violations" value={`${attempt.violation_count}`} />
                        <Meta label="Status" value="Graded" />
                    </div>
                </Card>

                <div className="mt-5">
                    <div className="mb-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#1554c0] dark:text-[#6ba3ff]">Answer review</p>
                        <h2 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">Your responses</h2>
                    </div>
                    <div className="space-y-3">
                        {answers.map((answer, index) => (
                            <Card key={answer.question_id} className="p-5">
                                <div className="flex items-start gap-3">
                                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${answer.is_correct ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' : 'bg-red-500/10 text-red-600 dark:text-red-300'}`}>
                                        <Icon name={answer.is_correct ? 'check' : 'x'} className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-3">
                                            <h3 className="text-sm font-bold leading-6 text-slate-900 dark:text-white">{index + 1}. {answer.question}</h3>
                                            <span className="shrink-0 text-[10px] font-bold text-slate-500">{answer.points_awarded} / {answer.points ?? 0}</span>
                                        </div>
                                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                            {answer.selected_option_texts.length ? answer.selected_option_texts.join(' · ') : 'No answer selected'}
                                        </p>
                                        {answer.explanation ? (
                                            <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] leading-5 text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                                                {answer.explanation}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </StudentLayout>
    )
}

function Meta({ label, value }: { label: string; value: string }) {
    return <div className="p-4 sm:px-5"><p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">{label}</p><p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">{value}</p></div>
}
