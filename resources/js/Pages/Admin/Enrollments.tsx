import { Head, router } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../../Components/AdminLayout'
import {
    AdminCard,
    AdminPageIntro,
    AdminSectionHeader,
    Avatar,
    Doughnut3D,
    MiniIcon,
    Pill,
    inputClass,
} from '../../Components/AdminPremiumUI'

type Enrollment = {
    id: number
    status: string
    enrolled_at: string | null
    approved_at: string | null
    access_granted_at: string | null
    user: { id: number | null; name: string | null; email: string | null; avatar_path: string | null }
    course: { id: number | null; title: string | null }
}
type Course = { id: number; title: string }
type Link = { url: string | null; label: string; active: boolean }
type Paginator<T> = { data: T[]; current_page: number; last_page: number; from: number | null; to: number | null; total: number; links: Link[] }
type Props = {
    admin: any
    pending: Paginator<Enrollment>
    full_access: Paginator<Enrollment>
    courses: Course[]
    filters: { search: string; status: string; course_id: number }
    stats: { total: number; active: number; completed: number; pending: number; full_access: number; awaiting_access: number; paused: number; cancelled: number }
}

const date = (value: string | null, long = false) => value
    ? new Date(value).toLocaleDateString('en-KE', long ? { day: 'numeric', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' })
    : '—'

function Pager({ paginator, onNavigate }: { paginator: Paginator<Enrollment>; onNavigate: (url: string) => void }) {
    if (paginator.last_page <= 1) return null
    const links = paginator.links
        .filter((link) => link.url && link.label !== '&laquo; Previous' && link.label !== 'Next &raquo;')
        .map((link) => ({ ...link, label: link.label.replace(/<[^>]+>/g, '') }))

    return (
        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] font-semibold text-slate-400">Showing {paginator.from ?? 0}–{paginator.to ?? 0} of {paginator.total}</p>
            <div className="flex flex-wrap items-center gap-1.5">
                {paginator.links.find((link) => link.label === '&laquo; Previous')?.url && (
                    <button type="button" onClick={() => onNavigate(paginator.links.find((link) => link.label === '&laquo; Previous')!.url!)} className="h-8 rounded-lg border border-slate-200 px-3 text-[9px] font-bold text-slate-600 transition hover:border-[#1554c0] hover:text-[#1554c0] dark:border-slate-700 dark:text-slate-300">Previous</button>
                )}
                {links.map((link, index) => (
                    <button key={`${link.label}-${index}`} type="button" onClick={() => onNavigate(link.url!)} className={`h-8 min-w-8 rounded-lg px-2 text-[9px] font-black transition ${link.active ? 'bg-[#1554c0] text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-500 hover:border-[#1554c0] hover:text-[#1554c0] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'}`}>
                        {link.label}
                    </button>
                ))}
                {paginator.links.find((link) => link.label === 'Next &raquo;')?.url && (
                    <button type="button" onClick={() => onNavigate(paginator.links.find((link) => link.label === 'Next &raquo;')!.url!)} className="h-8 rounded-lg border border-slate-200 px-3 text-[9px] font-bold text-slate-600 transition hover:border-[#1554c0] hover:text-[#1554c0] dark:border-slate-700 dark:text-slate-300">Next</button>
                )}
            </div>
        </div>
    )
}

export default function Enrollments({ admin, pending, full_access, courses, filters, stats }: Props) {
    const [search, setSearch] = useState(filters.search ?? '')
    const [status, setStatus] = useState(filters.status ?? 'all')
    const [course, setCourse] = useState(String(filters.course_id || ''))

    const query = useMemo(() => ({
        search: search || undefined,
        status: status !== 'all' ? status : undefined,
        course_id: course || undefined,
    }), [search, status, course])

    useEffect(() => {
        const timer = window.setTimeout(() => {
            if (search === (filters.search ?? '') && status === (filters.status ?? 'all') && course === String(filters.course_id || '')) return
            router.get('/admin/enrollments', query, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['pending', 'full_access', 'filters', 'stats', 'courses'],
            })
        }, 350)
        return () => window.clearTimeout(timer)
    }, [query, search, status, course, filters.search, filters.status, filters.course_id])

    const navigate = (url: string) => router.get(url, {}, { preserveState: true, preserveScroll: true, only: ['pending', 'full_access', 'filters', 'stats'] })

    const emptyMessage = (title: string, text: string) => (
        <div className="px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#79a8ff]"><MiniIcon name="users" className="h-5 w-5" /></div>
            <h3 className="mt-3 text-sm font-black text-slate-900 dark:text-white">{title}</h3>
            <p className="mx-auto mt-1 max-w-md text-[10px] leading-5 text-slate-400">{text}</p>
        </div>
    )

    const action = (enrollment: Enrollment, type: 'approve' | 'revoke') => {
        const url = type === 'approve'
            ? `/admin/enrollments/${enrollment.id}/approve`
            : `/admin/enrollments/${enrollment.id}/revoke-access`
        router.post(url, {}, { preserveScroll: true })
    }

    return (
        <>
            <Head title="Enrollments · Administration" />
            <AdminLayout admin={admin} title="Enrollments">
                <div className="w-full space-y-5 pb-8">
                    <header className="flex flex-col gap-2 px-1 pt-1 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#1554c0] dark:text-[#79a8ff]">Learner access register</p>
                            <h1 className="mt-1 text-[26px] font-black tracking-[-.04em] text-slate-950 dark:text-white sm:text-[28px]">Enrollments</h1>
                            <p className="mt-1 max-w-2xl text-[11px] leading-5 text-slate-500 dark:text-slate-400">Manage enrollment approval and course access from one operational view. Pending learners stay separate from learners who can already enter their course.</p>
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400"><span className="h-2 w-2 rounded-full bg-emerald-500" /> {stats.full_access} with active access</div>
                    </header>

                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_360px]">
                        <AdminCard className="p-5 sm:p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div><p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-400">Access overview</p><h2 className="mt-1 text-base font-black text-slate-950 dark:text-white">Course access at a glance</h2><p className="mt-1 text-[10px] leading-4 text-slate-400">The register below uses the same source of truth as these totals.</p></div>
                                <div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#79a8ff] sm:flex"><MiniIcon name="shield" className="h-4 w-4" /></div>
                            </div>
                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                <Doughnut3D value={stats.full_access} total={Math.max(stats.total, 1)} label="Full course access" sublabel={`${stats.full_access} learner-course records are currently unlocked.`} tone="green" />
                                <Doughnut3D value={stats.awaiting_access} total={Math.max(stats.total, 1)} label="Awaiting access" sublabel={`${stats.awaiting_access} enrolled learners still need approval.`} tone="amber" />
                            </div>
                        </AdminCard>
                        <AdminCard className="p-5 sm:p-5">
                            <p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-400">Enrollment health</p>
                            <h2 className="mt-1 text-base font-black text-slate-950 dark:text-white">Learning lifecycle</h2>
                            <div className="mt-4 grid grid-cols-2 gap-2">
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 shadow-sm dark:bg-slate-900/70"><p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Active</p><p className="mt-1 text-xl font-black text-slate-950 dark:text-white">{stats.active}</p><p className="mt-1 text-[9px] text-slate-400">in progress</p></div>
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 shadow-sm dark:bg-slate-900/70"><p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Completed</p><p className="mt-1 text-xl font-black text-slate-950 dark:text-white">{stats.completed}</p><p className="mt-1 text-[9px] text-slate-400">course records</p></div>
                                <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-3.5 shadow-sm dark:bg-amber-500/10"><p className="text-[8px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-300">Pending</p><p className="mt-1 text-xl font-black text-amber-800 dark:text-amber-200">{stats.awaiting_access}</p><p className="mt-1 text-[9px] text-amber-600/70 dark:text-amber-300/70">need access</p></div>
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 shadow-sm dark:bg-slate-900/70"><p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Paused</p><p className="mt-1 text-xl font-black text-slate-950 dark:text-white">{stats.paused}</p><p className="mt-1 text-[9px] text-slate-400">not active</p></div>
                            </div>
                        </AdminCard>
                    </div>

                    <AdminCard className="overflow-hidden p-0">
                        <div className="border-b border-slate-100 p-4 dark:border-slate-800 sm:p-5">
                            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                                <div><p className="text-[9px] font-black uppercase tracking-[.15em] text-[#1554c0] dark:text-[#79a8ff]">Search and manage access</p><h2 className="mt-1 text-base font-black text-slate-950 dark:text-white">Learner access register</h2></div>
                                <div className="grid gap-2 sm:grid-cols-[minmax(240px,1fr)_190px_150px] xl:min-w-[620px]">
                                    <div className="relative"><MiniIcon name="search" className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search learner or course..." className={inputClass('pl-9')} /></div>
                                    <select value={course} onChange={(e) => setCourse(e.target.value)} className={inputClass()}><option value="">All courses</option>{courses.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
                                    <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass()}><option value="all">All statuses</option><option value="active">Active</option><option value="completed">Completed</option><option value="paused">Paused</option><option value="cancelled">Cancelled</option></select>
                                </div>
                            </div>
                        </div>

                        <section>
                            <div className="flex items-center justify-between bg-amber-50/80 px-5 py-3.5 dark:bg-amber-500/5 sm:px-6">
                                <div><p className="text-[9px] font-black uppercase tracking-[.15em] text-amber-700 dark:text-amber-300">Pending access</p><h3 className="mt-0.5 text-sm font-black text-slate-950 dark:text-white">Learners waiting for full access</h3></div>
                                <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-white px-2 text-[9px] font-black text-amber-700 shadow-sm dark:bg-slate-900 dark:text-amber-300">{pending.total}</span>
                            </div>
                            {pending.data.length ? <div className="divide-y divide-slate-100 dark:divide-slate-800">{pending.data.map((e) => <div key={e.id} className="p-4 transition hover:bg-slate-50/60 dark:hover:bg-slate-900/35 sm:p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center"><div className="flex min-w-0 flex-1 items-center gap-3.5"><Avatar name={e.user.name || 'Student'} path={e.user.avatar_path} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="text-xs font-black text-slate-900 dark:text-white sm:text-sm">{e.user.name || 'Unknown student'}</h4><Pill tone="amber">Awaiting access</Pill></div><p className="mt-1 truncate text-[10px] text-slate-500 dark:text-slate-400">{e.user.email || 'No email available'}</p><div className="mt-2.5 flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"><MiniIcon name="book" className="h-3 w-3" />{e.course.title || 'Course unavailable'}</span><span className="text-[9px] font-semibold text-slate-400">Enrolled {date(e.enrolled_at, true)}</span></div></div></div><div className="flex items-center justify-between gap-3 lg:w-[300px] lg:justify-end"><div className="hidden rounded-xl bg-slate-50 px-4 py-2.5 sm:block dark:bg-slate-900/70"><p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Approval</p><p className="mt-1 text-[10px] font-black text-amber-700 dark:text-amber-300">Pending</p></div><button type="button" onClick={() => action(e, 'approve')} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#1554c0] px-4 text-[10px] font-black text-white shadow-[0_10px_24px_-14px_rgba(21,84,192,.8)] transition hover:-translate-y-0.5 hover:bg-[#1048a8] sm:flex-none"><MiniIcon name="check" className="h-3.5 w-3.5" /> Allow full access</button></div></div></div>)}</div> : emptyMessage('No learners are waiting for access', 'New course enrollments that have not yet been granted access will appear here.')}
                            <Pager paginator={pending} onNavigate={navigate} />
                        </section>

                        <section className="border-t border-slate-200 dark:border-slate-800">
                            <div className="flex items-center justify-between bg-emerald-50/80 px-5 py-3.5 dark:bg-emerald-500/5 sm:px-6">
                                <div><p className="text-[9px] font-black uppercase tracking-[.15em] text-emerald-700 dark:text-emerald-300">Full access</p><h3 className="mt-0.5 text-sm font-black text-slate-950 dark:text-white">Learners with active course access</h3></div>
                                <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-white px-2 text-[9px] font-black text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-300">{full_access.total}</span>
                            </div>
                            {full_access.data.length ? <div className="divide-y divide-slate-100 dark:divide-slate-800">{full_access.data.map((e) => <div key={e.id} className="p-4 transition hover:bg-slate-50/60 dark:hover:bg-slate-900/35 sm:p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center"><div className="flex min-w-0 flex-1 items-center gap-3.5"><Avatar name={e.user.name || 'Student'} path={e.user.avatar_path} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="text-xs font-black text-slate-900 dark:text-white sm:text-sm">{e.user.name || 'Unknown student'}</h4><Pill tone="green">Full access</Pill></div><p className="mt-1 truncate text-[10px] text-slate-500 dark:text-slate-400">{e.user.email || 'No email available'}</p><div className="mt-2.5 flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"><MiniIcon name="book" className="h-3 w-3" />{e.course.title || 'Course unavailable'}</span><span className="text-[9px] font-semibold text-slate-400">Granted {date(e.access_granted_at, true)}</span></div></div></div><div className="flex items-center justify-between gap-3 lg:w-[300px] lg:justify-end"><div className="hidden rounded-xl bg-emerald-50 px-4 py-2.5 sm:block dark:bg-emerald-500/10"><p className="text-[8px] font-black uppercase tracking-wider text-emerald-600/70 dark:text-emerald-300/70">Course status</p><p className="mt-1 text-[10px] font-black text-emerald-700 dark:text-emerald-300">{e.status}</p></div><button type="button" onClick={() => action(e, 'revoke')} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-[10px] font-black text-red-600 transition hover:bg-red-50 sm:flex-none dark:border-red-500/25 dark:bg-transparent dark:text-red-300"><MiniIcon name="lock" className="h-3.5 w-3.5" /> Revoke access</button></div></div></div>)}</div> : emptyMessage('No learners currently have full access', 'Once an enrollment is approved, it will move into this section.')}
                            <Pager paginator={full_access} onNavigate={navigate} />
                        </section>
                    </AdminCard>
                </div>
            </AdminLayout>
        </>
    )
}
