import type { ReactNode } from 'react'
import type { IconName } from './student-types'

export function Icon({
    name,
    className = 'h-5 w-5',
}: {
    name: IconName
    className?: string
}) {
    const common = {
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
    }

    const icons: Record<IconName, ReactNode> = {
        grid: (
            <>
                <rect x="3" y="3" width="7" height="7" rx="1" {...common} />
                <rect x="14" y="3" width="7" height="7" rx="1" {...common} />
                <rect x="3" y="14" width="7" height="7" rx="1" {...common} />
                <rect x="14" y="14" width="7" height="7" rx="1" {...common} />
            </>
        ),
        book: (
            <>
                <path
                    d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v17H7.5A2.5 2.5 0 0 0 5 21.5v-17Z"
                    {...common}
                />
                <path d="M5 18.5A2.5 2.5 0 0 1 7.5 16H20" {...common} />
            </>
        ),
        assignment: (
            <>
                <rect x="4" y="3" width="16" height="18" rx="2" {...common} />
                <path d="M8 8h8M8 12h8M8 16h4" {...common} />
                <path d="m15 16 1.5 1.5L20 14" {...common} />
            </>
        ),
        quiz: (
            <>
                <rect x="4" y="3" width="16" height="18" rx="2" {...common} />
                <path d="M8 8h8M8 12h1M12 12h4M8 16h1M12 16h4" {...common} />
            </>
        ),
        trophy: (
            <>
                <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" {...common} />
                <path
                    d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 13v4M8 21h8M10 17h4"
                    {...common}
                />
            </>
        ),
        chart: (
            <>
                <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" {...common} />
            </>
        ),
        shield: (
            <>
                <path
                    d="M12 3 20 6v5.5c0 4.7-3.2 7.9-8 9.5-4.8-1.6-8-4.8-8-9.5V6l8-3Z"
                    {...common}
                />
                <path d="m8.5 12 2.2 2.2 4.8-5" {...common} />
            </>
        ),
        user: (
            <>
                <circle cx="12" cy="8" r="3.5" {...common} />
                <path d="M5 21c.8-3.7 3.2-5.5 7-5.5s6.2 1.8 7 5.5" {...common} />
            </>
        ),
        search: (
            <>
                <circle cx="10.8" cy="10.8" r="6.5" {...common} />
                <path d="m16 16 5 5" {...common} />
            </>
        ),
        sun: (
            <>
                <circle cx="12" cy="12" r="4" {...common} />
                <path
                    d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
                    {...common}
                />
            </>
        ),
        moon: (
            <path
                d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z"
                {...common}
            />
        ),
        menu: <path d="M4 7h16M4 12h16M4 17h16" {...common} />,
        x: <path d="M6 6l12 12M18 6 6 18" {...common} />,
        chevron: <path d="m9 6 6 6-6 6" {...common} />,
        calendar: (
            <>
                <rect x="3" y="4.5" width="18" height="16" rx="2" {...common} />
                <path d="M7 2.5v4M17 2.5v4M3 9h18" {...common} />
            </>
        ),
        clock: (
            <>
                <circle cx="12" cy="12" r="9" {...common} />
                <path d="M12 7v5l3 2" {...common} />
            </>
        ),
        sparkles: (
            <>
                <path
                    d="m12 3 1.3 4.7L18 9l-4.7 1.3L12 15l-1.3-4.7L6 9l4.7-1.3L12 3Z"
                    {...common}
                />
                <path
                    d="m19 15 .6 2.4L22 18l-2.4.6L19 21l-.6-2.4L16 18l2.4-.6L19 15Z"
                    {...common}
                />
            </>
        ),
        flame: (
            <path
                d="M13.5 3.5c.2 2.3-1 3.7-2.5 5.2-1.1 1.1-2.2 2.3-2.2 4.3A3.2 3.2 0 0 0 12 16.2a3.2 3.2 0 0 0 3.2-3.2c0-1.5-.7-2.7-1.6-3.8 2.6 1.4 4.4 4.1 4.4 7.1A6 6 0 0 1 12 22a6 6 0 0 1-6-6c0-3.5 2.2-5.8 4.1-8.1 1.2-1.4 2.2-2.7 2.1-4.4.5-.1.9-.1 1.3 0Z"
                {...common}
            />
        ),
        arrow: <path d="M5 12h14M13 6l6 6-6 6" {...common} />,
        logout: (
            <>
                <path d="M10 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h5" {...common} />
                <path d="m14 8 4 4-4 4M18 12H9" {...common} />
            </>
        ),
        support: (
            <>
                <path d="M4 13a8 8 0 0 1 16 0v3a2 2 0 0 1-2 2h-2v-5h4" {...common} />
                <path d="M4 13H2v3a2 2 0 0 0 2 2h2v-5H4Z" {...common} />
                <path d="M16 18c-.8 1.2-2.1 2-4 2" {...common} />
            </>
        ),
        chatbot: (
            <>
                <rect x="4" y="5" width="16" height="13" rx="3" {...common} />
                <path d="M8 21l3-3h5" {...common} />
                <path d="M8.5 11h.01M15.5 11h.01" {...common} />
                <path d="M9 14h6" {...common} />
                <path d="M12 5V3" {...common} />
            </>
        ),
        check: <path d="m5 12 4 4L19 6" {...common} />,
        target: (
            <>
                <circle cx="12" cy="12" r="8" {...common} />
                <circle cx="12" cy="12" r="4" {...common} />
                <circle cx="12" cy="12" r="1" fill="currentColor" />
            </>
        ),
        play: <path d="m9 6 10 6-10 6V6Z" {...common} />,
        more: (
            <>
                <circle cx="5" cy="12" r="1" fill="currentColor" />
                <circle cx="12" cy="12" r="1" fill="currentColor" />
                <circle cx="19" cy="12" r="1" fill="currentColor" />
            </>
        ),
        upload: (
            <>
                <path d="M12 16V4" {...common} />
                <path d="m7 9 5-5 5 5" {...common} />
                <path d="M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" {...common} />
            </>
        ),
        copy: (
            <>
                <rect x="9" y="9" width="11" height="11" rx="2" {...common} />
                <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" {...common} />
            </>
        ),
        share: (
            <>
                <circle cx="18" cy="5" r="2.5" {...common} />
                <circle cx="6" cy="12" r="2.5" {...common} />
                <circle cx="18" cy="19" r="2.5" {...common} />
                <path d="m8.2 10.8 7.6-4.3M8.2 13.2l7.6 4.3" {...common} />
            </>
        ),
        trash: (
            <>
                <path d="M4 7h16M10 11v6M14 11v6" {...common} />
                <path d="M9 7V4h6v3M6 7l1 14h10l1-14" {...common} />
            </>
        ),
        refresh: (
            <>
                <path d="M20 11a8 8 0 0 0-14.7-3L4 10" {...common} />
                <path d="M4 5v5h5M4 13a8 8 0 0 0 14.7 3L20 14" {...common} />
                <path d="M20 19v-5h-5" {...common} />
            </>
        ),
        edit: (
            <>
                <path d="m4 16.5-.7 3.7 3.7-.7L18.5 8a2.5 2.5 0 0 0-3.5-3.5L4 16.5Z" {...common} />
                <path d="m13.5 6.5 4 4" {...common} />
            </>
        ),
    }

    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            aria-hidden="true"
        >
            {icons[name]}
        </svg>
    )
}


export function assetUrl(path: string | null | undefined): string | null {
    if (!path) return null
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
        return path
    }
    return `/storage/${path}`
}

export function initials(name: string): string {
    return (
        name.trim().split(/\s+/).slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase()).join('') || 'S'
    )
}

export function formatDate(value: string | null | undefined): string {
    if (!value) return 'No deadline'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'No deadline'
    return new Intl.DateTimeFormat(undefined, {
        month: 'short', day: 'numeric', year: 'numeric',
    }).format(date)
}

export function formatDateTime(value: string | null | undefined): string {
    if (!value) return 'Recently'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Recently'
    return new Intl.DateTimeFormat(undefined, {
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    }).format(date)
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <section className={`rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white/95 via-white/90 to-[#f8faff]/95 shadow-[0_6px_22px_rgba(23,32,51,0.025)] dark:border-slate-800/70 dark:from-[#111827]/95 dark:via-[#111827]/90 dark:to-[#15152b]/95 dark:shadow-[0_10px_28px_rgba(0,0,0,0.14)] ${className}`}>
            {children}
        </section>
    )
}

export function SectionHeader({
    title, description, action,
}: { title: string; description?: string; action?: ReactNode }) {
    return (
        <div className="mb-5 flex items-end justify-between gap-4">
            <div className="min-w-0">
                <h2 className="text-base font-semibold tracking-tight text-slate-950 dark:text-white sm:text-lg">{title}</h2>
                {description ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p> : null}
            </div>
            {action}
        </div>
    )
}

export function EmptyState({
    icon, title, description, action,
}: { icon: IconName; title: string; description: string; action?: ReactNode }) {
    return (
        <div className="flex min-h-[154px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#dce5f2] bg-gradient-to-br from-white via-[#fbfdff] to-[#f7f5ff] px-5 py-5 text-center shadow-[0_5px_18px_rgba(21,84,192,0.02)] dark:border-slate-800 dark:from-[#111827] dark:via-[#101827] dark:to-[#17152d]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#edf4ff] to-[#f2efff] text-[#1554c0] ring-1 ring-[#1554c0]/[0.06] dark:from-[#172945] dark:to-[#211a3b] dark:text-[#6ba3ff] dark:ring-[#6ba3ff]/10">
                <Icon name={icon} className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p>
            {action ? <div className="mt-3">{action}</div> : null}
        </div>
    )
}

export function StatCard({
    icon, label, value, detail, progress,
}: { icon: IconName; label: string; value: string | number; detail: string; progress?: number }) {
    return (
        <Card className="relative overflow-hidden p-5">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#1554c0]/[0.045] blur-2xl dark:bg-[#4c8dff]/[0.08]" />
            <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{value}</p>
                    <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">{detail}</p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1554c0]/[0.08] text-[#1554c0] dark:bg-[#4c8dff]/10 dark:text-[#6ba3ff]">
                    <Icon name={icon} className="h-5 w-5" />
                </div>
            </div>
            {typeof progress === 'number' ? (
                <div className="relative mt-4">
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#1554c0] to-[#6a5cff] transition-all duration-700" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
                    </div>
                    <div className="mt-1.5 flex justify-between text-[10px]">
                        <span className="text-slate-400">Overall progress</span>
                        <span className="font-semibold text-[#1554c0] dark:text-[#6ba3ff]">{progress}%</span>
                    </div>
                </div>
            ) : null}
        </Card>
    )
}
