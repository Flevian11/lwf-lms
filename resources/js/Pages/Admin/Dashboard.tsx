import type { ReactNode } from 'react'
import AdminLayout from '../../Components/AdminLayout'
import { Card, Icon, SectionHeader, StatCard } from '../../Components/StudentUI'

interface AdminUser { id: number; name: string; email: string; avatar_path?: string | null; email_two_factor_enabled?: boolean }
interface DashboardStats {
    students: { total: number; active: number }
    courses: { total: number; published: number; drafts: number }
    lessons: { published: number }
    enrollments: { active: number; completed: number }
    marking: { pending_assignments: number; graded_today: number }
    quizzes: { attempts: number; submitted: number }
    payments: { successful_count: number; successful_amount: number; currency: string }
}
interface Enrollment { id: number; student: string; email?: string; course: string; status: string; source: string; created_at: string | null }
interface Submission { id: number; student: string; assignment: string; course: string; status: string; submitted_at: string | null; has_file: boolean }
interface QuizAttempt { id: number; student: string; quiz: string; attempt_number: number; status: string; percentage: number | null; passed: boolean | null; submitted_at: string | null }
interface Payment { id: number; student: string; course: string; amount: number; currency: string; status: string; method: string | null; created_at: string | null }
interface Props { admin: AdminUser; stats: DashboardStats; recentEnrollments: Enrollment[]; pendingSubmissions: Submission[]; recentQuizAttempts: QuizAttempt[]; recentPayments: Payment[] }

function date(value: string | null) {
    if (!value) return '—'
    return new Intl.DateTimeFormat('en-KE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function money(value: number, currency: string) {
    return `${currency} ${value.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function statusClass(status: string) {
    if (['active', 'successful', 'graded', 'completed'].includes(status)) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
    if (['submitted', 'pending', 'processing', 'late'].includes(status)) return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
    return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
}

function Panel({ title, description, icon, children, action }: { title: string; description?: string; icon: string; children: ReactNode; action?: ReactNode }) {
    return (
        <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#8bb8ff]"><Icon name={icon as any} className="h-4 w-4" /></div>
                    <div className="min-w-0">
                        <h2 className="text-sm font-semibold tracking-tight text-slate-950 dark:text-white sm:text-base">{title}</h2>
                        {description ? <p className="mt-0.5 text-[11px] leading-4 text-slate-400 dark:text-slate-500">{description}</p> : null}
                    </div>
                </div>
                {action}
            </div>
            {children}
        </Card>
    )
}
function Empty({ icon, title, text }: { icon: string; title: string; text: string }) {
    return (
        <div className="flex min-h-[170px] flex-col items-center justify-center px-5 py-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#edf4ff] to-[#f2efff] text-[#1554c0] dark:from-[#172945] dark:to-[#211a3b] dark:text-[#6ba3ff]"><Icon name={icon as any} className="h-5 w-5" /></div>
            <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
            <p className="mt-1 max-w-xs text-[11px] leading-5 text-slate-400 dark:text-slate-500">{text}</p>
        </div>
    )
}

export default function Dashboard({ admin, stats, recentEnrollments, pendingSubmissions, recentQuizAttempts, recentPayments }: Props) {
    const firstName = admin.name.split(' ')[0] || 'Admin'

    return (
        <AdminLayout admin={admin} title="Admin Dashboard">
            <div className="w-full">
                <section className="relative isolate overflow-hidden rounded-[26px] bg-[#10213f] p-6 text-white shadow-[0_18px_45px_rgba(21,84,192,0.14)] sm:p-8 lg:p-9">
                    <video className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-45" src="/videos/dashboard-bg.mp4" autoPlay muted loop playsInline aria-hidden="true" />
                    <div className="pointer-events-none absolute inset-0 bg-[#071225]/60" />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#1554c0]/30 via-transparent to-[#4438a8]/35" />
                    <div className="relative grid gap-7 lg:grid-cols-[1fr_330px] lg:items-end">
                        <div className="max-w-3xl">
                            <div className="mb-3 flex items-center gap-2 text-[#a9c7ff]"><Icon name="sparkles" className="h-4 w-4" /><span className="text-[10px] font-bold uppercase tracking-[0.2em]">Administration</span></div>
                            <h1 className="text-3xl font-bold leading-[1.08] tracking-[-0.04em] sm:text-4xl lg:text-[42px]">Good to see you, {firstName}.</h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/80">Manage learning operations, monitor student activity and keep courses, assessments, access and payments moving from one administrative workspace.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-white/[0.14] bg-white/[0.09] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-lg"><p className="text-[10px] font-medium uppercase tracking-[0.12em] text-blue-100/70">Active learners</p><p className="mt-2 text-2xl font-bold">{stats.students.active}</p><p className="mt-1 text-[10px] text-blue-100/60">of {stats.students.total} students</p></div>
                            <div className="rounded-2xl border border-white/[0.14] bg-white/[0.09] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-lg"><p className="text-[10px] font-medium uppercase tracking-[0.12em] text-blue-100/70">Open marking</p><p className="mt-2 text-2xl font-bold">{stats.marking.pending_assignments}</p><p className="mt-1 text-[10px] text-blue-100/60">submissions awaiting review</p></div>
                        </div>
                    </div>
                </section>

                <section className="mt-8">
                    <SectionHeader
                        title="Your LMS at a glance"
                        description="Live operational metrics from the learning platform."
                        action={<div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[10px] font-semibold text-slate-500 shadow-sm dark:border-slate-700 dark:bg-[#111827] dark:text-slate-400">Live data</div>}
                    />
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard label="Students" value={stats.students.total} detail={`${stats.students.active} active accounts`} icon="user" />
                        <StatCard label="Published courses" value={stats.courses.published} detail={`${stats.courses.total} total · ${stats.courses.drafts} drafts`} icon="book" />
                        <StatCard label="Active enrollments" value={stats.enrollments.active} detail={`${stats.enrollments.completed} completed`} icon="assignment" />
                        <StatCard label="Needs marking" value={stats.marking.pending_assignments} detail={`${stats.marking.graded_today} graded today`} icon="assignment" />
                        <StatCard label="Published lessons" value={stats.lessons.published} detail="Available in published courses" icon="book" />
                        <StatCard label="Quiz attempts" value={stats.quizzes.attempts} detail={`${stats.quizzes.submitted} submitted`} icon="quiz" />
                        <StatCard label="Successful payments" value={stats.payments.successful_count} detail={money(stats.payments.successful_amount, stats.payments.currency)} icon="chart" />
                        <StatCard label="Course completions" value={stats.enrollments.completed} detail="Eligible for certificate flow" icon="trophy" />
                    </div>
                </section>

                <section className="mt-8 grid gap-5 xl:grid-cols-[1.28fr_.92fr]">
                    <Panel title="Recent enrollments" description="Latest course access activity" icon="user">
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {recentEnrollments.length === 0 ? <Empty icon="user" title="No enrollments yet" text="New course access activity will appear here." /> : recentEnrollments.map(item => (
                                <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
                                    <div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf4ff] text-xs font-bold text-[#1554c0] dark:bg-[#172945] dark:text-[#8bb8ff]">{item.student.slice(0, 1).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800 dark:text-white">{item.student}</p><p className="mt-0.5 truncate text-[11px] text-slate-400">{item.course}</p></div></div>
                                    <div className="shrink-0 text-right"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${statusClass(item.status)}`}>{item.status}</span><p className="mt-1 text-[10px] text-slate-400">{date(item.created_at)}</p></div>
                                </div>
                            ))}
                        </div>
                    </Panel>

                    <Panel title="Assessment queue" description="Submissions waiting for review" icon="assignment">
                        {pendingSubmissions.length === 0 ? <Empty icon="assignment" title="All caught up" text="There are no assignment submissions waiting for marking." /> : <div className="divide-y divide-slate-100 dark:divide-slate-800">{pendingSubmissions.slice(0, 6).map(item => <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-4"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800 dark:text-white">{item.assignment}</p><p className="mt-1 truncate text-[11px] text-slate-400">{item.student} · {item.course}</p></div><div className="shrink-0 text-right"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${statusClass(item.status)}`}>{item.status}</span>{item.has_file ? <p className="mt-1 text-[10px] text-[#1554c0] dark:text-[#78aaff]">File attached</p> : null}</div></div>)}</div>}
                    </Panel>
                </section>

                <section className="mt-5 grid gap-5 xl:grid-cols-2">
                    <Panel title="Recent quiz activity" description="Latest student attempts" icon="quiz">
                        {recentQuizAttempts.length === 0 ? <Empty icon="quiz" title="No quiz activity" text="Completed and active attempts will appear here." /> : <div className="divide-y divide-slate-100 dark:divide-slate-800">{recentQuizAttempts.slice(0, 6).map(item => <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-4"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800 dark:text-white">{item.quiz}</p><p className="mt-1 truncate text-[11px] text-slate-400">{item.student} · Attempt {item.attempt_number}</p></div><div className="shrink-0 text-right"><p className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.percentage !== null ? `${Number(item.percentage).toFixed(0)}%` : '—'}</p><p className="mt-1 text-[10px] capitalize text-slate-400">{item.status} · {date(item.submitted_at)}</p></div></div>)}</div>}
                    </Panel>
                    <Panel title="Payment activity" description="Latest recorded transactions" icon="chart">
                        {recentPayments.length === 0 ? <Empty icon="chart" title="No payment activity" text="Recorded payments will appear here as finance operations are completed." /> : <div className="divide-y divide-slate-100 dark:divide-slate-800">{recentPayments.slice(0, 6).map(item => <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-4"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800 dark:text-white">{item.student}</p><p className="mt-1 truncate text-[11px] text-slate-400">{item.course} · {item.method || 'Method not recorded'}</p></div><div className="shrink-0 text-right"><p className="text-sm font-bold text-slate-800 dark:text-white">{money(item.amount, item.currency)}</p><span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${statusClass(item.status)}`}>{item.status.replace('_', ' ')}</span></div></div>)}</div>}
                    </Panel>
                </section>

                <section className="mt-5 grid gap-4 md:grid-cols-3">
                    {[
                        ['Course operations', 'Maintain courses, modules, lessons and learning materials.', 'book', 'Learning'],
                        ['Assessment operations', 'Build assignments and quizzes, allocate work and review submissions.', 'assignment', 'Assessment'],
                        ['Student operations', 'Manage learners, enrollments, achievements, access and payments.', 'user', 'People'],
                    ].map(([title, text, icon, label]) => (
                        <div key={title} className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-white to-[#f8faff] p-5 shadow-[0_6px_22px_rgba(23,32,51,0.025)] dark:border-slate-800/70 dark:from-[#111827] dark:via-[#111827] dark:to-[#15152b]"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#8bb8ff]"><Icon name={icon as any} className="h-5 w-5" /></div><p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#1554c0] dark:text-[#78aaff]">{label}</p><h3 className="mt-1 text-[16px] font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h3><p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{text}</p></div>
                    ))}
                </section>
            </div>
        </AdminLayout>
    )
}
