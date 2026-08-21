import { useEffect, useState } from 'react'
import { Head, Link } from '@inertiajs/react'
import StudentLayout from '../Components/StudentLayout'
import { Card, EmptyState, Icon, SectionHeader, assetUrl } from '../Components/StudentUI'
import type { DashboardStats, Student } from '../Components/student-types'

interface Submission {
    id: number
    attempt_number: number
    status: string
    score: number | null
    submitted_at: string | null
    graded_at: string | null
    feedback?: string | null
    original_filename?: string | null
    has_file?: boolean
    transcript_generated_at?: string | null
    transcript_url?: string | null
}

interface AssignmentItem {
    id: number
    title: string
    course: string | null
    course_slug: string | null
    thumbnail_path: string | null
    module: string | null
    lesson: string | null
    instructions: string
    max_points: number
    available_from: string | null
    due_at: string | null
    submission_type: 'text' | 'file' | 'text_and_file'
    max_file_size_mb: number | null
    allowed_file_types: string[]
    assignment_status: string
    is_overdue: boolean
    is_closed: boolean
    submission: Submission | null
}

interface Props {
    student: Student
    stats: DashboardStats
    assignments?: AssignmentItem[]
}

function dueLabel(value: string | null, now = Date.now()): string {
    if (!value) return 'No due date'

    const diff = new Date(value).getTime() - now
    const absolute = Math.abs(diff)
    const minute = 60 * 1000
    const hour = 60 * minute
    const day = 24 * hour

    if (absolute < hour) {
        const minutes = Math.max(1, Math.round(absolute / minute))
        return diff >= 0 ? `Due in ${minutes} min` : `Due ${minutes} min ago`
    }

    if (absolute < day) {
        const hours = Math.max(1, Math.round(absolute / hour))
        return diff >= 0 ? `Due in ${hours} hr${hours === 1 ? '' : 's'}` : `Due ${hours} hr${hours === 1 ? '' : 's'} ago`
    }

    if (absolute < 7 * day) {
        const days = Math.max(1, Math.round(absolute / day))
        return diff >= 0 ? `Due in ${days} day${days === 1 ? '' : 's'}` : `Due ${days} day${days === 1 ? '' : 's'} ago`
    }

    if (absolute < 30 * day) {
        const weeks = Math.max(1, Math.round(absolute / (7 * day)))
        return diff >= 0 ? `Due in ${weeks} week${weeks === 1 ? '' : 's'}` : `Due ${weeks} week${weeks === 1 ? '' : 's'} ago`
    }

    const months = Math.max(1, Math.round(absolute / (30 * day)))
    return diff >= 0 ? `Due in ${months} month${months === 1 ? '' : 's'}` : `Due ${months} month${months === 1 ? '' : 's'} ago`
}

function exactDate(value: string | null): string {
    if (!value) return 'No due date'
    return new Date(value).toLocaleString('en-KE', {
        dateStyle: 'medium',
        timeStyle: 'short',
    })
}

function statusLabel(item: AssignmentItem): string {
    if (item.submission?.status === 'graded') return 'Graded'
    if (item.submission?.status === 'returned') return 'Returned'
    if (item.submission?.status === 'late') return 'Submitted late'
    if (item.submission?.status === 'submitted') return 'Submitted'
    if (item.submission?.status === 'draft') return 'In progress'
    if (item.is_overdue) return 'Overdue'
    return 'Not started'
}

function statusTone(item: AssignmentItem): string {
    if (item.submission?.status === 'graded') return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    if (item.submission?.status === 'submitted' || item.submission?.status === 'late') return 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
    if (item.is_overdue) return 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
    return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
}

function isPast(item: AssignmentItem): boolean {
    if (item.submission && ['graded', 'returned'].includes(item.submission.status)) {
        return true
    }

    return Boolean(
        item.submission &&
        ['submitted', 'late'].includes(item.submission.status) &&
        item.due_at &&
        new Date(item.due_at).getTime() < Date.now(),
    )
}

function AssignmentCard({ item, now }: { item: AssignmentItem; now: number }) {
    const graded = item.submission?.status === 'graded'
    const submitted = ['submitted', 'late'].includes(item.submission?.status ?? '')
    const score = graded && item.submission?.score !== null && item.submission?.score !== undefined
        ? `${item.submission.score} / ${item.max_points}`
        : null
    const transcriptUrl = graded ? item.submission?.transcript_url : null

    return (
        <Card className="overflow-hidden p-0 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
            <Link href={`/assignments/${item.id}`} className="group block">
                <div className="flex gap-4 p-4 sm:p-5">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-[#edf4ff] dark:bg-slate-800">
                        {item.thumbnail_path ? (
                            <img
                                src={assetUrl(item.thumbnail_path) ?? undefined}
                                alt=""
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-[#1554c0]">
                                <Icon name="assignment" className="h-6 w-6" />
                            </div>
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${statusTone(item)}`}>
                                {statusLabel(item)}
                            </span>
                            {score ? (
                                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
                                    {score}
                                </span>
                            ) : null}
                        </div>

                        <h2 className="mt-2 text-sm font-bold tracking-[-0.01em] text-slate-900 dark:text-white">
                            {item.title}
                        </h2>
                        <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                            {item.course ?? 'Course'}
                        </p>
                    </div>

                    <Icon name="chevron" className="mt-2 h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#1554c0]" />
                </div>
            </Link>

            <div className="grid grid-cols-1 border-t border-slate-100 dark:border-slate-800 sm:grid-cols-[1fr_1fr_auto]">
                <div className="p-3.5 sm:px-5">
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                        {graded ? 'Completed' : submitted ? 'Submission' : 'Deadline'}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-700 dark:text-slate-200">
                        {graded
                            ? `Graded ${item.submission?.graded_at ? new Date(item.submission.graded_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}`
                            : submitted
                                ? `Submitted ${item.submission?.submitted_at ? new Date(item.submission.submitted_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) : 'successfully'}`
                                : dueLabel(item.due_at, now)}
                    </p>
                </div>

                <div className="border-t border-slate-100 p-3.5 dark:border-slate-800 sm:border-l sm:border-t-0 sm:px-5">
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                        {graded ? 'Result' : 'Points'}
                    </p>
                    <p className="mt-1 text-xs font-bold">
                        {score ?? `${item.max_points} points`}
                    </p>
                </div>

                {transcriptUrl ? (
                    <div className="border-t border-slate-100 p-3.5 dark:border-slate-800 sm:flex sm:items-center sm:border-l sm:border-t-0 sm:px-4">
                        <a
                            href={transcriptUrl}
                            onClick={(event) => event.stopPropagation()}
                            download
                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1554c0] px-3 py-2.5 text-[9px] font-bold text-white shadow-sm shadow-[#1554c0]/20 transition hover:bg-[#1249a8] sm:w-auto"
                        >
                            <Icon name="arrow" className="h-3.5 w-3.5 rotate-90" />
                            Download transcript
                        </a>
                    </div>
                ) : null}
            </div>
        </Card>
    )
}

export default function Assignments({ student, stats, assignments = [] }: Props) {
    const [now, setNow] = useState(() => Date.now())

    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 60_000)
        return () => window.clearInterval(timer)
    }, [])

    const past = assignments.filter(isPast)
    const current = assignments.filter((item) => !isPast(item))

    const needsAttention = assignments.filter(
        (item) =>
            !item.submission ||
            item.submission.status === 'draft' ||
            item.submission.status === 'returned' ||
            (item.is_overdue && ['submitted', 'late'].includes(item.submission?.status ?? '')),
    )

    const submitted = assignments.filter((item) =>
        ['submitted', 'late', 'graded', 'returned'].includes(item.submission?.status ?? ''),
    )

    return (
        <StudentLayout student={student} stats={stats} title="Assignments">
            <Head title="Assignments" />

            <div className="w-full">
                <div className="mb-6">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1554c0]">
                        Learning work
                    </p>
                    <h1 className="mt-1.5 text-2xl font-bold tracking-[-0.03em] text-slate-950 dark:text-white sm:text-3xl">
                        Assignments
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                        Complete coursework, track deadlines, submit your work and see your results in one place.
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                    <Card className="p-4 sm:p-5">
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Assigned</p>
                        <p className="mt-1.5 text-2xl font-bold">{assignments.length}</p>
                        <p className="mt-1 text-[11px] text-slate-500">Allocated to you</p>
                    </Card>
                    <Card className="p-4 sm:p-5">
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Needs attention</p>
                        <p className="mt-1.5 text-2xl font-bold text-[#1554c0]">{needsAttention.length}</p>
                        <p className="mt-1 text-[11px] text-slate-500">Work to complete or review</p>
                    </Card>
                    <Card className="p-4 sm:p-5">
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Submitted</p>
                        <p className="mt-1.5 text-2xl font-bold">{submitted.length}</p>
                        <p className="mt-1 text-[11px] text-slate-500">Submitted or graded</p>
                    </Card>
                </div>

                <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.75fr)]">
                    <div className="min-w-0">
                        {current.length ? (
                            <section>
                                <SectionHeader
                                    title="Current assignments"
                                    description="Your active coursework and anything still requiring your attention."
                                    action={<span className="rounded-full bg-[#1554c0]/[0.07] px-3 py-1.5 text-[10px] font-semibold text-[#1554c0] dark:bg-[#6ba3ff]/10 dark:text-[#8bb8ff]">{current.length} active</span>}
                                />
                                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                                    {current.map((item) => <AssignmentCard key={item.id} item={item} now={now} />)}
                                </div>
                            </section>
                        ) : null}

                        {past.length ? (
                            <section className={current.length ? 'mt-7' : ''}>
                                <SectionHeader
                                    title="Past assignments"
                                    description="Completed work, graded results and previous submissions."
                                    action={<span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">{past.length} completed</span>}
                                />
                                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                                    {past.map((item) => <AssignmentCard key={item.id} item={item} now={now} />)}
                                </div>
                            </section>
                        ) : null}
                        {!assignments.length ? (
                            <div>
                                <EmptyState
                                    icon="assignment"
                                    title="No assignments yet"
                                    description="When an instructor allocates an assignment to you in a course you can access, it will appear here."
                                />
                            </div>
                        ) : null}
                    </div>

                    <aside className="space-y-4">
                        <Card className="p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Your progress</p>
                                    <h2 className="mt-1 text-lg font-bold tracking-[-0.02em]">Assignment activity</h2>
                                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">A quick view of submitted and graded coursework.</p>
                                </div>
                                <div className="rounded-xl bg-[#edf4ff] px-3 py-2 text-right dark:bg-[#172945]">
                                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#1554c0] dark:text-[#8bb8ff]">Completed</p>
                                    <p className="mt-0.5 text-xl font-bold">{submitted.length}</p>
                                </div>
                            </div>
                            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div
                                    className="h-full rounded-full bg-[#1554c0] transition-all dark:bg-[#4c8dff]"
                                    style={{ width: `${assignments.length ? Math.round((submitted.length / assignments.length) * 100) : 0}%` }}
                                />
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                                <span>{submitted.length} of {assignments.length} submitted</span>
                                <span>{assignments.length ? Math.round((submitted.length / assignments.length) * 100) : 0}%</span>
                            </div>
                        </Card>

                        <Card className="p-5">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Results & grading</p>
                            <h2 className="mt-1 text-lg font-bold tracking-[-0.02em]">What happens after submission</h2>
                            <div className="mt-4 space-y-3">
                                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-900/70">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Awaiting grading</span>
                                    <span className="text-xs font-bold">{assignments.filter((item) => ['submitted', 'late'].includes(item.submission?.status ?? '')).length}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-900/70">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Graded assignments</span>
                                    <span className="text-xs font-bold">{assignments.filter((item) => item.submission?.status === 'graded').length}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-900/70">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Overall score</span>
                                    <span className="text-xs font-bold text-[#1554c0] dark:text-[#8bb8ff]">
                                        {(() => {
                                            const graded = assignments.filter((item) => item.submission?.status === 'graded' && item.submission?.score !== null)
                                            if (!graded.length) return 'Pending'
                                            const earned = graded.reduce((sum, item) => sum + Number(item.submission?.score ?? 0), 0)
                                            const possible = graded.reduce((sum, item) => sum + item.max_points, 0)
                                            return possible ? `${Math.round((earned / possible) * 100)}%` : 'Pending'
                                        })()}
                                    </span>
                                </div>
                            </div>
                            <p className="mt-4 text-[10px] leading-5 text-slate-400">
                                Submitted work is locked while it is being reviewed. Once graded, your result, feedback and transcript become available on the assignment.
                            </p>
                        </Card>

                        <Card className="p-5">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Submission checklist</p>
                            <h2 className="mt-1 text-lg font-bold tracking-[-0.02em]">Before you submit</h2>
                            <ol className="mt-4 space-y-3">
                                {[
                                    'Read the full assignment instructions.',
                                    'Complete the written response if required.',
                                    'Upload the requested evidence in an accepted format.',
                                    'Review your work before final submission.',
                                ].map((step, index) => (
                                    <li key={step} className="flex gap-3">
                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#edf4ff] text-[9px] font-bold text-[#1554c0] dark:bg-[#172945] dark:text-[#8bb8ff]">{index + 1}</span>
                                        <span className="text-[11px] leading-5 text-slate-500 dark:text-slate-400">{step}</span>
                                    </li>
                                ))}
                            </ol>
                        </Card>
                    </aside>
                </div>

                {assignments.length ? (
                    <p className="mt-7 text-center text-[10px] text-slate-400">
                        Deadlines update automatically. Submitted work is locked for review, and graded results include your transcript when it is ready.
                    </p>
                ) : null}
            </div>
        </StudentLayout>
    )
}
