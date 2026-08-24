import { Head, router } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../../Components/AdminLayout'
import {
    AdminCard,
    AdminPageIntro,
    AdminSectionHeader,
    Avatar,
    MiniIcon,
    Pill,
    PremiumStat,
    inputClass,
} from '../../Components/AdminPremiumUI'

type Certificate = {
    id: number
    user: { id: number; name: string; email: string; avatar_path?: string | null } | null
    course: { id: number; title: string; thumbnail_path?: string | null } | null
    completed_at: string
}

type PaginationLink = {
    url: string | null
    label: string
    active: boolean
}

type Props = {
    admin: any
    certificates: {
        data: Certificate[]
        current_page: number
        last_page: number
        from: number | null
        to: number | null
        total: number
        links: PaginationLink[]
    }
    filters: { search: string }
    stats: { eligible: number; this_month: number }
}

const date = (value: string) =>
    new Date(value).toLocaleDateString('en-KE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })

const assetUrl = (path?: string | null) => {
    if (!path) return null
    if (/^https?:\/\//i.test(path)) return path
    return `/storage/${String(path).replace(/^\/?storage\//, '')}`
}

function CertificateMark() {
    return (
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#79a8ff]">
            <div className="absolute inset-1.5 rounded-xl border border-dashed border-[#9fc0f5] dark:border-[#31558e]" />
            <MiniIcon name="trophy" className="relative h-5 w-5" />
        </div>
    )
}

function EmptyCertificates() {
    return (
        <div className="mx-5 my-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-16 text-center dark:border-slate-800 dark:bg-slate-950/30 sm:mx-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm dark:bg-slate-900 dark:text-slate-600">
                <MiniIcon name="award" className="h-7 w-7" />
            </div>
            <h3 className="mt-5 text-sm font-black text-slate-900 dark:text-white">No completed course records</h3>
            <p className="mx-auto mt-2 max-w-md text-[10px] leading-5 text-slate-500 dark:text-slate-400">
                Certificates appear here automatically once a course enrollment is marked completed and its official completion date is recorded.
            </p>
        </div>
    )
}

function PolicyStep({
    icon,
    title,
    description,
    tone = 'blue',
}: {
    icon: string
    title: string
    description: string
    tone?: 'blue' | 'green' | 'violet'
}) {
    const tones = {
        blue: 'bg-blue-50 text-[#1554c0] dark:bg-blue-500/10 dark:text-blue-300',
        green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
        violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300',
    }

    return (
        <div className="flex gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900/55">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
                <MiniIcon name={icon} className="h-4 w-4" />
            </div>
            <div className="min-w-0">
                <p className="text-[11px] font-black leading-5 text-slate-800 dark:text-white">{title}</p>
                <p className="mt-1.5 text-[10px] leading-5 text-slate-500 dark:text-slate-400">{description}</p>
            </div>
        </div>
    )
}

export default function Certificates({ admin, certificates, filters, stats }: Props) {
    const [search, setSearch] = useState(filters.search ?? '')

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search ?? '')) {
                router.get(
                    '/admin/certificates',
                    { search: search || undefined },
                    {
                        preserveState: true,
                        preserveScroll: true,
                        replace: true,
                        only: ['certificates', 'filters', 'stats'],
                    },
                )
            }
        }, 350)

        return () => clearTimeout(timer)
    }, [search, filters.search])

    const nav = (url: string) =>
        router.get(url, {}, {
            preserveState: true,
            preserveScroll: true,
            only: ['certificates', 'filters', 'stats'],
        })

    const completionText = useMemo(() => {
        if (!certificates.total) return 'No records in the current register'
        return `Showing ${certificates.from ?? 0}–${certificates.to ?? 0} of ${certificates.total} completed records`
    }, [certificates])

    const previous = certificates.links.find(link => /previous/i.test(link.label))
    const next = certificates.links.find(link => /next/i.test(link.label))

    return (
        <>
            <Head title="Certificates · Administration" />

            <AdminLayout admin={admin} title="Certificates">
                <div className="space-y-6 pb-12">
                    <AdminPageIntro
                        eyebrow="Academic records"
                        title="Certificates"
                        description="Review completed course records and deliver the official Learn With Flevian certificate to eligible learners."
                        icon="award"
                        action={
                            <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                                <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                                <span className="text-[9px] font-black uppercase tracking-[.12em] text-emerald-700 dark:text-emerald-300">
                                    Official LMS register
                                </span>
                            </div>
                        }
                    />

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <PremiumStat label="Eligible certificates" value={stats.eligible} detail="Completed course records" icon="trophy" />
                        <PremiumStat label="Completed this month" value={stats.this_month} detail="Recent completions" icon="check" accent="emerald" />
                        <PremiumStat label="Current register" value={certificates.total} detail="Matches the current search" icon="chart" accent="violet" />
                        <PremiumStat label="Delivery" value="PDF" detail="Generated on demand" icon="download" accent="amber" />
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_390px]">
                        <AdminCard className="overflow-hidden p-0">
                            <div className="border-b border-slate-100 p-5 dark:border-slate-800 sm:p-6 lg:p-7">
                                <AdminSectionHeader
                                    eyebrow="Certificate register"
                                    title="Completed learners"
                                    description="Only enrollments with a verified completion state are available for certificate delivery."
                                    icon="trophy"
                                />

                                <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
                                    <div className="relative min-w-0 flex-1">
                                        <MiniIcon name="search" className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                                        <input
                                            value={search}
                                            onChange={event => setSearch(event.target.value)}
                                            placeholder="Search learner name, email or course..."
                                            className={inputClass('pl-10')}
                                        />
                                    </div>
                                    <div className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 dark:border-slate-700 dark:bg-slate-900">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                        <span className="text-[9px] font-black uppercase tracking-[.1em] text-slate-500 dark:text-slate-400">
                                            Completed only
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {certificates.data.length ? (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {certificates.data.map(record => {
                                        const thumbnail = assetUrl(record.course?.thumbnail_path)

                                        return (
                                            <article
                                                key={record.id}
                                                className="p-5 transition hover:bg-slate-50/60 dark:hover:bg-slate-900/45 sm:p-6 lg:p-7"
                                            >
                                                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                                                    <div className="flex min-w-0 items-start gap-4 sm:gap-5">
                                                        <CertificateMark />

                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <Avatar
                                                                    name={record.user?.name ?? 'Unknown learner'}
                                                                    path={record.user?.avatar_path}
                                                                    size="sm"
                                                                />
                                                                <p className="truncate text-sm font-black text-slate-950 dark:text-white">
                                                                    {record.user?.name ?? 'Unknown learner'}
                                                                </p>
                                                                <Pill tone="green">Completed</Pill>
                                                            </div>

                                                            <p className="mt-2 truncate text-[10px] text-slate-400">
                                                                {record.user?.email ?? 'No email recorded'}
                                                            </p>

                                                            <div className="mt-3 flex flex-wrap items-center gap-2.5">
                                                                <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-2 dark:border-slate-800 dark:bg-slate-900">
                                                                    {thumbnail ? (
                                                                        <img
                                                                            src={thumbnail}
                                                                            alt=""
                                                                            className="h-7 w-10 shrink-0 rounded-md object-cover"
                                                                        />
                                                                    ) : (
                                                                        <span className="flex h-7 w-10 shrink-0 items-center justify-center rounded-md bg-blue-50 text-[#1554c0] dark:bg-blue-500/10 dark:text-blue-300">
                                                                            <MiniIcon name="book" className="h-3.5 w-3.5" />
                                                                        </span>
                                                                    )}
                                                                    <span className="max-w-[280px] truncate text-[9px] font-bold text-slate-600 dark:text-slate-300">
                                                                        {record.course?.title ?? 'Unknown course'}
                                                                    </span>
                                                                </div>

                                                                <span className="inline-flex items-center gap-1.5 text-[9px] font-semibold text-slate-500 dark:text-slate-400">
                                                                    <MiniIcon name="calendar" className="h-3 w-3" />
                                                                    Completed {date(record.completed_at)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between sm:border-t-0 sm:pt-0 lg:justify-end">
                                                        <div className="text-left sm:text-right">
                                                            <p className="text-[8px] font-black uppercase tracking-[.16em] text-slate-400">Record reference</p>
                                                            <p className="mt-1 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                                                LWF-{String(record.id).padStart(6, '0')}
                                                            </p>
                                                        </div>

                                                        <a
                                                            href={`/admin/certificates/${record.id}/download`}
                                                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#1554c0] px-4 text-[9px] font-black text-white shadow-[0_8px_18px_rgba(21,84,192,.18)] transition hover:-translate-y-0.5 hover:bg-[#1048a8]"
                                                        >
                                                            <MiniIcon name="arrow" className="h-4 w-4" />
                                                            Download PDF
                                                        </a>
                                                    </div>
                                                </div>
                                            </article>
                                        )
                                    })}
                                </div>
                            ) : (
                                <EmptyCertificates />
                            )}

                            <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                                <p className="text-[9px] font-semibold text-slate-400">{completionText}</p>

                                {certificates.last_page > 1 && (
                                    <div className="flex items-center gap-1.5">
                                        {previous?.url && (
                                            <button
                                                type="button"
                                                onClick={() => nav(previous.url!)}
                                                className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-[9px] font-black text-slate-500 transition hover:border-[#1554c0] hover:text-[#1554c0] dark:border-slate-700 dark:text-slate-300"
                                            >
                                                <MiniIcon name="arrow" className="h-3 w-3 rotate-180" />
                                                Prev
                                            </button>
                                        )}

                                        <div className="hidden items-center gap-1 sm:flex">
                                            {certificates.links
                                                .filter(link => link.url && /^\d+$/.test(link.label))
                                                .map(link => (
                                                    <button
                                                        key={link.label}
                                                        type="button"
                                                        onClick={() => nav(link.url!)}
                                                        className={`h-8 min-w-8 rounded-lg px-2 text-[9px] font-black transition ${
                                                            link.active
                                                                ? 'bg-[#1554c0] text-white shadow-sm'
                                                                : 'border border-slate-200 text-slate-500 hover:border-[#1554c0] hover:text-[#1554c0] dark:border-slate-700 dark:text-slate-300'
                                                        }`}
                                                    >
                                                        {link.label}
                                                    </button>
                                                ))}
                                        </div>

                                        <span className="px-1 text-[9px] font-bold text-slate-400 sm:hidden">
                                            {certificates.current_page} / {certificates.last_page}
                                        </span>

                                        {next?.url && (
                                            <button
                                                type="button"
                                                onClick={() => nav(next.url!)}
                                                className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-[9px] font-black text-slate-500 transition hover:border-[#1554c0] hover:text-[#1554c0] dark:border-slate-700 dark:text-slate-300"
                                            >
                                                Next
                                                <MiniIcon name="arrow" className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </AdminCard>

                        <aside className="space-y-6">
                            <AdminCard className="overflow-hidden">
                                <div className="p-5 sm:p-6">
                                    <AdminSectionHeader
                                        eyebrow="Certificate policy"
                                        title="When a certificate is ready"
                                        description="The register follows the official LMS completion state."
                                    />
                                </div>

                                <div className="space-y-3 border-t border-slate-100 p-5 sm:p-6 dark:border-slate-800">
                                    <PolicyStep
                                        icon="check"
                                        title="Course marked completed"
                                        description="The enrollment must have the completed status before a certificate can be delivered."
                                        tone="green"
                                    />
                                    <PolicyStep
                                        icon="calendar"
                                        title="Completion date recorded"
                                        description="The official completion timestamp is required for the certificate record."
                                        tone="blue"
                                    />
                                </div>
                            </AdminCard>

                            <AdminCard className="overflow-hidden">
                                <div className="p-5 sm:p-6">
                                    <AdminSectionHeader
                                        eyebrow="Delivery"
                                        title="Official PDF record"
                                        description="Generated from the existing certificate service."
                                    />
                                </div>

                                <div className="border-t border-slate-100 p-5 sm:p-6 dark:border-slate-800">
                                    <div className="flex items-start gap-4 rounded-2xl bg-violet-50/80 p-4 dark:bg-violet-500/10">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm dark:bg-slate-900 dark:text-violet-300">
                                            <MiniIcon name="award" className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <Pill tone="green">On-demand PDF</Pill>
                                            <p className="mt-2 text-[10px] font-semibold leading-5 text-slate-500 dark:text-slate-400">
                                                No duplicate certificate record is created.
                                            </p>
                                        </div>
                                    </div>

                                    <p className="mt-5 text-[10px] leading-6 text-slate-500 dark:text-slate-400">
                                        Every download is audit logged with the administrator, learner and course context for traceability.
                                    </p>
                                </div>
                            </AdminCard>

                            <AdminCard className="overflow-hidden">
                                <div className="p-5 sm:p-6">
                                    <AdminSectionHeader
                                        eyebrow="Administrator workflow"
                                        title="Keep records clean"
                                        description="Certificate issuance stays tied to academic completion."
                                    />
                                </div>

                                <div className="space-y-4 border-t border-slate-100 p-5 sm:p-6 dark:border-slate-800">
                                    {[
                                        ['1', 'Complete the course record', 'Record the official completion date.'],
                                        ['2', 'Verify the certificate register', 'Confirm the learner and course details.'],
                                        ['3', 'Deliver the official PDF', 'Download the certificate when required.'],
                                    ].map(([number, title, text]) => (
                                        <div key={number} className="flex gap-3.5">
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[9px] font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                {number}
                                            </span>
                                            <div className="min-w-0 pt-0.5">
                                                <p className="text-[10px] font-black leading-5 text-slate-800 dark:text-white">{title}</p>
                                                <p className="mt-0.5 text-[9px] leading-5 text-slate-400">{text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </AdminCard>
                        </aside>
                    </div>
                </div>
            </AdminLayout>
        </>
    )
}
