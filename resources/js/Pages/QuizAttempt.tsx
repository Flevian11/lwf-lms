import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Head, router } from '@inertiajs/react'
import StudentLayout from '../Components/StudentLayout'
import { Card, Icon } from '../Components/StudentUI'
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
    question_count: number
    shuffle_questions: boolean
    shuffle_options: boolean
}

interface Question {
    id: number
    question: string
    type: 'single_choice' | 'multiple_choice' | 'true_false'
    points: number
    position: number
    options: Array<{ id: number; option_text: string; position: number }>
    selected_option_id: number | null
    selected_option_ids: number[]
}

interface Attempt {
    id: number
    attempt_number: number
    status: 'in_progress' | 'graded' | 'submitted'
    started_at: string
    expires_at: string | null
    remaining_seconds: number | null
    violation_count: number
    violation_limit: number
    last_autosaved_at: string | null
}

interface Props {
    student: Student
    stats: DashboardStats
    quiz: QuizData
    attempt: Attempt
    questions: Question[]
}

type AnswerMap = Record<number, number[]>

function csrfToken(): string {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? ''
}

async function postJson<T>(url: string, body: unknown, keepalive = false): Promise<T> {
    const response = await fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        keepalive,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': csrfToken(),
        },
        body: JSON.stringify(body),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
        throw new Error(data?.message ?? data?.errors?.answers?.[0] ?? data?.errors?.quiz?.[0] ?? 'The request could not be completed.')
    }

    return data as T
}

function formatTime(seconds: number | null): string {
    if (seconds === null) return 'No limit'
    const safe = Math.max(0, seconds)
    const hours = Math.floor(safe / 3600)
    const minutes = Math.floor((safe % 3600) / 60)
    const secs = safe % 60
    return hours > 0
        ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        : `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function answersFromQuestions(questions: Question[]): AnswerMap {
    return Object.fromEntries(questions.map((question) => [
        question.id,
        question.selected_option_ids?.length
            ? question.selected_option_ids
            : question.selected_option_id
              ? [question.selected_option_id]
              : [],
    ]))
}

export default function QuizAttempt({ student, stats, quiz, attempt, questions }: Props) {
    const [answers, setAnswers] = useState<AnswerMap>(() => {
        const serverAnswers = answersFromQuestions(questions)

        try {
            const stored = window.localStorage.getItem(`lwf-quiz-attempt-${attempt.id}`)
            if (!stored) return serverAnswers

            const parsed = JSON.parse(stored) as { answers?: AnswerMap }
            return parsed.answers && typeof parsed.answers === 'object'
                ? { ...serverAnswers, ...parsed.answers }
                : serverAnswers
        } catch {
            return serverAnswers
        }
    })
    const [currentIndex, setCurrentIndex] = useState(0)
    const [remaining, setRemaining] = useState<number | null>(attempt.remaining_seconds)
    const [violations, setViolations] = useState(attempt.violation_count)
    const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved')
    const [submitOpen, setSubmitOpen] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [securityMessage, setSecurityMessage] = useState<string | null>(null)
    const [isFullscreen, setIsFullscreen] = useState(() => typeof document !== 'undefined' && Boolean(document.fullscreenElement))

    const answersRef = useRef(answers)
    const submittingRef = useRef(false)
    const violationRef = useRef(false)
    const awayRef = useRef(false)
    const saveTimerRef = useRef<number | null>(null)
    const mountedRef = useRef(true)

    const current = questions[currentIndex]
    const answeredCount = useMemo(() => Object.values(answers).filter((ids) => ids.length > 0).length, [answers])

    useEffect(() => {
        answersRef.current = answers
    }, [answers])

    useEffect(() => {
        try {
            window.localStorage.setItem(
                `lwf-quiz-attempt-${attempt.id}`,
                JSON.stringify({ answers, savedAt: Date.now() }),
            )
        } catch {
            // Local storage is only a recovery layer; server persistence remains authoritative.
        }
    }, [answers, attempt.id])

    const exitFullscreen = useCallback(async () => {
        if (document.fullscreenElement) {
            try {
                await document.exitFullscreen()
            } catch {
                // Browser may already have exited fullscreen.
            }
        }
    }, [])

    const goToResult = useCallback((attemptId = attempt.id) => {
        submittingRef.current = true
        setProcessing(true)
        void exitFullscreen().finally(() => {
            router.visit(`/quizzes/${quiz.id}/attempts/${attemptId}/result`, {
                replace: true,
                preserveScroll: true,
            })
        })
    }, [attempt.id, exitFullscreen, quiz.id])

    const saveAnswers = useCallback(async (payloadAnswers: Array<{ question_id: number; selected_option_ids: number[]; selected_option_id: number | null }>) => {
        if (submittingRef.current || payloadAnswers.length === 0) return

        setSaveState('saving')

        try {
            const response = await postJson<{ ok: boolean; saved_at: string | null; remaining_seconds: number | null; auto_submitted?: boolean; attempt_id?: number }>(
                `/quizzes/${quiz.id}/attempts/${attempt.id}/answers`,
                { answers: payloadAnswers },
            )

            if (response.auto_submitted) {
                goToResult(response.attempt_id ?? attempt.id)
                return
            }

            if (mountedRef.current) {
                setSaveState('saved')
                if (typeof response.remaining_seconds === 'number') {
                    setRemaining(response.remaining_seconds)
                }
            }
        } catch {
            if (mountedRef.current) setSaveState('error')
        }
    }, [attempt.id, goToResult, quiz.id])

    const scheduleSave = useCallback((questionId: number, nextIds: number[]) => {
        if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current)

        saveTimerRef.current = window.setTimeout(() => {
            void saveAnswers([{
                question_id: questionId,
                selected_option_ids: nextIds,
                selected_option_id: nextIds[0] ?? null,
            }])
        }, 350)
    }, [saveAnswers])

    const submitQuiz = useCallback(async (reason: 'manual_submit' | 'time_expired' = 'manual_submit') => {
        if (submittingRef.current || processing) return
        submittingRef.current = true
        setProcessing(true)
        setSaveState('saving')

        try {
            await postJson<{ ok?: boolean }>(
                `/quizzes/${quiz.id}/attempts/${attempt.id}/answers`,
                {
                    answers: Object.entries(answersRef.current).map(([questionId, ids]) => ({
                        question_id: Number(questionId),
                        selected_option_ids: ids,
                        selected_option_id: ids[0] ?? null,
                    })),
                },
            )
        } catch {
            // Final submission endpoint remains authoritative and will receive
            // the same answer snapshot. Autosave failure is not fatal here.
        }

        router.post(`/quizzes/${quiz.id}/attempts/${attempt.id}/submit`, {
            answers: Object.entries(answersRef.current).map(([questionId, ids]) => ({
                question_id: Number(questionId),
                selected_option_ids: ids,
                selected_option_id: ids[0] ?? null,
            })),
        }, {
            preserveScroll: true,
            onSuccess: () => {
                try {
                    window.localStorage.removeItem(`lwf-quiz-attempt-${attempt.id}`)
                } catch {
                    // Ignore local recovery cleanup failures.
                }
            },
            onError: () => {
                submittingRef.current = false
                setProcessing(false)
                setSecurityMessage('The quiz could not be submitted. Your saved answers remain on the server.')
            },
            onFinish: () => {
                if (reason === 'time_expired') {
                    setSecurityMessage('Time expired. Your quiz was submitted automatically.')
                }
            },
        })
    }, [attempt.id, processing, quiz.id])

    const requestSecureFullscreen = useCallback(async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen()
            }
            setIsFullscreen(Boolean(document.fullscreenElement))
            setSecurityMessage(null)
        } catch {
            setSecurityMessage('Fullscreen mode is required to continue this quiz. Click the button again and allow fullscreen when prompted.')
        }
    }, [])

    const registerViolation = useCallback(async (type: 'tab_hidden' | 'window_blur' | 'fullscreen_exit' | 'page_exit') => {
        if (submittingRef.current || violationRef.current) return
        violationRef.current = true

        try {
            const response = await postJson<{
                violation_count: number
                limit: number
                auto_submitted: boolean
                reason: string | null
            }>(
                `/quizzes/${quiz.id}/attempts/${attempt.id}/violation`,
                {
                    type,
                    detail:
                        type === 'tab_hidden'
                            ? 'Quiz document became hidden.'
                            : type === 'window_blur'
                              ? 'Quiz window lost focus.'
                              : type === 'page_exit'
                                ? 'Quiz page was left or unloaded.'
                                : 'Fullscreen mode was exited.',
                    answers: Object.entries(answersRef.current).map(([questionId, ids]) => ({
                        question_id: Number(questionId),
                        selected_option_ids: ids,
                        selected_option_id: ids[0] ?? null,
                    })),
                },
                true,
            )

            if (!mountedRef.current) return

            setViolations(response.violation_count)
            setSecurityMessage(
                response.auto_submitted
                    ? 'The maximum number of security violations was reached. Your quiz was submitted automatically.'
                    : `Security violation recorded (${response.violation_count}/${response.limit}).`,
            )

            if (response.auto_submitted) {
                goToResult()
            }
        } catch {
            if (mountedRef.current) {
                setSecurityMessage('A security event could not be recorded. The quiz remains active; please stay in fullscreen mode.')
            }
        } finally {
            window.setTimeout(() => {
                violationRef.current = false
            }, 1200)
        }
    }, [attempt.id, goToResult, quiz.id])

    useEffect(() => {
        mountedRef.current = true

        const markAway = (type: 'tab_hidden' | 'window_blur') => {
            if (submittingRef.current || awayRef.current) return
            awayRef.current = true
            void registerViolation(type).finally(() => {
                if (document.visibilityState === 'visible' && document.hasFocus()) {
                    awayRef.current = false
                }
            })
        }

        const handleVisibility = () => {
            if (document.hidden) {
                markAway('tab_hidden')
            } else if (document.hasFocus()) {
                awayRef.current = false
            }
        }

        const handleWindowBlur = () => {
            markAway('window_blur')
        }

        const handleWindowFocus = () => {
            if (document.visibilityState === 'visible') {
                awayRef.current = false
            }
            if (!document.fullscreenElement && !submittingRef.current) {
                setIsFullscreen(false)
                setSecurityMessage('Fullscreen mode is required. Click Re-enter fullscreen to continue.')
            }
        }

        const handleFullscreen = () => {
            const active = Boolean(document.fullscreenElement)
            setIsFullscreen(active)
            if (!active && !submittingRef.current) {
                void registerViolation('fullscreen_exit')
            }
        }

        const handlePageHide = () => {
            if (!submittingRef.current && !awayRef.current) {
                awayRef.current = true
                void registerViolation('page_exit')
            }
        }

        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (!submittingRef.current) {
                event.preventDefault()
                event.returnValue = ''
            }
        }

        // Events cover normal browser behavior; this short focus monitor is a
        // fallback for window managers/browsers that do not reliably emit blur.
        const focusMonitor = window.setInterval(() => {
            if (!submittingRef.current && document.visibilityState === 'visible' && !document.hasFocus()) {
                markAway('window_blur')
            }
        }, 500)

        document.addEventListener('visibilitychange', handleVisibility)
        document.addEventListener('fullscreenchange', handleFullscreen)
        window.addEventListener('blur', handleWindowBlur)
        window.addEventListener('focus', handleWindowFocus)
        window.addEventListener('pagehide', handlePageHide)
        window.addEventListener('beforeunload', handleBeforeUnload)

        if (!document.fullscreenElement) {
            setSecurityMessage('Fullscreen mode is required. Click Re-enter fullscreen to continue.')
        }

        return () => {
            mountedRef.current = false
            window.clearInterval(focusMonitor)
            document.removeEventListener('visibilitychange', handleVisibility)
            document.removeEventListener('fullscreenchange', handleFullscreen)
            window.removeEventListener('blur', handleWindowBlur)
            window.removeEventListener('focus', handleWindowFocus)
            window.removeEventListener('pagehide', handlePageHide)
            window.removeEventListener('beforeunload', handleBeforeUnload)
            if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current)
        }
    }, [registerViolation])

    useEffect(() => {
        if (remaining === null || submittingRef.current) return

        const timer = window.setInterval(() => {
            setRemaining((currentRemaining) => {
                if (currentRemaining === null) return null
                const next = Math.max(0, currentRemaining - 1)
                if (next === 0 && !submittingRef.current) {
                    void submitQuiz('time_expired')
                }
                return next
            })
        }, 1000)

        return () => window.clearInterval(timer)
    }, [remaining !== null, submitQuiz])

    useEffect(() => {
        const heartbeat = window.setInterval(async () => {
            if (submittingRef.current) return

            try {
                const response = await postJson<{
                    status: string
                    remaining_seconds: number | null
                    violation_count: number
                    auto_submitted: boolean
                    reason: string | null
                }>(
                    `/quizzes/${quiz.id}/attempts/${attempt.id}/heartbeat`,
                    {},
                )

                if (typeof response.remaining_seconds === 'number') setRemaining(response.remaining_seconds)
                setViolations(response.violation_count)

                if (response.auto_submitted) {
                    goToResult()
                }
            } catch {
                // A transient heartbeat failure does not destroy local answers.
                // The next heartbeat/final submit will retry against the server.
            }
        }, 8000)

        return () => window.clearInterval(heartbeat)
    }, [attempt.id, goToResult, quiz.id])

    const choose = (optionId: number) => {
        if (processing || submittingRef.current) return

        const previous = answers[current.id] ?? []
        const next = current.type === 'multiple_choice'
            ? previous.includes(optionId)
                ? previous.filter((id) => id !== optionId)
                : [...previous, optionId]
            : [optionId]

        setAnswers((currentAnswers) => ({ ...currentAnswers, [current.id]: next }))
        scheduleSave(current.id, next)
    }

    const answered = (questionId: number) => (answers[questionId] ?? []).length > 0
    const timerCritical = remaining !== null && remaining <= 60

    return (
        <div className="min-h-screen bg-[#080d18] text-white">
            <Head title={`${quiz.title} · Secure Quiz`} />

            {!isFullscreen && !processing ? (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 px-4 backdrop-blur-md">
                    <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#111827] p-6 text-center shadow-2xl">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
                            <Icon name="shield" className="h-6 w-6" />
                        </div>
                        <h2 className="mt-4 text-lg font-bold text-white">Fullscreen required</h2>
                        <p className="mt-2 text-xs leading-5 text-slate-400">This assessment cannot continue outside secure fullscreen mode. Leaving fullscreen has been recorded as a security event.</p>
                        <button type="button" onClick={() => void requestSecureFullscreen()} className="mt-5 rounded-xl bg-[#1554c0] px-5 py-3 text-xs font-bold text-white hover:bg-[#1249a8]">Re-enter fullscreen</button>
                    </div>
                </div>
            ) : null}

            <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#0b1220]/95 backdrop-blur-xl">
                <div className="flex w-full items-center justify-between gap-4 px-4 py-3 sm:px-6">
                    <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-white">{quiz.title}</p>
                        <p className="mt-0.5 text-[10px] text-slate-400">Attempt {attempt.attempt_number} · {answeredCount} of {questions.length} answered</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`rounded-xl border px-3 py-2 text-right ${timerCritical ? 'border-red-500/50 bg-red-500/10' : 'border-slate-700 bg-slate-900'}`}>
                            <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-500">Time remaining</p>
                            <p className={`mt-0.5 font-mono text-sm font-bold ${timerCritical ? 'text-red-300' : 'text-white'}`}>{formatTime(remaining)}</p>
                        </div>
                        <div className="hidden rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-right sm:block">
                            <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-500">Security</p>
                            <p className="mt-0.5 text-xs font-bold text-amber-300">{violations}/{attempt.violation_limit}</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="w-full px-4 py-5 sm:px-6">
                {securityMessage ? (
                    <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs font-semibold text-amber-200">
                        {securityMessage}
                    </div>
                ) : null}

                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_250px]">
                    <Card className="min-h-[560px] border-slate-800/80 bg-[#0e1625] dark:border-slate-800/80 dark:from-[#0e1625] dark:via-[#0e1625] dark:to-[#0e1625]">
                        <div className="p-5 sm:p-7">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#6ba3ff]">Question {currentIndex + 1} of {questions.length}</p>
                                    <h1 className="mt-2 text-lg font-bold leading-7 text-white sm:text-xl">{current.question}</h1>
                                </div>
                                <span className="shrink-0 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[9px] font-bold text-slate-400">{current.points} pt{current.points === 1 ? '' : 's'}</span>
                            </div>

                            <p className="mt-3 text-[11px] text-slate-500">
                                {current.type === 'multiple_choice' ? 'Select all answers that apply.' : 'Select one answer.'}
                            </p>

                            <div className="mt-6 space-y-3">
                                {current.options.map((option, index) => {
                                    const selected = (answers[current.id] ?? []).includes(option.id)
                                    return (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => choose(option.id)}
                                            className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${selected ? 'border-[#4c8dff] bg-[#1554c0]/10 shadow-[0_0_0_1px_rgba(76,141,255,0.12)]' : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/60'}`}
                                        >
                                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${selected ? 'bg-[#1554c0] text-white' : 'bg-slate-800 text-slate-400'}`}>
                                                {String.fromCharCode(65 + index)}
                                            </span>
                                            <span className={`pt-1 text-sm leading-6 ${selected ? 'font-semibold text-white' : 'text-slate-300'}`}>{option.option_text}</span>
                                            {selected ? <Icon name="check" className="ml-auto mt-1 h-4 w-4 shrink-0 text-[#6ba3ff]" /> : null}
                                        </button>
                                    )
                                })}
                            </div>

                            <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-800 pt-5">
                                <button type="button" disabled={currentIndex === 0} onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))} className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-300 disabled:cursor-not-allowed disabled:opacity-30">Previous</button>
                                {currentIndex < questions.length - 1 ? (
                                    <button type="button" onClick={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))} className="rounded-xl bg-[#1554c0] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#1249a8]">Next question</button>
                                ) : (
                                    <button type="button" onClick={() => setSubmitOpen(true)} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500">Submit quiz</button>
                                )}
                            </div>
                        </div>
                    </Card>

                    <aside className="space-y-4">
                        <Card className="border-slate-800/80 bg-[#0e1625] p-4 dark:border-slate-800/80 dark:from-[#0e1625] dark:via-[#0e1625] dark:to-[#0e1625]">
                            <div className="flex items-center justify-between">
                                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">Questions</p>
                                <span className="text-[10px] font-bold text-slate-300">{answeredCount}/{questions.length}</span>
                            </div>
                            <div className="mt-3 grid grid-cols-5 gap-2">
                                {questions.map((question, index) => (
                                    <button key={question.id} type="button" onClick={() => setCurrentIndex(index)} className={`h-9 rounded-lg text-[10px] font-bold ${index === currentIndex ? 'bg-[#1554c0] text-white' : answered(question.id) ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-900 text-slate-500 hover:bg-slate-800'}`}>
                                        {index + 1}
                                    </button>
                                ))}
                            </div>
                        </Card>

                        <Card className="border-slate-800/80 bg-[#0e1625] p-4 dark:border-slate-800/80 dark:from-[#0e1625] dark:via-[#0e1625] dark:to-[#0e1625]">
                            <div className="flex gap-3">
                                <Icon name="shield" className="h-5 w-5 shrink-0 text-amber-300" />
                                <div>
                                    <p className="text-xs font-bold text-white">Secure mode active</p>
                                    <p className="mt-1 text-[10px] leading-5 text-slate-400">Answers are saved automatically. Stay on this tab and keep fullscreen enabled.</p>
                                </div>
                            </div>
                            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
                                <div className="h-full rounded-full bg-[#1554c0] transition-all" style={{ width: `${(answeredCount / Math.max(1, questions.length)) * 100}%` }} />
                            </div>
                            <p className="mt-2 text-[9px] text-slate-500">{saveState === 'saving' ? 'Saving answer…' : saveState === 'error' ? 'Save retry pending' : 'All changes saved'}</p>
                        </Card>
                    </aside>
                </div>
            </main>

            {submitOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#111827] p-6 shadow-2xl">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300"><Icon name="target" className="h-5 w-5" /></div>
                        <h2 className="mt-4 text-lg font-bold text-white">Submit your quiz?</h2>
                        <p className="mt-2 text-xs leading-5 text-slate-400">You have answered {answeredCount} of {questions.length} questions. Once submitted, this attempt is locked and cannot be changed.</p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button type="button" onClick={() => setSubmitOpen(false)} disabled={processing} className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-300">Continue quiz</button>
                            <button type="button" onClick={() => void submitQuiz()} disabled={processing} className="rounded-xl bg-[#1554c0] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{processing ? 'Submitting…' : 'Submit now'}</button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    )
}
