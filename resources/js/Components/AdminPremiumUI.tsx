import type { ReactNode } from 'react'

function assetUrl(path: string | null | undefined): string | null {
    if (!path) return null
    if (/^(https?:\/\/|\/)/.test(path)) return path
    return `/storage/${path}`
}

function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (!parts.length) return '?'
    return parts.slice(0, 2).map(part => part.charAt(0).toUpperCase()).join('')
}

export function AdminCard({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <section className={`rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white/95 via-white/90 to-[#f8faff]/95 shadow-[0_6px_22px_rgba(23,32,51,0.025)] dark:border-slate-800/70 dark:from-[#111827]/95 dark:via-[#111827]/90 dark:to-[#15152b]/95 dark:shadow-[0_10px_28px_rgba(0,0,0,0.14)] ${className}`}>
            {children}
        </section>
    )
}

export function MiniIcon({ name, className = 'h-5 w-5' }: { name: string; className?: string }) {
    const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
    const paths: Record<string, ReactNode> = {
        users: <><path {...common} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle {...common} cx="9" cy="7" r="4"/><path {...common} d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
        award: <><circle {...common} cx="12" cy="8" r="5"/><path {...common} d="m8.5 12.5-1 8 4.5-2.4 4.5 2.4-1-8"/></>,
        lock: <><rect {...common} x="4" y="10" width="16" height="11" rx="2"/><path {...common} d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
        check: <path {...common} d="m5 12 4 4L19 6"/>,
        clock: <><circle {...common} cx="12" cy="12" r="9"/><path {...common} d="M12 7v5l3 2"/></>,
        book: <><path {...common} d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22z"/><path {...common} d="M4 5.5v16"/></>,
        assignment: <><rect {...common} x="5" y="3" width="14" height="18" rx="2"/><path {...common} d="M9 3.5h6M9 9h6M9 13h6M9 17h3"/></>,
        quiz: <><rect {...common} x="4" y="4" width="16" height="16" rx="3"/><path {...common} d="M8 8h8M8 12h5M8 16h3"/></>,
        search: <><circle {...common} cx="11" cy="11" r="7"/><path {...common} d="m20 20-4-4"/></>,
        plus: <><path {...common} d="M12 5v14M5 12h14"/></>,
        trophy: <><path {...common} d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path {...common} d="M7 6H4v2a4 4 0 0 0 4 4M17 6h3v2a4 4 0 0 1-4 4"/></>,
        shield: <><path {...common} d="M12 3 20 6v5c0 5-3.2 8.3-8 10-4.8-1.7-8-5-8-10V6z"/><path {...common} d="m9 12 2 2 4-4"/></>,
        chart: <><path {...common} d="M4 19V5M4 19h16"/><path {...common} d="M8 16v-4M12 16V8M16 16v-7"/></>,
        dots: <><circle cx="5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="19" cy="12" r="1.3" fill="currentColor"/></>,
        x: <><path {...common} d="m6 6 12 12M18 6 6 18"/></>,
        arrow: <><path {...common} d="M5 12h14M13 6l6 6-6 6"/></>,
        user: <><circle {...common} cx="12" cy="8" r="4"/><path {...common} d="M4 21a8 8 0 0 1 16 0"/></>,
        star: <path {...common} d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>,
        target: <><circle {...common} cx="12" cy="12" r="8"/><circle {...common} cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></>,
        spark: <><path {...common} d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z"/><path {...common} d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7z"/></>,
        edit: <><path {...common} d="M12 20h9"/><path {...common} d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/></>,
        mail: <><rect {...common} x="3" y="5" width="18" height="14" rx="2"/><path {...common} d="m3 7 9 6 9-6"/></>,
        calendar: <><rect {...common} x="3" y="4" width="18" height="17" rx="2"/><path {...common} d="M16 2v4M8 2v4M3 10h18"/></>,
        activity: <><path {...common} d="M3 12h4l2-7 4 14 2-7h6"/></>,
    }
    return <svg viewBox="0 0 24 24" className={className} aria-hidden="true">{paths[name] ?? paths.spark}</svg>
}

export function Avatar({ name, path, size = 'md' }: { name: string; path?: string | null; size?: 'sm' | 'md' | 'lg' }) {
    const src = assetUrl(path)
    const sizeClass = size === 'lg' ? 'h-14 w-14 text-base' : size === 'sm' ? 'h-9 w-9 text-[10px]' : 'h-11 w-11 text-xs'
    return src ? <img src={src} alt="" className={`${sizeClass} rounded-2xl object-cover ring-1 ring-white/70 shadow-sm dark:ring-slate-800`} /> : <div className={`${sizeClass} flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#e8f0ff] to-[#eee9ff] font-bold text-[#1554c0] ring-1 ring-[#1554c0]/10 dark:from-[#172945] dark:to-[#211a3b] dark:text-[#8bb5ff]`}>{initials(name)}</div>
}

export function PremiumStat({ label, value, detail, icon, accent = 'blue' }: { label: string; value: string | number; detail: string; icon: string; accent?: 'blue' | 'violet' | 'emerald' | 'amber' }) {
    const accents = {
        blue: 'from-[#1554c0]/10 to-[#6a5cff]/5 text-[#1554c0] dark:text-[#79a8ff]',
        violet: 'from-[#6a5cff]/10 to-[#a855f7]/5 text-[#6a5cff] dark:text-[#b99cff]',
        emerald: 'from-emerald-500/10 to-cyan-500/5 text-emerald-600 dark:text-emerald-400',
        amber: 'from-amber-500/10 to-orange-500/5 text-amber-600 dark:text-amber-400',
    }
    return <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white/95 via-white/90 to-[#f8faff]/95 p-3.5 shadow-[0_6px_22px_rgba(23,32,51,0.025)] transition hover:-translate-y-px hover:shadow-[0_10px_28px_rgba(21,84,192,0.07)] dark:border-slate-800/70 dark:from-[#111827]/95 dark:via-[#111827]/90 dark:to-[#15152b]/95">
        <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-[#1554c0]/[0.045] blur-2xl dark:bg-[#4c8dff]/[0.08]" />
        <div className="relative flex items-center gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accents[accent]}`}><MiniIcon name={icon} className="h-4 w-4" /></div>
            <div className="min-w-0"><p className="text-[8px] font-bold uppercase tracking-[.1em] text-slate-400">{label}</p><p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">{value}</p><p className="text-[8px] text-slate-400">{detail}</p></div>
        </div>
    </div>
}

export function PageHero({ eyebrow, title, description, icon, action, children }: { eyebrow: string; title: string; description: string; icon: string; action?: ReactNode; children?: ReactNode }) {
    return <section className="relative isolate overflow-hidden rounded-[28px] border border-white/10 bg-[#10213f] p-6 text-white shadow-[0_24px_70px_-34px_rgba(21,84,192,.6)] sm:p-8 lg:p-9">
        <div className="pointer-events-none absolute inset-0 opacity-90"><div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[#6a5cff]/30 blur-3xl"/><div className="absolute -bottom-36 left-1/3 h-72 w-72 rounded-full bg-[#1554c0]/35 blur-3xl"/><div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.11),transparent_30%),linear-gradient(135deg,transparent,rgba(255,255,255,.025))]"/></div>
        <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur"><MiniIcon name={icon} /></div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-blue-200">{eyebrow}</p></div><h1 className="mt-5 text-3xl font-black tracking-[-.03em] sm:text-4xl">{title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/75">{description}</p>{children}</div>
            {action ? <div className="shrink-0">{action}</div> : null}
        </div>
    </section>
}

export function Pill({ children, tone = 'blue' }: { children: ReactNode; tone?: 'blue' | 'green' | 'amber' | 'red' | 'slate' }) {
    const tones = { blue: 'bg-blue-50 text-[#1554c0] dark:bg-blue-500/10 dark:text-blue-300', green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300', amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300', red: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300', slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' }
    return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.08em] ${tones[tone]}`}>{children}</span>
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
    return <label className="block"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[.12em] text-slate-500 dark:text-slate-400">{label}</span>{children}{hint ? <span className="mt-1.5 block text-[10px] leading-4 text-slate-400">{hint}</span> : null}</label>
}

export function inputClass(extra = '') { return `h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1554c0] focus:ring-4 focus:ring-[#1554c0]/10 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-500 ${extra}` }
export function textareaClass(extra = '') { return `min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1554c0] focus:ring-4 focus:ring-[#1554c0]/10 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-500 ${extra}` }

export function Modal({ title, eyebrow, onClose, children, wide = false }: { title: string; eyebrow?: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
    return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-md"><div className={`w-full ${wide ? 'max-w-3xl' : 'max-w-xl'} max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200/80 bg-white shadow-[0_24px_70px_-24px_rgba(15,23,42,.45)] dark:border-slate-700 dark:bg-[#101827]`}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-5 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-[#101827]/95"><div><p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#1554c0] dark:text-[#79a8ff]">{eyebrow ?? 'Administration'}</p><h2 className="mt-1 text-lg font-black tracking-tight text-slate-900 dark:text-white">{title}</h2></div><button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"><MiniIcon name="x" className="h-4 w-4"/></button></div>
        <div className="p-6">{children}</div>
    </div></div>
}


export function AdminPageIntro({ eyebrow, title, description, action, icon }: { eyebrow: string; title: string; description: string; action?: ReactNode; icon?: string }) {
    return <div className="flex flex-col gap-4 px-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
            <div className="flex items-center gap-2">
                {icon ? <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#79a8ff]"><MiniIcon name={icon} className="h-4 w-4" /></span> : null}
                <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#1554c0] dark:text-[#79a8ff]">{eyebrow}</p>
            </div>
            <h1 className="mt-2 text-[26px] font-black tracking-[-.04em] text-slate-950 dark:text-white sm:text-[28px]">{title}</h1>
            <p className="mt-1 max-w-3xl text-[11px] leading-5 text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
    </div>
}

export function AdminSectionHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
    return <div className="mb-5 flex items-end justify-between gap-4">
        <div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-[.14em] text-slate-400">{eyebrow ?? 'Administration'}</p><h2 className="mt-1 text-base font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h2>{description ? <p className="mt-1 text-[10px] leading-4 text-slate-500 dark:text-slate-400">{description}</p> : null}</div>
        {action ? <div className="shrink-0">{action}</div> : null}
    </div>
}

export function Doughnut3D({ value, total, label, sublabel, tone = 'blue' }: { value: number; total: number; label: string; sublabel: string; tone?: 'blue' | 'green' | 'amber' }) {
    const pct = total > 0 ? Math.min(100, Math.max(0, (value / total) * 100)) : 0
    const colors = tone === 'green' ? { a: '#10b981', b: '#06b6d4' } : tone === 'amber' ? { a: '#f59e0b', b: '#f97316' } : { a: '#1554c0', b: '#6a5cff' }
    const circumference = 2 * Math.PI * 42
    const dash = (pct / 100) * circumference
    return <div className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="relative h-24 w-24 shrink-0">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90 drop-shadow-[0_7px_4px_rgba(15,23,42,.18)]">
                <defs><linearGradient id={`g-${tone}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={colors.a}/><stop offset="1" stopColor={colors.b}/></linearGradient></defs>
                <ellipse cx="60" cy="67" rx="43" ry="39" fill="none" stroke="#cbd5e1" strokeOpacity=".35" strokeWidth="13"/>
                <circle cx="60" cy="60" r="42" fill="none" stroke="currentColor" strokeOpacity=".08" strokeWidth="13"/>
                <circle cx="60" cy="60" r="42" fill="none" stroke={`url(#g-${tone})`} strokeWidth="13" strokeLinecap="round" strokeDasharray={`${dash} ${circumference - dash}`} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-lg font-black text-slate-900 dark:text-white">{Math.round(pct)}%</span><span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">{value}/{total}</span></div>
        </div>
        <div className="min-w-0"><p className="text-xs font-bold text-slate-800 dark:text-slate-100">{label}</p><p className="mt-1 text-[10px] leading-4 text-slate-500 dark:text-slate-400">{sublabel}</p></div>
    </div>
}
