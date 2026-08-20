import { Head, Link, router } from '@inertiajs/react'
import type { FormEvent, ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type {
    DashboardStats,
    SearchResult,
    Student,
} from './student-types'
import { Icon, assetUrl, initials, formatDate } from './StudentUI'

interface StudentLayoutProps {
    student: Student
    stats: DashboardStats
    title?: string
    children: ReactNode
    searchCourses?: Array<{
        id: number
        title: string
        slug: string
        category: string | null
        level: string
        progress: number
    }>
    searchAssignments?: Array<{
        id: number
        title: string
        course: string | null
        due_at: string | null
    }>
    searchQuizzes?: Array<{
        id: number
        title: string
        course: string | null
        due_at: string | null
    }>
}

const learningItems = [
    { label: 'Dashboard', href: '/dashboard', icon: 'grid' as const },
    { label: 'My Courses', href: '/courses', icon: 'book' as const },
    { label: 'Assignments', href: '/assignments', icon: 'assignment' as const },
    { label: 'Quizzes', href: '/quizzes', icon: 'quiz' as const },
    { label: 'Achievements', href: '/achievements', icon: 'trophy' as const },
    { label: 'Leaderboard', href: '/leaderboard', icon: 'chart' as const },
]

const accountItems = [
    { label: 'Security', href: '/security', icon: 'shield' as const },
    { label: 'Profile', href: '/profile', icon: 'user' as const },
]

export default function StudentLayout({
    student,
    stats,
    title = 'Student Portal',
    children,
    searchCourses = [],
    searchAssignments = [],
    searchQuizzes = [],
}: StudentLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [profileOpen, setProfileOpen] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const [assistantOpen, setAssistantOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [darkMode, setDarkMode] = useState(false)

    const profileRef = useRef<HTMLDivElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)

    const avatar = assetUrl(student.avatar_path)
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '/dashboard'

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
            if (event.key !== 'Escape') return

            setProfileOpen(false)
            setSearchOpen(false)
            setSidebarOpen(false)
            setAssistantOpen(false)
        }

        document.addEventListener('pointerdown', handlePointerDown)
        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [profileOpen])

    useEffect(() => {
        if (!searchOpen) {
            setSearchQuery('')
            return
        }

        window.setTimeout(() => searchInputRef.current?.focus(), 50)
    }, [searchOpen])

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

    const searchResults = useMemo<SearchResult[]>(() => {
        const query = searchQuery.trim().toLowerCase()
        if (!query) return []

        const results: SearchResult[] = []

        searchCourses.forEach((course) => {
            if (`${course.title} ${course.category ?? ''} ${course.level}`.toLowerCase().includes(query)) {
                results.push({
                    type: 'Course',
                    title: course.title,
                    subtitle: `${course.category ?? 'Course'} · ${course.progress}% complete`,
                    href: `/courses/${course.slug}`,
                })
            }
        })

        searchAssignments.forEach((item) => {
            if (`${item.title} ${item.course ?? ''}`.toLowerCase().includes(query)) {
                results.push({
                    type: 'Assignment',
                    title: item.title,
                    subtitle: `${item.course ?? 'Course'} · ${formatDate(item.due_at)}`,
                    href: `/assignments/${item.id}`,
                })
            }
        })

        searchQuizzes.forEach((item) => {
            if (`${item.title} ${item.course ?? ''}`.toLowerCase().includes(query)) {
                results.push({
                    type: 'Quiz',
                    title: item.title,
                    subtitle: `${item.course ?? 'Course'} · ${formatDate(item.due_at)}`,
                    href: `/quizzes/${item.id}`,
                })
            }
        })

        return results.slice(0, 12)
    }, [searchQuery, searchCourses, searchAssignments, searchQuizzes])

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
                    className={`fixed inset-y-0 left-0 z-50 flex w-[252px] flex-col border-r border-slate-200/80 bg-white/95 shadow-2xl backdrop-blur-xl transition-transform duration-200 dark:border-slate-800/80 dark:bg-[#0d1422]/95 dark:shadow-black/30 lg:translate-x-0 lg:shadow-none ${
                        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                >
                    <div className="flex h-[82px] shrink-0 items-center border-b border-slate-100 px-5 dark:border-slate-800">
                        <Link
                            href="/dashboard"
                            onClick={() => setSidebarOpen(false)}
                            className="flex min-w-0 items-center gap-3"
                        >
                            <img
                                src="/favicon-192x192.png"
                                alt="Learn With Flevian"
                                className="h-10 w-10 rounded-xl object-contain shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
                            />
                            <div className="min-w-0">
                                <p className="truncate text-[14px] font-bold tracking-[-0.02em]">Learn With Flevian</p>
                                <p className="mt-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">Student Portal</p>
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
                        <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Learning</p>

                        <div className="mt-3 space-y-1">
                            {learningItems.map((item) => {
                                const active =
                                    pathname === item.href ||
                                    (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`))

                                return (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                                            active
                                                ? 'relative bg-[#edf4ff] text-[#1554c0] ring-1 ring-inset ring-[#1554c0]/[0.07] before:absolute before:left-0 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-[#1554c0] dark:bg-[#172945]/70 dark:text-[#6ba3ff] dark:ring-[#6ba3ff]/10 dark:before:bg-[#6ba3ff]'
                                                : 'text-[#53627a] hover:bg-[#f7f9fd] hover:text-[#172033] dark:text-[#aab7cc] dark:hover:bg-slate-900/70 dark:hover:text-white'
                                        }`}
                                    >
                                        <Icon name={item.icon} className="h-[17px] w-[17px] shrink-0" />
                                        <span>{item.label}</span>
                                    </Link>
                                )
                            })}
                        </div>

                        <p className="mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Account</p>

                        <div className="mt-3 space-y-1">
                            {accountItems.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                                        pathname === item.href
                                            ? 'bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945]/70 dark:text-[#6ba3ff]'
                                            : 'text-[#53627a] hover:bg-slate-50 hover:text-[#172033] dark:text-[#aab7cc] dark:hover:bg-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    <Icon name={item.icon} className="h-[17px] w-[17px]" />
                                    <span>{item.label}</span>
                                </Link>
                            ))}
                        </div>

                        <div className="mt-8 rounded-2xl border border-[#dfe7f3] bg-gradient-to-br from-[#f8fbff] via-white to-[#f6f4ff] p-4 shadow-[0_6px_20px_rgba(21,84,192,0.025)] dark:border-[#273753] dark:from-[#101827] dark:via-[#111b2d] dark:to-[#17152d] dark:shadow-[0_10px_28px_rgba(0,0,0,0.18)]">
                            <div className="flex items-center justify-between">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#1554c0] shadow-sm ring-1 ring-[#1554c0]/[0.05] dark:bg-[#1a2941] dark:text-[#6ba3ff] dark:ring-[#6ba3ff]/10">
                                    <Icon name="flame" className="h-4 w-4" />
                                </div>
                                <span className="text-[10px] font-semibold tracking-wide text-slate-400 dark:text-slate-500">Learning streak</span>
                            </div>
                            <div className="mt-4 flex items-end justify-between">
                                <div>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.streak.current}</p>
                                    <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">consecutive days</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{stats.streak.longest}</p>
                                    <p className="text-[10px] text-slate-400">best streak</p>
                                </div>
                            </div>
                        </div>
                    </nav>

                    <div className="shrink-0 border-t border-slate-100 p-3 dark:border-slate-800">
                        <Link
                            href="/support"
                            onClick={() => setSidebarOpen(false)}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-slate-500 transition hover:bg-[#edf4ff] hover:text-[#1554c0] dark:text-slate-400 dark:hover:bg-[#172945]/70 dark:hover:text-[#6ba3ff]"
                        >
                            <Icon name="support" className="h-[17px] w-[17px]" />
                            Get support
                        </Link>

                        <form onSubmit={handleLogout} className="mt-1">
                            <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400">
                                <Icon name="logout" className="h-[17px] w-[17px]" />
                                Sign out
                            </button>
                        </form>
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
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1554c0] dark:text-[#6ba3ff]">Student Portal</p>
                                    <p className="truncate text-sm font-semibold text-[#172033] dark:text-white">Learn With Flevian</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setSearchOpen(true)}
                                    className="rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                                    aria-label="Search"
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
                                            <img src={avatar} alt={student.name} className="h-9 w-9 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700" />
                                        ) : (
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1554c0] to-[#6a5cff] text-xs font-bold text-white">
                                                {initials(student.name)}
                                            </div>
                                        )}
                                        <span className="hidden max-w-[130px] truncate text-xs font-semibold text-slate-700 dark:text-slate-200 sm:block">{student.name}</span>
                                        <Icon name="chevron" className={`h-3.5 w-3.5 text-slate-400 transition-transform ${profileOpen ? 'rotate-90' : ''}`} />
                                    </button>

                                    {profileOpen ? (
                                        <div
                                            className="absolute right-0 top-[calc(100%+10px)] w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(23,32,51,0.14)] dark:border-slate-700 dark:bg-[#111827] dark:shadow-[0_18px_50px_rgba(0,0,0,0.35)]"
                                            role="menu"
                                        >
                                            <div className="border-b border-slate-100 px-4 py-4 dark:border-slate-800">
                                                <div className="flex items-center gap-3">
                                                    {avatar ? (
                                                        <img src={avatar} alt={student.name} className="h-11 w-11 rounded-xl object-cover" />
                                                    ) : (
                                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#1554c0] to-[#6a5cff] font-bold text-white">
                                                            {initials(student.name)}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{student.name}</p>
                                                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{student.email}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-2">
                                                <Link href="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                                                    <Icon name="user" className="h-4 w-4" /> Profile
                                                </Link>
                                                <Link href="/security" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                                                    <Icon name="shield" className="h-4 w-4" /> Security
                                                </Link>
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
                            Learn With Flevian LMS · Your learning journey, tracked dynamically.
                        </footer>
                    </main>
                </div>

                {searchOpen ? (
                    <div
                        className="fixed inset-0 z-[70] flex items-start justify-center bg-slate-950/50 px-4 pt-[12vh] backdrop-blur-sm"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Search"
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) setSearchOpen(false)
                        }}
                    >
                        <div
                            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_25px_80px_rgba(0,0,0,0.22)] dark:border-slate-700 dark:bg-[#111827]"
                            onMouseDown={(event) => event.stopPropagation()}
                        >
                            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                                <Icon name="search" className="h-5 w-5 shrink-0 text-slate-400" />
                                <input
                                    ref={searchInputRef}
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    placeholder="Search courses, assignments, quizzes..."
                                    className="min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                                />
                                <button type="button" onClick={() => setSearchOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close search">
                                    <Icon name="x" className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="max-h-[55vh] overflow-y-auto p-2">
                                {!searchQuery.trim() ? (
                                    <div className="px-6 py-12 text-center">
                                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                            <Icon name="search" className="h-5 w-5" />
                                        </div>
                                        <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">Search your learning space</p>
                                        <p className="mt-1 text-xs text-slate-400">Search courses, assignments and quizzes instantly.</p>
                                    </div>
                                ) : searchResults.length ? (
                                    <div className="space-y-1">
                                        {searchResults.map((result) => (
                                            <Link
                                                key={`${result.type}-${result.title}-${result.href}`}
                                                href={result.href}
                                                onClick={() => setSearchOpen(false)}
                                                className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800"
                                            >
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1554c0]/[0.07] text-[#1554c0] dark:bg-[#4c8dff]/10 dark:text-[#6ba3ff]">
                                                    <Icon name={result.type === 'Quiz' ? 'quiz' : result.type === 'Assignment' ? 'assignment' : 'book'} className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{result.title}</p>
                                                    <p className="mt-0.5 truncate text-[10px] text-slate-500 dark:text-slate-400">{result.type} · {result.subtitle}</p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="px-6 py-12 text-center">
                                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                            <Icon name="search" className="h-5 w-5" />
                                        </div>
                                        <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">No matching content</p>
                                        <p className="mt-1 text-xs text-slate-400">Try a course, assignment or quiz name.</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-[10px] text-slate-400 dark:border-slate-800 dark:bg-slate-950/50">
                                <span>Live dashboard search</span>
                                <span>Esc to close</span>
                            </div>
                        </div>
                    </div>
                ) : null}

                <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-end px-5 sm:bottom-6 sm:px-6 lg:pr-7">
                    <div className="pointer-events-auto relative">
                        {assistantOpen ? (
                            <div className="absolute bottom-[4.5rem] right-0 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.16)] dark:border-slate-700 dark:bg-[#111827] dark:shadow-[0_18px_55px_rgba(0,0,0,0.35)]">
                                <div className="bg-gradient-to-r from-[#1554c0] to-[#6a5cff] px-4 py-3 text-white">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                                                <Icon name="chatbot" className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold">TechGhost AI</p>
                                                <p className="text-[10px] text-blue-100">Your learning assistant</p>
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => setAssistantOpen(false)} className="rounded-lg p-1.5 text-white/75 transition hover:bg-white/10 hover:text-white" aria-label="Close TechGhost AI">
                                            <Icon name="x" className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="px-4 py-5 text-center">
                                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#6ba3ff]">
                                        <Icon name="sparkles" className="h-5 w-5" />
                                    </div>
                                    <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">TechGhost AI is ready</p>
                                    <p className="mx-auto mt-1.5 max-w-[275px] text-xs leading-5 text-slate-500 dark:text-slate-400">
                                        Ask about your courses, lessons, assignments, quizzes and learning progress.
                                    </p>
                                    <span className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                        AI integration coming next
                                    </span>
                                </div>
                            </div>
                        ) : null}

                        <button
                            type="button"
                            onClick={() => setAssistantOpen((open) => !open)}
                            className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1554c0] to-[#6a5cff] text-white shadow-[0_12px_30px_rgba(21,84,192,0.28)] ring-4 ring-white/80 transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(21,84,192,0.34)] dark:ring-[#0b1020]/80"
                            aria-label="Open TechGhost AI"
                            aria-expanded={assistantOpen}
                            title="TechGhost AI"
                        >
                            <Icon name="chatbot" className="relative h-6 w-6" />
                            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400 dark:border-[#0b1020]" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
