import { Head, router } from '@inertiajs/react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import AdminLayout from '../../Components/AdminLayout'
import {
    AdminCard,
    AdminPageIntro,
    AdminSectionHeader,
    Avatar,
    Field,
    MiniIcon,
    Modal,
    Pill,
    PremiumStat,
    inputClass,
} from '../../Components/AdminPremiumUI'

type Student = {
    id: number
    name: string
    email: string
    status: string
    avatar_path?: string | null
    email_verified_at?: string | null
    created_at: string
    course_enrollments_count: number
    assignment_submissions_count: number
    quiz_attempts_count: number
}
type Link = { url: string | null; label: string; active: boolean }
type Paginator<T> = { data: T[]; current_page: number; last_page: number; from: number | null; to: number | null; total: number; links: Link[] }
type Props = { admin: any; students: Paginator<Student>; stats: { total: number; active: number; inactive: number; verified: number }; filters: { search: string; status: string } }

const date = (value: string | null) => value ? new Date(value).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

function Pager({ paginator, onNavigate }: { paginator: Paginator<Student>; onNavigate: (url: string) => void }) {
    if (paginator.last_page <= 1) return null
    const pages = paginator.links.filter((link) => link.url && /^\d+$/.test(link.label))
    const previous = paginator.links.find((link) => link.label === '&laquo; Previous')
    const next = paginator.links.find((link) => link.label === 'Next &raquo;')
    return <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"><p className="text-[10px] font-semibold text-slate-400">Showing {paginator.from ?? 0}–{paginator.to ?? 0} of {paginator.total}</p><div className="flex flex-wrap items-center gap-1.5">{previous?.url&&<button type="button" onClick={()=>onNavigate(previous.url!)} className="h-8 rounded-lg border border-slate-200 px-3 text-[9px] font-bold text-slate-600 hover:border-[#1554c0] hover:text-[#1554c0] dark:border-slate-700 dark:text-slate-300">Previous</button>}{pages.map((link)=><button type="button" key={link.label} onClick={()=>onNavigate(link.url!)} className={`h-8 min-w-8 rounded-lg px-2 text-[9px] font-black ${link.active?'bg-[#1554c0] text-white shadow-sm':'border border-slate-200 text-slate-500 hover:border-[#1554c0] hover:text-[#1554c0] dark:border-slate-700 dark:text-slate-300'}`}>{link.label}</button>)}{next?.url&&<button type="button" onClick={()=>onNavigate(next.url!)} className="h-8 rounded-lg border border-slate-200 px-3 text-[9px] font-bold text-slate-600 hover:border-[#1554c0] hover:text-[#1554c0] dark:border-slate-700 dark:text-slate-300">Next</button>}</div></div>
}

export default function Students({ admin, students, stats, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '')
    const [status, setStatus] = useState(filters.status ?? 'all')
    const [showCreate, setShowCreate] = useState(false)
    const [editing, setEditing] = useState<Student | null>(null)
    const verifiedPct = stats.total ? Math.round((stats.verified / stats.total) * 100) : 0

    const query = useMemo(() => ({ search: search || undefined, status: status !== 'all' ? status : undefined }), [search, status])

    useEffect(() => {
        const timer = window.setTimeout(() => {
            if (search === (filters.search ?? '') && status === (filters.status ?? 'all')) return
            router.get('/admin/students', query, { preserveState: true, preserveScroll: true, replace: true, only: ['students', 'stats', 'filters'] })
        }, 350)
        return () => window.clearTimeout(timer)
    }, [query, search, status, filters.search, filters.status])

    const navigate = (url: string) => router.get(url, {}, { preserveState: true, preserveScroll: true, only: ['students', 'stats', 'filters'] })

    return <>
        <Head title="Students · Administration" />
        <AdminLayout admin={admin} title="Students">
            <div className="space-y-5 pb-8">
                <header className="flex flex-col gap-3 px-1 pt-1 sm:flex-row sm:items-end sm:justify-between">
                    <div><p className="text-[9px] font-black uppercase tracking-[.18em] text-[#1554c0] dark:text-[#79a8ff]">Learner directory</p><h1 className="mt-1 text-[26px] font-black tracking-[-.04em] text-slate-950 dark:text-white sm:text-[28px]">Students</h1><p className="mt-1 max-w-2xl text-[11px] leading-5 text-slate-500 dark:text-slate-400">Manage learner accounts, verify account health and see learning activity without leaving the administrative workspace.</p></div>
                    <button type="button" onClick={()=>setShowCreate(true)} className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1554c0] px-4 text-[10px] font-black text-white shadow-[0_12px_28px_-16px_rgba(21,84,192,.9)] transition hover:-translate-y-0.5 hover:bg-[#1048a8]"><MiniIcon name="plus" className="h-3.5 w-3.5"/> Add student</button>
                </header>

                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4"><PremiumStat label="Students" value={stats.total} detail="Learner accounts" icon="users"/><PremiumStat label="Active" value={stats.active} detail="Currently enabled" icon="check" accent="emerald"/><PremiumStat label="Inactive" value={stats.inactive} detail="Need attention" icon="lock" accent="amber"/><PremiumStat label="Verified" value={`${verifiedPct}%`} detail={`${stats.verified} verified emails`} icon="shield" accent="violet"/></div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_310px]">
                <AdminCard className="overflow-hidden p-0">
                    <div className="border-b border-slate-100 bg-white p-5 dark:border-slate-800 dark:from-[#101827] dark:to-[#111a2b] sm:p-5">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-[#1554c0] dark:text-[#79a8ff]">People</p><h2 className="mt-1 text-[15px] font-black text-slate-950 dark:text-white">Learner directory</h2><p className="mt-1 text-[10px] text-slate-400">Search updates automatically as you type.</p></div><div className="grid gap-2 sm:grid-cols-[minmax(240px,1fr)_150px] xl:w-[450px]"><div className="relative"><MiniIcon name="search" className="absolute left-3 top-3 h-4 w-4 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or email..." className={inputClass('pl-9')}/></div><select value={status} onChange={e=>setStatus(e.target.value)} className={inputClass()}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div></div>
                    </div>

                    {students.data.length ? <>
                        <div className="hidden overflow-x-auto lg:block"><table className="w-full min-w-[980px]"><thead><tr className="border-b border-slate-100 bg-slate-50/70 text-left dark:border-slate-800 dark:bg-slate-900/40"><th className="px-6 py-3 text-[9px] font-black uppercase tracking-[.12em] text-slate-400">Student</th><th className="px-4 py-3 text-[9px] font-black uppercase tracking-[.12em] text-slate-400">Account</th><th className="px-4 py-3 text-[9px] font-black uppercase tracking-[.12em] text-slate-400">Learning activity</th><th className="px-4 py-3 text-[9px] font-black uppercase tracking-[.12em] text-slate-400">Joined</th><th className="px-6 py-3 text-right text-[9px] font-black uppercase tracking-[.12em] text-slate-400">Actions</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{students.data.map(s=><tr key={s.id} className="group transition hover:bg-slate-50/70 dark:hover:bg-slate-900/45"><td className="px-6 py-4"><div className="flex items-center gap-3.5"><Avatar name={s.name} path={s.avatar_path}/><div className="min-w-0"><p className="truncate text-xs font-black text-slate-900 dark:text-white">{s.name}</p><p className="mt-0.5 truncate text-[10px] text-slate-500 dark:text-slate-400">{s.email}</p></div></div></td><td className="px-4 py-4"><div className="flex flex-wrap items-center gap-2"><Pill tone={s.status==='active'?'green':'slate'}>{s.status}</Pill><span className={`inline-flex items-center gap-1 text-[9px] font-bold ${s.email_verified_at?'text-emerald-600 dark:text-emerald-400':'text-amber-600 dark:text-amber-400'}`}><span className={`h-1.5 w-1.5 rounded-full ${s.email_verified_at?'bg-emerald-500':'bg-amber-500'}`}/>{s.email_verified_at?'Verified':'Unverified'}</span></div></td><td className="px-4 py-4"><div className="grid grid-cols-3 gap-1.5"><ActivityStat icon="book" value={s.course_enrollments_count} label="Courses"/><ActivityStat icon="assignment" value={s.assignment_submissions_count} label="Work"/><ActivityStat icon="quiz" value={s.quiz_attempts_count} label="Quizzes"/></div></td><td className="px-4 py-4 text-[10px] font-semibold text-slate-500">{date(s.created_at)}</td><td className="px-6 py-4"><div className="flex justify-end gap-2"><button type="button" title="Edit student" onClick={()=>setEditing(s)} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-[9px] font-black text-slate-600 transition hover:border-[#1554c0] hover:text-[#1554c0] dark:border-slate-700 dark:text-slate-300"><MiniIcon name="edit" className="h-3.5 w-3.5"/> Edit</button><button type="button" onClick={()=>router.post(`/admin/students/${s.id}/toggle-status`,{},{preserveScroll:true})} className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[9px] font-black ${s.status==='active'?'border border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-500/20 dark:text-amber-300':'bg-emerald-600 text-white hover:bg-emerald-700'}`}><MiniIcon name={s.status==='active'?'lock':'check'} className="h-3.5 w-3.5"/>{s.status==='active'?'Deactivate':'Activate'}</button></div></td></tr>)}</tbody></table></div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 lg:hidden">{students.data.map(s=><div key={s.id} className="p-5"><div className="flex items-start gap-3"><Avatar name={s.name} path={s.avatar_path}/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-xs font-black text-slate-900 dark:text-white">{s.name}</h3><Pill tone={s.status==='active'?'green':'slate'}>{s.status}</Pill></div><p className="mt-1 truncate text-[10px] text-slate-500">{s.email}</p><div className="mt-3 grid grid-cols-3 gap-2"><ActivityStat icon="book" value={s.course_enrollments_count} label="Courses"/><ActivityStat icon="assignment" value={s.assignment_submissions_count} label="Work"/><ActivityStat icon="quiz" value={s.quiz_attempts_count} label="Quizzes"/></div></div></div><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={()=>setEditing(s)} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-[9px] font-black dark:border-slate-700"><MiniIcon name="edit" className="h-3.5 w-3.5"/> Edit</button><button type="button" onClick={()=>router.post(`/admin/students/${s.id}/toggle-status`,{},{preserveScroll:true})} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#1554c0] px-3 text-[9px] font-black text-white"><MiniIcon name={s.status==='active'?'lock':'check'} className="h-3.5 w-3.5"/>{s.status==='active'?'Deactivate':'Activate'}</button></div></div>)}</div>
                    </> : <EmptyStudents />}
                    <Pager paginator={students} onNavigate={navigate}/>
                </AdminCard>

                <aside className="min-w-0 space-y-3">
                    <AdminCard className="p-4">
                        <p className="text-[9px] font-bold uppercase tracking-[.14em] text-slate-400">Account health</p>
                        <h2 className="mt-0.5 text-base font-bold tracking-[-.02em] text-slate-900 dark:text-white">Learner accounts</h2>
                        <p className="mt-1 text-[10px] leading-4 text-slate-500 dark:text-slate-400">A quick view of account availability and verification.</p>
                        <div className="mt-3 rounded-xl bg-gradient-to-r from-[#edf4ff] to-[#f7f4ff] p-3 dark:from-[#121e33] dark:to-[#18152f]">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 text-[#1554c0] dark:bg-slate-900/50 dark:text-[#8bb8ff]"><MiniIcon name="shield" className="h-4 w-4" /></div>
                                <div><p className="text-xs font-bold text-slate-900 dark:text-white">{verifiedPct}% verified</p><p className="text-[9px] text-slate-400">{stats.verified} of {stats.total} accounts</p></div>
                            </div>
                        </div>
                        <div className="mt-3 space-y-1.5">
                            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/70"><span className="text-[9px] text-slate-500 dark:text-slate-400">Active</span><span className="text-[10px] font-bold text-slate-900 dark:text-white">{stats.active}</span></div>
                            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/70"><span className="text-[9px] text-slate-500 dark:text-slate-400">Inactive</span><span className="text-[10px] font-bold text-slate-900 dark:text-white">{stats.inactive}</span></div>
                            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/70"><span className="text-[9px] text-slate-500 dark:text-slate-400">Unverified</span><span className="text-[10px] font-bold text-amber-600 dark:text-amber-300">{Math.max(0, stats.total - stats.verified)}</span></div>
                        </div>
                    </AdminCard>

                    <AdminCard className="p-4">
                        <p className="text-[9px] font-bold uppercase tracking-[.14em] text-slate-400">Learning activity</p>
                        <h2 className="mt-0.5 text-base font-bold tracking-[-.02em] text-slate-900 dark:text-white">Directory signals</h2>
                        <div className="mt-3 space-y-2">
                            <div className="flex gap-2.5"><div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#8bb8ff]"><MiniIcon name="book" className="h-3.5 w-3.5" /></div><div><p className="text-[10px] font-bold text-slate-700 dark:text-slate-200">Course access</p><p className="mt-0.5 text-[9px] leading-4 text-slate-400">Enrollment counts are shown directly beside each learner.</p></div></div>
                            <div className="flex gap-2.5"><div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><MiniIcon name="assignment" className="h-3.5 w-3.5" /></div><div><p className="text-[10px] font-bold text-slate-700 dark:text-slate-200">Submitted work</p><p className="mt-0.5 text-[9px] leading-4 text-slate-400">Assignment activity helps identify active learners.</p></div></div>
                            <div className="flex gap-2.5"><div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400"><MiniIcon name="quiz" className="h-3.5 w-3.5" /></div><div><p className="text-[10px] font-bold text-slate-700 dark:text-slate-200">Quiz attempts</p><p className="mt-0.5 text-[9px] leading-4 text-slate-400">Recent assessment participation is included in the directory.</p></div></div>
                        </div>
                    </AdminCard>

                    <AdminCard className="p-4">
                        <p className="text-[9px] font-bold uppercase tracking-[.14em] text-slate-400">Administrator guide</p>
                        <h2 className="mt-0.5 text-base font-bold tracking-[-.02em] text-slate-900 dark:text-white">Keep learner records clean</h2>
                        <p className="mt-2 text-[10px] leading-4 text-slate-500 dark:text-slate-400">Use the directory to maintain account details, verify email health and control active access without leaving the administrative workspace.</p>
                        <div className="mt-3 flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#edf4ff] to-[#f7f4ff] px-3 py-2.5 dark:from-[#121e33] dark:to-[#18152f]"><MiniIcon name="shield" className="h-3.5 w-3.5 text-[#1554c0] dark:text-[#8bb8ff]" /><span className="text-[9px] font-semibold text-slate-600 dark:text-slate-300">Profile and security controls remain in their dedicated admin pages.</span></div>
                    </AdminCard>
                </aside>
            </div>
            </div>
        </AdminLayout>
        {showCreate && <StudentForm mode="create" onClose={()=>setShowCreate(false)}/>} {editing && <StudentForm mode="edit" student={editing} onClose={()=>setEditing(null)}/>} 
    </>
}

function ActivityStat({ icon, value, label }: { icon: string; value: number; label: string }) { return <div className="rounded-xl bg-slate-50 px-2.5 py-2 dark:bg-slate-900/70"><div className="flex items-center gap-1.5 text-slate-400"><MiniIcon name={icon} className="h-3 w-3"/><span className="text-[8px] font-bold uppercase tracking-wider">{label}</span></div><p className="mt-1 text-xs font-black text-slate-900 dark:text-white">{value}</p></div> }
function EmptyStudents() { return <div className="px-6 py-14 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#79a8ff]"><MiniIcon name="users" className="h-5 w-5"/></div><h3 className="mt-4 text-sm font-black text-slate-900 dark:text-white">No students found</h3><p className="mx-auto mt-1 max-w-md text-[10px] leading-5 text-slate-400">Try another name, email address or account status. Learners with existing course enrollments are also included in this directory.</p></div> }

function StudentForm({ mode, student, onClose }: { mode: 'create' | 'edit'; student?: Student; onClose: () => void }) {
    const [name, setName] = useState(student?.name ?? '')
    const [email, setEmail] = useState(student?.email ?? '')
    const [password, setPassword] = useState('')
    const [processing, setProcessing] = useState(false)
    const submit = (event: FormEvent) => {
        event.preventDefault(); setProcessing(true)
        const data = mode === 'create' ? { name, email, password } : { name, email }
        const options = { preserveScroll: true, onFinish: () => setProcessing(false), onSuccess: onClose }
        if (mode === 'create') router.post('/admin/students', data, options)
        else router.put(`/admin/students/${student!.id}`, data, options)
    }
    return <Modal title={mode === 'create' ? 'Add student' : 'Edit student'} eyebrow={mode === 'create' ? 'Create learner account' : 'Update learner account'} onClose={onClose}>
        <div className="mb-6 rounded-2xl border border-[#1554c0]/10 bg-gradient-to-r from-[#edf4ff] to-[#f6f3ff] p-4 dark:border-white/5 dark:from-[#13223c] dark:to-[#1a1731]"><div className="flex items-center gap-3"><Avatar name={name || student?.name || 'New student'} path={student?.avatar_path} size="lg"/><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[.15em] text-[#1554c0] dark:text-[#79a8ff]">{mode === 'create' ? 'New learner' : 'Learner profile'}</p><h3 className="mt-1 truncate text-sm font-black text-slate-950 dark:text-white">{name || 'Student name'}</h3><p className="mt-0.5 truncate text-[10px] text-slate-500 dark:text-slate-400">{email || 'student@example.com'}</p></div></div></div>
        <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Full name"><div className="relative"><MiniIcon name="user" className="absolute left-3 top-3 h-4 w-4 text-slate-400"/><input required value={name} onChange={e=>setName(e.target.value)} className={inputClass('pl-9')} placeholder="Student full name"/></div></Field><Field label="Email address"><div className="relative"><MiniIcon name="mail" className="absolute left-3 top-3 h-4 w-4 text-slate-400"/><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className={inputClass('pl-9')} placeholder="student@example.com"/></div></Field></div>
            {mode === 'create' && <Field label="Temporary password" hint="Use at least 8 characters. The learner can change it after signing in."><div className="relative"><MiniIcon name="lock" className="absolute left-3 top-3 h-4 w-4 text-slate-400"/><input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)} className={inputClass('pl-9')} placeholder="At least 8 characters"/></div></Field>}
            {mode === 'edit' && <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/70"><div className="flex items-center gap-2 text-slate-400"><MiniIcon name="calendar" className="h-3.5 w-3.5"/><span className="text-[8px] font-black uppercase tracking-wider">Joined</span></div><p className="mt-2 text-xs font-black text-slate-900 dark:text-white">{date(student?.created_at ?? null)}</p></div><div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/70"><div className="flex items-center gap-2 text-slate-400"><MiniIcon name="activity" className="h-3.5 w-3.5"/><span className="text-[8px] font-black uppercase tracking-wider">Learning activity</span></div><p className="mt-2 text-xs font-black text-slate-900 dark:text-white">{student?.course_enrollments_count ?? 0} courses · {student?.quiz_attempts_count ?? 0} quizzes</p></div></div>}
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="h-10 cursor-pointer rounded-xl border border-slate-200 px-4 text-[10px] font-black text-slate-600 dark:border-slate-700 dark:text-slate-300">Cancel</button><button type="submit" disabled={processing} className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1554c0] px-5 text-[10px] font-black text-white shadow-sm disabled:opacity-50">{processing ? 'Saving...' : <><MiniIcon name="check" className="h-3.5 w-3.5"/>{mode === 'create' ? 'Create student' : 'Save changes'}</>}</button></div>
        </form>
    </Modal>
}
