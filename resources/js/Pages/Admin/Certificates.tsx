import { Head, router } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../../Components/AdminLayout'
import { AdminCard, AdminPageIntro, AdminSectionHeader, Avatar, MiniIcon, Pill, PremiumStat, inputClass } from '../../Components/AdminPremiumUI'

type Certificate = {
    id: number
    user: { id: number; name: string; email: string; avatar_path?: string | null } | null
    course: { id: number; title: string } | null
    completed_at: string
}
type Link = { url: string | null; label: string; active: boolean }
type Props = {
    admin: any
    certificates: { data: Certificate[]; current_page: number; last_page: number; from: number | null; to: number | null; total: number; links: Link[] }
    filters: { search: string }
    stats: { eligible: number; this_month: number }
}

const date = (value: string) => new Date(value).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })

function CertificateMark() {
    return (
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#1554c0] shadow-sm dark:bg-[#172945] dark:text-[#79a8ff]">
            <div className="absolute inset-1.5 rounded-xl border border-dashed border-[#9fc0f5] dark:border-[#31558e]" />
            <MiniIcon name="trophy" className="relative h-6 w-6" />
        </div>
    )
}

function EmptyCertificates() {
    return (
        <div className="mx-5 my-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-14 text-center dark:border-slate-800 dark:bg-slate-950/30">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm dark:bg-slate-900 dark:text-slate-600">
                <MiniIcon name="award" className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-sm font-black text-slate-900 dark:text-white">No completed course records yet</h3>
            <p className="mx-auto mt-2 max-w-md text-[10px] leading-5 text-slate-500 dark:text-slate-400">
                Certificates become available automatically when an administrator records a course as completed and a completion date is present.
            </p>
        </div>
    )
}

export default function Certificates({ admin, certificates, filters, stats }: Props) {
    const [search, setSearch] = useState(filters.search ?? '')

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search ?? '')) {
                router.get('/admin/certificates', { search: search || undefined }, {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    only: ['certificates', 'filters', 'stats'],
                })
            }
        }, 350)
        return () => clearTimeout(timer)
    }, [search, filters.search])

    const nav = (url: string) => router.get(url, {}, { preserveState: true, preserveScroll: true, only: ['certificates', 'filters', 'stats'] })
    const completionText = useMemo(() => {
        if (!certificates.total) return 'No records in the current register'
        return `Showing ${certificates.from ?? 0}–${certificates.to ?? 0} of ${certificates.total} completed records`
    }, [certificates])

    return (
        <>
            <Head title="Certificates · Administration" />
            <AdminLayout admin={admin} title="Certificates">
                <div className="space-y-6 pb-10">
                    <AdminPageIntro
                        eyebrow="Academic records"
                        title="Certificates"
                        description="Review verified course completions and deliver the official Learn With Flevian certificate without leaving the administrative workspace."
                        action={
                            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm sm:flex dark:border-slate-800 dark:bg-slate-900">
                                <MiniIcon name="shield" className="h-4 w-4 text-emerald-500" />
                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Official LMS record</span>
                            </div>
                        }
                    />

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <PremiumStat label="Eligible" value={stats.eligible} detail="Completed course records" icon="trophy" />
                        <PremiumStat label="This month" value={stats.this_month} detail="Recent completions" icon="calendar" accent="emerald" />
                        <PremiumStat label="Current register" value={certificates.total} detail="Matching your search" icon="chart" accent="violet" />
                        <PremiumStat label="Delivery" value="PDF" detail="Generated on demand" icon="download" accent="amber" />
                    </div>

                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_370px]">
                        <div className="space-y-5">
                            <AdminCard className="overflow-hidden p-0">
                                <div className="border-b border-slate-100 p-5 dark:border-slate-800 sm:p-6">
                                    <AdminSectionHeader
                                        eyebrow="Certificate register"
                                        title="Completed learners"
                                        description="Only enrollments with an official completion record are eligible for certificate delivery."
                                        icon="trophy"
                                    />

                                    <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
                                        <div className="relative min-w-0 flex-1">
                                            <MiniIcon name="search" className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                                            <input
                                                value={search}
                                                onChange={event => setSearch(event.target.value)}
                                                placeholder="Search learner name, email or course..."
                                                className={inputClass('pl-10')}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-900">
                                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Completed only</span>
                                        </div>
                                    </div>
                                </div>

                                {certificates.data.length ? (
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {certificates.data.map(record => (
                                            <article key={record.id} className="group p-5 transition hover:bg-slate-50/70 dark:hover:bg-slate-900/50 sm:p-6">
                                                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                                                    <div className="flex min-w-0 items-center gap-4">
                                                        <CertificateMark />
                                                        <Avatar name={record.user?.name ?? 'Unknown learner'} path={record.user?.avatar_path} />
                                                        <div className="min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <p className="truncate text-sm font-black text-slate-950 dark:text-white">{record.user?.name ?? 'Unknown learner'}</p>
                                                                <Pill tone="green">Completed</Pill>
                                                            </div>
                                                            <p className="mt-1 truncate text-[10px] text-slate-400">{record.user?.email ?? 'No email recorded'}</p>
                                                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[9px] font-semibold text-slate-500 dark:text-slate-400">
                                                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 dark:bg-slate-800"><MiniIcon name="book" className="h-3 w-3" />{record.course?.title ?? 'Unknown course'}</span>
                                                                <span className="inline-flex items-center gap-1.5"><MiniIcon name="calendar" className="h-3 w-3" />Completed {date(record.completed_at)}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between gap-4 lg:justify-end">
                                                        <div className="hidden text-right sm:block">
                                                            <p className="text-[8px] font-black uppercase tracking-[.16em] text-slate-400">Record</p>
                                                            <p className="mt-1 text-[10px] font-bold text-slate-700 dark:text-slate-300">#{String(record.id).padStart(5, '0')}</p>
                                                        </div>
                                                        <a href={`/admin/certificates/${record.id}/download`} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1554c0] px-4 text-[9px] font-black text-white shadow-[0_8px_18px_rgba(21,84,192,.18)] transition hover:-translate-y-0.5 hover:bg-[#1048a8]">
                                                            <MiniIcon name="download" className="h-4 w-4" />
                                                            Download certificate
                                                        </a>
                                                    </div>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                ) : <EmptyCertificates />}

                                <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                                    <p className="text-[9px] font-semibold text-slate-400">{completionText}</p>
                                    {certificates.last_page > 1 && (
                                        <div className="flex flex-wrap gap-1">
                                            {certificates.links.filter(link => link.url && /^\d+$/.test(link.label)).map(link => (
                                                <button key={link.label} type="button" onClick={() => nav(link.url!)} className={`h-8 min-w-8 rounded-lg px-2 text-[9px] font-black transition ${link.active ? 'bg-[#1554c0] text-white shadow-sm' : 'border border-slate-200 text-slate-500 hover:border-[#1554c0] hover:text-[#1554c0] dark:border-slate-700 dark:text-slate-300'}`}>
                                                    {link.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </AdminCard>
                        </div>

                        <aside className="space-y-5">
                            <AdminCard>
                                <AdminSectionHeader eyebrow="Certificate policy" title="When a certificate is ready" description="The register follows the official LMS completion state." icon="shield" />
                                <div className="mt-6 space-y-4 border-t border-slate-100 pt-6 dark:border-slate-800">
                                    <div className="flex gap-4 rounded-2xl bg-emerald-50 p-5 dark:bg-emerald-500/10">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm dark:bg-slate-900"><MiniIcon name="check" className="h-4 w-4" /></div>
                                        <div><p className="text-[11px] font-black text-slate-800 dark:text-white">Course marked completed</p><p className="mt-2 text-[10px] leading-5 text-slate-500 dark:text-slate-400">The enrollment must have a completed status.</p></div>
                                    </div>
                                    <div className="flex gap-4 rounded-2xl bg-[#edf4ff] p-5 dark:bg-[#172945]">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#1554c0] shadow-sm dark:bg-slate-900"><MiniIcon name="calendar" className="h-4 w-4" /></div>
                                        <div><p className="text-[11px] font-black text-slate-800 dark:text-white">Completion date recorded</p><p className="mt-2 text-[10px] leading-5 text-slate-500 dark:text-slate-400">The official completion timestamp is required.</p></div>
                                    </div>
                                </div>
                            </AdminCard>

                            <AdminCard>
                                <AdminSectionHeader eyebrow="Delivery" title="Official PDF record" description="Generated from the existing certificate service." icon="download" />
                                <div className="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10"><MiniIcon name="award" className="h-5 w-5" /></div>
                                        <div><Pill tone="green">On-demand PDF</Pill><p className="mt-1 text-[9px] text-slate-400">No duplicate certificate record is created.</p></div>
                                    </div>
                                    <p className="mt-5 text-[10px] leading-6 text-slate-500 dark:text-slate-400">Downloads are audit logged with the administrator, learner and course context for traceability.</p>
                                </div>
                            </AdminCard>

                            <AdminCard>
                                <AdminSectionHeader eyebrow="Administrator workflow" title="Keep records clean" description="Certificate issuance is intentionally tied to academic completion." icon="activity" />
                                <div className="mt-6 space-y-4 border-t border-slate-100 pt-6 dark:border-slate-800">
                                    {[
                                        ['1', 'Complete the course record', 'Record the official completion date.'],
                                        ['2', 'Open the certificate register', 'Confirm the learner and course details.'],
                                        ['3', 'Deliver the official PDF', 'Download the certificate when required.'],
                                    ].map(([number, title, text]) => <div key={number} className="flex gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[9px] font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">{number}</span><div><p className="text-[11px] font-bold text-slate-800 dark:text-white">{title}</p><p className="mt-1 text-[10px] leading-5 text-slate-400">{text}</p></div></div>)}
                                </div>
                            </AdminCard>
                        </aside>
                    </div>
                </div>
            </AdminLayout>
        </>
    )
}
