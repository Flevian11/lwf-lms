import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import StudentLayout from '../Components/StudentLayout'
import { Card, Icon, assetUrl } from '../Components/StudentUI'
import type { DashboardStats, Student } from '../Components/student-types'

interface Submission {
    id: number
    attempt_number: number
    status: string
    score: number | null
    feedback: string | null
    text_content: string | null
    submitted_at: string | null
    graded_at: string | null
    original_filename: string | null
    mime_type: string | null
    file_size: number | null
    has_file: boolean
    download_url: string | null
    transcript_url: string | null
    transcript_ready: boolean
}

interface Assignment {
    id: number
    title: string
    instructions: string
    max_points: number
    available_from: string | null
    due_at: string | null
    submission_type: 'text' | 'file' | 'text_and_file'
    max_file_size_mb: number | null
    allowed_file_types: string[]
    status: string
    is_overdue: boolean
    is_closed: boolean
    course: {
        id: number
        title: string
        slug: string
        thumbnail_path: string | null
    }
    module: string | null
    lesson: string | null
    latest_submission: Submission | null
    submissions: Submission[]
}

interface Props {
    student: Student
    stats: DashboardStats
    assignment: Assignment
}

function formatDate(value: string | null): string {
    if (!value) return '—'
    return new Date(value).toLocaleString('en-KE', {
        dateStyle: 'medium',
        timeStyle: 'short',
    })
}

function formatBytes(value: number | null): string {
    if (!value) return ''
    if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`
    return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function submissionLabel(status: string): string {
    return {
        draft: 'Draft',
        submitted: 'Submitted',
        late: 'Submitted late',
        graded: 'Graded',
        returned: 'Returned',
    }[status] ?? status
}

export default function AssignmentPage({ student, stats, assignment }: Props) {
    const latest = assignment.latest_submission
    const initialText = latest?.status === 'draft' ? (latest.text_content ?? '') : ''

    const [textContent, setTextContent] = useState(initialText)
    const [file, setFile] = useState<File | null>(null)
    const [processing, setProcessing] = useState(false)
    const [savingDraft, setSavingDraft] = useState(false)
    const [draftDirty, setDraftDirty] = useState(false)
    const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null)
    const [draftError, setDraftError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const saveTimerRef = useRef<number | null>(null)
    const saveInFlightRef = useRef(false)
    const pendingSaveRef = useRef(false)
    const latestTextRef = useRef(initialText)
    const latestFileRef = useRef<File | null>(null)

    const canText = assignment.submission_type === 'text' || assignment.submission_type === 'text_and_file'
    const canFile = assignment.submission_type === 'file' || assignment.submission_type === 'text_and_file'

    const submissionLocked = !!latest && ['submitted', 'late', 'graded', 'returned'].includes(latest.status)
    const submitDisabled = assignment.is_closed || submissionLocked || processing || savingDraft

    const requirement = useMemo(() => {
        const parts = []
        if (canText) parts.push('written response')
        if (canFile) parts.push('file upload')
        return parts.join(' + ')
    }, [canText, canFile])

    useEffect(() => {
        latestTextRef.current = textContent
    }, [textContent])

    useEffect(() => {
        latestFileRef.current = file
    }, [file])

    useEffect(() => {
        return () => {
            if (saveTimerRef.current !== null) {
                window.clearTimeout(saveTimerRef.current)
            }
        }
    }, [])

    const saveDraft = () => {
        if (assignment.is_closed || submissionLocked || saveInFlightRef.current) {
            pendingSaveRef.current = true
            return
        }

        const currentText = latestTextRef.current
        const currentFile = latestFileRef.current

        if (!currentText.trim() && !currentFile && !latest?.has_file) {
            setDraftDirty(false)
            return
        }

        saveInFlightRef.current = true
        setSavingDraft(true)
        setDraftError(null)

        const data = new FormData()
        data.append('mode', 'draft')
        if (canText) data.append('text_content', currentText)
        if (currentFile) data.append('file', currentFile)

        router.post(`/assignments/${assignment.id}/submit`, data, {
            forceFormData: true,
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setDraftDirty(false)
                setDraftSavedAt(new Date().toISOString())
                setFile(null)
                latestFileRef.current = null
                if (fileInputRef.current) fileInputRef.current.value = ''
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0]
                setDraftError(typeof firstError === 'string' ? firstError : 'We could not save your draft. Please try again.')
            },
            onFinish: () => {
                saveInFlightRef.current = false
                setSavingDraft(false)

                if (pendingSaveRef.current) {
                    pendingSaveRef.current = false
                    window.setTimeout(() => saveDraft(), 0)
                }
            },
        })
    }

    const scheduleDraftSave = () => {
        if (assignment.is_closed || submissionLocked) return
        setDraftDirty(true)
        setDraftError(null)

        if (saveTimerRef.current !== null) {
            window.clearTimeout(saveTimerRef.current)
        }

        saveTimerRef.current = window.setTimeout(() => {
            saveTimerRef.current = null
            saveDraft()
        }, 5000)
    }

    const handleTextChange = (value: string) => {
        setTextContent(value)
        latestTextRef.current = value
        scheduleDraftSave()
    }

    const handleFileChange = (nextFile: File | null) => {
        setFile(nextFile)
        latestFileRef.current = nextFile
        setDraftDirty(true)
        setDraftError(null)

        if (saveTimerRef.current !== null) {
            window.clearTimeout(saveTimerRef.current)
            saveTimerRef.current = null
        }

        // Files are uploaded immediately so a selected document is not lost
        // if the learner leaves the page before typing anything else.
        window.setTimeout(() => saveDraft(), 0)
    }

    const submit = (mode: 'draft' | 'submit') => {
        if (mode === 'draft') {
            saveDraft()
            return
        }

        setProcessing(true)
        setDraftError(null)

        const data = new FormData()
        data.append('mode', mode)
        if (canText) data.append('text_content', textContent)
        if (file) data.append('file', file)

        router.post(`/assignments/${assignment.id}/submit`, data, {
            forceFormData: true,
            preserveScroll: true,
            onError: (errors) => {
                const firstError = Object.values(errors)[0]
                setDraftError(typeof firstError === 'string' ? firstError : 'We could not submit your assignment. Please try again.')
            },
            onFinish: () => setProcessing(false),
        })
    }

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault()
        submit('submit')
    }

    return (
        <StudentLayout student={student} stats={stats} title={assignment.title}>
            <div className="w-full py-6">
                <div className="mb-5">
                    <Link
                        href="/assignments"
                        className="inline-flex items-center gap-2 text-xs font-semibold text-[#1554c0] hover:underline dark:text-[#6ba3ff]"
                    >
                        <Icon name="arrow" className="h-3.5 w-3.5 rotate-180" />
                        Back to assignments
                    </Link>
                </div>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <main className="space-y-6">
                        <Card className="overflow-hidden p-0">
                            <div className="flex gap-4 border-b border-slate-100 p-5 dark:border-slate-800 sm:p-6">
                                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#edf4ff] dark:bg-slate-800">
                                    {assignment.course.thumbnail_path ? (
                                        <img
                                            src={assetUrl(assignment.course.thumbnail_path) ?? undefined}
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-[#1554c0]">
                                            <Icon name="assignment" className="h-7 w-7" />
                                        </div>
                                    )}
                                </div>

                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#1554c0]">
                                        {assignment.course.title}
                                    </p>
                                    <h1 className="mt-1 text-xl font-bold tracking-[-0.03em] text-slate-950 dark:text-white">
                                        {assignment.title}
                                    </h1>
                                    {(assignment.module || assignment.lesson) && (
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            {[assignment.module, assignment.lesson].filter(Boolean).join(' · ')}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="p-5 sm:p-6">
                                <h2 className="text-sm font-bold">Instructions</h2>
                                <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
                                    {assignment.instructions}
                                </div>
                            </div>
                        </Card>

                        <Card className="p-5 sm:p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-sm font-bold">Your submission</h2>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        {latest ? `Current attempt: ${latest.attempt_number}` : 'No submission yet'}
                                    </p>
                                </div>

                                {latest ? (
                                    <span className="rounded-full bg-[#1554c0]/[0.07] px-3 py-1.5 text-[10px] font-bold text-[#1554c0]">
                                        {submissionLabel(latest.status)}
                                    </span>
                                ) : null}
                            </div>

                            {latest?.feedback ? (
                                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-300">
                                        Instructor feedback
                                    </p>
                                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-emerald-900 dark:text-emerald-100">
                                        {latest.feedback}
                                    </p>
                                </div>
                            ) : null}

                            {latest?.score !== null && latest?.score !== undefined ? (
                                <div className="mt-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Score</p>
                                    <p className="mt-1 text-xl font-bold">
                                        {latest.score} / {assignment.max_points}
                                    </p>
                                </div>
                            ) : null}

                            {!assignment.is_closed && !submissionLocked ? (
                                <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                                    {canText ? (
                                        <div>
                                            <div className="flex items-center justify-between gap-3">
                                                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                                    Written response
                                                </label>
                                                <span className="text-[10px] text-slate-400">
                                                    {savingDraft ? 'Saving draft…' : draftDirty ? 'Unsaved changes' : draftSavedAt ? `Saved ${new Date(draftSavedAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}` : latest?.status === 'draft' ? 'Draft restored' : 'Autosave on'}
                                                </span>
                                            </div>
                                            <textarea
                                                value={textContent}
                                                onChange={(event) => handleTextChange(event.target.value)}
                                                onBlur={() => {
                                                    if (draftDirty) saveDraft()
                                                }}
                                                rows={10}
                                                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1554c0] focus:ring-4 focus:ring-[#1554c0]/10 dark:border-slate-700 dark:bg-slate-950"
                                                placeholder="Write your answer here..."
                                            />
                                        </div>
                                    ) : null}

                                    {canFile ? (
                                        <div>
                                            <div className="flex items-center justify-between gap-3">
                                                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                                    Upload your work
                                                </label>
                                                <span className="text-[10px] text-slate-400">Files are saved to your draft</span>
                                            </div>
                                            <div className="mt-2 rounded-2xl border border-dashed border-slate-300 p-5 dark:border-slate-700">
                                                <div className="mt-2">
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        accept={assignment.allowed_file_types
                                                            ?.map((type) => `.${type}`)
                                                            .join(',')}
                                                        onChange={(event) => {
                                                            handleFileChange(event.target.files?.[0] ?? null)
                                                            event.target.value = ''
                                                        }}
                                                        className="sr-only"
                                                    />

                                                    <button
                                                        type="button"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="group flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-8 text-center transition hover:border-[#1554c0] hover:bg-[#1554c0]/[0.03] dark:border-slate-700 dark:bg-slate-950/40 dark:hover:border-[#4c8dff] dark:hover:bg-[#4c8dff]/[0.04]"
                                                    >
                                                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#1554c0] transition group-hover:scale-105 dark:bg-[#172945] dark:text-[#6ba3ff]">
                                                            <Icon name="upload" className="h-5 w-5" />
                                                        </span>

                                                        <span className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
                                                            Upload your work
                                                        </span>

                                                        <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                            Click to choose a file from your computer
                                                        </span>

                                                        <span className="mt-2 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                                                            PDF, DOC, DOCX or ZIP · Maximum 10 MB
                                                        </span>
                                                    </button>
                                                </div>
                                                <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                                                    {requirement}
                                                    {assignment.max_file_size_mb ? ` · Maximum ${assignment.max_file_size_mb} MB` : ''}
                                                    {assignment.allowed_file_types.length
                                                        ? ` · Allowed: ${assignment.allowed_file_types.join(', ')}`
                                                        : ''}
                                                </p>

                                                {file ? (
                                                    <div className="mt-3 rounded-xl bg-[#edf4ff] px-3 py-2.5 dark:bg-slate-900">
                                                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                                            Uploading: {file.name}
                                                        </p>
                                                        <p className="mt-0.5 text-[10px] text-slate-500">{formatBytes(file.size)}</p>
                                                    </div>
                                                ) : null}

                                                {!file && latest?.has_file ? (
                                                    <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                                                        <div className="min-w-0">
                                                            <p className="truncate text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                                                                {latest.original_filename ?? 'Saved file'}
                                                            </p>
                                                            <p className="mt-0.5 text-[10px] text-emerald-700/70 dark:text-emerald-300/70">
                                                                Saved in your draft{latest.file_size ? ` · ${formatBytes(latest.file_size)}` : ''}
                                                            </p>
                                                        </div>
                                                        {latest.download_url ? (
                                                            <a
                                                                href={latest.download_url}
                                                                className="shrink-0 text-[10px] font-bold text-[#1554c0] hover:underline dark:text-[#6ba3ff]"
                                                            >
                                                                View file
                                                            </a>
                                                        ) : null}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    ) : null}

                                    {draftError ? (
                                        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs leading-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
                                            {draftError}
                                        </div>
                                    ) : null}

                                    {assignment.is_overdue ? (
                                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                                            The due date has passed. You can still submit, but this submission will be recorded as late.
                                        </div>
                                    ) : null}

                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            disabled={submitDisabled}
                                            onClick={() => submit('draft')}
                                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                                        >
                                            {savingDraft ? 'Saving…' : 'Save draft'}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitDisabled}
                                            className="rounded-xl bg-[#1554c0] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#1554c0]/20 transition hover:bg-[#1249a8] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {processing ? 'Submitting…' : 'Submit assignment'}
                                        </button>
                                    </div>
                                </form>
                            ) : submissionLocked ? (
                                <div className="mt-5 space-y-4">
                                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-amber-700 dark:text-amber-300">
                                            Grading status
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-amber-900 dark:text-amber-100">
                                            {latest?.status === 'graded' ? 'Graded by Instructor' : 'Pending grading by Instructor'}
                                        </p>
                                        <p className="mt-1 text-xs leading-5 text-amber-800/80 dark:text-amber-200/80">
                                            Your submitted work is locked and cannot be edited while this assignment is being reviewed.
                                        </p>
                                    </div>

                                    {canText && latest?.text_content ? (
                                        <div>
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-xs font-bold">Written response</p>
                                                <span className="text-[10px] font-semibold text-slate-400">Read only</span>
                                            </div>
                                            <div className="mt-2 whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                                                {latest.text_content}
                                            </div>
                                        </div>
                                    ) : null}

                                    {latest?.has_file ? (
                                        <div className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                                            <div className="min-w-0">
                                                <p className="truncate text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                                                    {latest.original_filename ?? 'Submitted file'}
                                                </p>
                                                <p className="mt-1 text-[10px] text-emerald-700/70 dark:text-emerald-300/70">
                                                    Submitted with your assignment{latest.file_size ? ` · ${formatBytes(latest.file_size)}` : ''}
                                                </p>
                                            </div>
                                            {latest.download_url ? (
                                                <a
                                                    href={latest.download_url}
                                                    className="shrink-0 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-[10px] font-bold text-[#1554c0] hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-900 dark:text-[#6ba3ff]"
                                                >
                                                    Download file
                                                </a>
                                            ) : null}
                                        </div>
                                    ) : null}

                                    {latest?.transcript_ready && latest.transcript_url ? (
                                        <a
                                            href={latest.transcript_url}
                                            className="inline-flex items-center rounded-xl bg-[#1554c0] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#1554c0]/20 transition hover:bg-[#1249a8]"
                                        >
                                            Download transcript
                                        </a>
                                    ) : null}
                                </div>
                            ) : (
                                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                    This assignment is closed and no further submissions can be made.
                                </div>
                            )}
                        </Card>
                    </main>

                    <aside className="space-y-4">
                        <Card className="p-5">
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Assignment details</p>
                            <dl className="mt-4 space-y-4">
                                <div>
                                    <dt className="text-[10px] text-slate-400">Due</dt>
                                    <dd className={`mt-1 text-xs font-bold ${assignment.is_overdue ? 'text-amber-600' : ''}`}>
                                        {formatDate(assignment.due_at)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-[10px] text-slate-400">Maximum score</dt>
                                    <dd className="mt-1 text-xs font-bold">{assignment.max_points} points</dd>
                                </div>
                                <div>
                                    <dt className="text-[10px] text-slate-400">Submission</dt>
                                    <dd className="mt-1 text-xs font-bold">
                                        {assignment.submission_type === 'text_and_file'
                                            ? 'Text + file'
                                            : assignment.submission_type === 'text'
                                                ? 'Text'
                                                : 'File'}
                                    </dd>
                                </div>
                            </dl>
                        </Card>

                        {assignment.submissions.length ? (
                            <Card className="p-5">
                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Submission history</p>
                                <div className="mt-4 space-y-3">
                                    {assignment.submissions.map((submission) => (
                                        <div key={submission.id} className="rounded-2xl border border-slate-100 p-3 dark:border-slate-800">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-xs font-bold">Attempt {submission.attempt_number}</p>
                                                <span className="text-[10px] font-semibold text-[#1554c0]">
                                                    {submissionLabel(submission.status)}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-[10px] text-slate-400">
                                                {formatDate(submission.submitted_at)}
                                            </p>
                                            {submission.score !== null ? (
                                                <p className="mt-2 text-xs font-bold">
                                                    {submission.score} / {assignment.max_points}
                                                </p>
                                            ) : null}
                                            {submission.has_file && submission.download_url ? (
                                                <a
                                                    href={submission.download_url}
                                                    className="mt-2 inline-block text-[10px] font-bold text-[#1554c0] hover:underline"
                                                >
                                                    Download submitted file
                                                </a>
                                            ) : null}
                                            {submission.transcript_ready && submission.transcript_url ? (
                                                <a
                                                    href={submission.transcript_url}
                                                    className="mt-2 ml-3 inline-block rounded-lg border border-[#1554c0]/20 px-2.5 py-1.5 text-[10px] font-bold text-[#1554c0] transition hover:bg-[#1554c0]/[0.05]"
                                                >
                                                    Download transcript
                                                </a>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        ) : null}
                    </aside>
                </div>
            </div>
        </StudentLayout>
    )
}


