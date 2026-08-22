import { Head, Link, router } from '@inertiajs/react'
import type { FormEvent, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Icon, assetUrl, initials } from './StudentUI'

interface AdminUser {
    id: number
    name: string
    email: string
    avatar_path?: string | null
    email_two_factor_enabled?: boolean
}

interface AdminLayoutProps {
    admin: AdminUser
    title?: string
    children: ReactNode
}

const sections = [
    {
        label: 'Overview',
        items: [{ label: 'Dashboard', href: '/admin', icon: 'grid' as const, enabled: true }],
    },
    {
        label: 'Learning',
        items: [
            { label: 'Courses', icon: 'book' as const, enabled: false },
            { label: 'Modules & Lessons', icon: 'book' as const, enabled: false },
            { label: 'Assignments', icon: 'assignment' as const, enabled: false },
            { label: 'Quizzes', icon: 'quiz' as const, enabled: false },
            { label: 'Achievements', icon: 'trophy' as const, enabled: false },
        ],
    },
    {
        label: 'People',
        items: [
            { label: 'Students', icon: 'user' as const, enabled: false },
            { label: 'Enrollments', icon: 'assignment' as const, enabled: false },
        ],
    },
    {
        label: 'Finance',
        items: [{ label: 'Payments', icon: 'chart' as const, enabled: false }],
    },
    {
        label: 'System',
        items: [
            { label: 'Certificates', icon: 'trophy' as const, enabled: false },
            { label: 'Reports', icon: 'chart' as const, enabled: false },
            { label: 'Security', href: '/admin/security', icon: 'shield' as const, enabled: true },
        ],
    },
    {
        label: 'Account',
        items: [
            { label: 'Settings', href: '/admin/settings', icon: 'shield' as const, enabled: true },
            { label: 'Profile', href: '/admin/profile', icon: 'user' as const, enabled: true },
        ],
    },
]

export default function AdminLayout({ admin, title = 'Admin Portal', children }: AdminLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [profileOpen, setProfileOpen] = useState(false)
    const [darkMode, setDarkMode] = useState(false)
    const profileRef = useRef<HTMLDivElement>(null)

    const avatar = assetUrl(admin.avatar_path ?? null)
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '/admin'

    useEffect(() => {
        const stored = window.localStorage.getItem('learn-with-flevian-theme')
        const preferredDark =
            stored === 'dark'
                ? true
                : stored === 'light'
                  ? false
                  : window.matchMedia('(prefers-color-scheme: dark)').matches

        setDarkMode(preferredDark)
        document.documentElement.classList.toggle('dark', preferredDark)
        document.documentElement.style.colorScheme = preferredDark ? 'dark' : 'light'
    }, [])

    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target as Node
            if (profileOpen && profileRef.current && !profileRef.current.contains(target)) {
                setProfileOpen(false)
            }
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setProfileOpen(false)
                setSidebarOpen(false)
            }
        }

        document.addEventListener('pointerdown', handlePointerDown)
        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [profileOpen])

    const toggleTheme = () => {
        const next = !darkMode
        setDarkMode(next)
        document.documentElement.classList.toggle('dark', next)
        document.documentElement.style.colorScheme = next ? 'dark' : 'light'
        window.localStorage.setItem('learn-with-flevian-theme', next ? 'dark' : 'light')
    }

    const handleLogout = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        router.post('/logout')
    }

    return (
        <>
            <Head title={title} />

            <div className="min-h-screen bg-gradient-to-br from-[#f3f7ff] via-white to-[#f7f5ff] text-[#172033] transition-colors dark:from-[#080d18] dark:via-[#0b1020] dark:to-[#121029] dark:text-[#edf2fa]">
                {sidebarOpen ? (
                    <button
                        type="button"
                        aria-label="Close navigation"
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] lg:hidden"
                    />
                ) : null}

                <aside
                    className={`fixed inset-y-0 left-0 z-50 flex w-[252px] flex-col border-r border-slate-200/80 bg-white/95 shadow-2xl backdrop-blur-xl transition-transform duration-200 dark:border-slate-800/80 dark:bg-[#0d1422]/95 dark:shadow-black/30 lg:translate-x-0 lg:shadow-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
                >
                    <div className="flex h-[82px] shrink-0 items-center border-b border-slate-100 px-5 dark:border-slate-800">
                        <Link href="/admin" onClick={() => setSidebarOpen(false)} className="flex min-w-0 items-center gap-3">
                            <img
                                src="/favicon-192x192.png"
                                alt="Learn With Flevian"
                                className="h-10 w-10 rounded-xl object-contain shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
                            />
                            <div className="min-w-0">
                                <p className="truncate text-[14px] font-bold tracking-[-0.02em]">Learn With Flevian</p>
                                <p className="mt-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">Admin Portal</p>
                            </div>
                        </Link>

                        <button
                            type="button"
                            onClick={() => setSidebarOpen(false)}
                            className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
                            aria-label="Close navigation"
                        >
                            <Icon name="x" className="h-5 w-5" />
                        </button>
                    </div>

                    <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-6">
                        {sections.map((section) => (
                            <div key={section.label} className="mb-8">
                                <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                                    {section.label}
                                </p>
                                <div className="mt-3 space-y-1">
                                    {section.items.map((item) => {
                                        const active = item.enabled && (pathname === item.href || pathname.startsWith(`${item.href}/`))

                                        if (item.enabled) {
                                            return (
                                                <Link
                                                    key={item.label}
                                                    href={item.href}
                                                    onClick={() => setSidebarOpen(false)}
                                                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                                                        active
                                                            ? 'bg-[#edf4ff] text-[#1554c0] ring-1 ring-inset ring-[#1554c0]/[0.07] before:absolute before:left-0 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-[#1554c0] dark:bg-[#172945]/70 dark:text-[#6ba3ff] dark:before:bg-[#6ba3ff]'
                                                            : 'text-[#53627a] hover:bg-[#f7f9fd] hover:text-[#172033] dark:text-[#aab7cc] dark:hover:bg-slate-900/70 dark:hover:text-white'
                                                    }`}
                                                >
                                                    <Icon name={item.icon} className="h-[17px] w-[17px] shrink-0" />
                                                    <span>{item.label}</span>
                                                </Link>
                                            )
                                        }

                                        return (
                                            <div
                                                key={item.label}
                                                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-400 dark:text-slate-600"
                                                title="Admin module coming next"
                                            >
                                                <Icon name={item.icon} className="h-[17px] w-[17px] shrink-0" />
                                                <span>{item.label}</span>
                                                <span className="ml-auto rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                                    Soon
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>

                    <div className="shrink-0 border-t border-slate-100 p-3 dark:border-slate-800">
                        <div className="rounded-2xl border border-[#dfe7f3] bg-gradient-to-br from-[#f8fbff] via-white to-[#f6f4ff] p-4 shadow-[0_6px_20px_rgba(21,84,192,0.025)] dark:border-[#273753] dark:from-[#101827] dark:via-[#111b2d] dark:to-[#17152d] dark:shadow-[0_10px_28px_rgba(0,0,0,0.18)]">
                            <div className="flex items-center gap-3">
                                {avatar ? (
                                    <img src={avatar} alt="" className="h-10 w-10 rounded-xl object-cover" />
                                ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf4ff] text-[11px] font-bold text-[#1554c0] dark:bg-[#172945] dark:text-[#8bb8ff]">
                                        {initials(admin.name)}
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p className="truncate text-[13px] font-semibold text-slate-800 dark:text-white">{admin.name}</p>
                                    <p className="truncate text-[10px] text-slate-400">Administrator</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                <div className="min-w-0 lg:pl-[252px]">
                    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-slate-800/80 dark:bg-[#0b1020]/85">
                        <div className="flex h-[82px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                            <div className="flex min-w-0 items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSidebarOpen(true)}
                                    className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 lg:hidden"
                                    aria-label="Open navigation"
                                >
                                    <Icon name="menu" className="h-5 w-5" />
                                </button>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1554c0] dark:text-[#6ba3ff]">Administration</p>
                                    <p className="truncate text-sm font-semibold text-[#172033] dark:text-white">{title}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    className="rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                                    aria-label="Search"
                                    title="Admin search will be available with the student management tools"
                                >
                                    <Icon name="search" className="h-5 w-5" />
                                </button>

                                <button
                                    type="button"
                                    onClick={toggleTheme}
                                    className="rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                                    aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                                    title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                                >
                                    <Icon name={darkMode ? 'sun' : 'moon'} className="h-5 w-5" />
                                </button>

                                <div ref={profileRef} className="relative ml-1">
                                    <button
                                        type="button"
                                        onClick={() => setProfileOpen((open) => !open)}
                                        className="flex items-center gap-2 rounded-xl p-1.5 pr-2 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                                        aria-expanded={profileOpen}
                                        aria-haspopup="menu"
                                    >
                                        {avatar ? (
                                            <img src={avatar} alt={admin.name} className="h-9 w-9 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700" />
                                        ) : (
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1554c0] to-[#6a5cff] text-xs font-bold text-white">
                                                {initials(admin.name)}
                                            </div>
                                        )}
                                        <span className="hidden max-w-[170px] truncate text-xs font-semibold text-slate-700 sm:block dark:text-slate-200">{admin.name}</span>
                                        <Icon name="chevron" className="hidden h-4 w-4 text-slate-400 sm:block" />
                                    </button>

                                    {profileOpen ? (
                                        <div
                                            className="absolute right-0 top-[calc(100%+10px)] w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(23,32,51,0.14)] dark:border-slate-700 dark:bg-[#111827] dark:shadow-[0_18px_50px_rgba(0,0,0,0.35)]"
                                            role="menu"
                                        >
                                            <div className="border-b border-slate-100 px-4 py-4 dark:border-slate-800">
                                                <div className="flex items-center gap-3">
                                                    {avatar ? (
                                                        <img src={avatar} alt={admin.name} className="h-11 w-11 rounded-xl object-cover" />
                                                    ) : (
                                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#1554c0] to-[#6a5cff] font-bold text-white">
                                                            {initials(admin.name)}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{admin.name}</p>
                                                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{admin.email}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-2">
                                                <div className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300">
                                                    <span>Administrator</span>
                                                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[#1554c0] dark:text-[#78aaff]">Admin</span>
                                                </div>
                                                <div className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300">
                                                    <span>Email 2FA</span>
                                                    <span className={admin.email_two_factor_enabled ? 'text-xs font-bold text-emerald-600 dark:text-emerald-400' : 'text-xs font-semibold text-amber-600 dark:text-amber-400'}>
                                                        {admin.email_two_factor_enabled ? 'Enabled' : 'Not enabled'}
                                                    </span>
                                                </div>
                                                <form onSubmit={handleLogout}>
                                                    <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
                                                        <Icon name="logout" className="h-4 w-4" /> Sign out
                                                    </button>
                                                </form>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </header>

                    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-5 lg:px-6 lg:py-7">
                        {children}
                        <footer className="py-8 text-center text-[10px] text-slate-400 dark:text-slate-600">
                            Learn With Flevian LMS · Administrative workspace.
                        </footer>
                    </main>
                </div>
            </div>
        </>
    )
}
