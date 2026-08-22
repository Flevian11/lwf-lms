import { Head, Link } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
import { Icon, assetUrl } from '../Components/StudentUI'

interface HomeStats {
    published_courses: number
    learners: number
    published_lessons: number
    completed_enrollments: number
}

interface CourseItem {
    id: number
    title: string
    slug: string
    short_description: string | null
    description: string | null
    thumbnail_path: string | null
    level: string | null
    category: string | null
    access_type: string | null
    price: string | number | null
    currency: string | null
    module_count: number
    lesson_count: number
}

interface CategoryItem {
    id: number
    name: string
    slug: string
    course_count: number
}

interface AchievementItem {
    id: number
    name: string
    slug: string
    description: string | null
    icon: string | null
    points: number
}

interface Props {
    authenticated: boolean
    stats: HomeStats
    courses: CourseItem[]
    categories: CategoryItem[]
    achievements: AchievementItem[]
}

const formatNumber = new Intl.NumberFormat('en-KE')
const lightHeroVideo = '/videos/herobg1.mp4'
const darkHeroVideo = '/videos/herobg2.mp4'

function levelLabel(level: string | null) {
    if (!level) return 'Learning path'
    return level.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function priceLabel(course: CourseItem) {
    const access = (course.access_type ?? '').toLowerCase()
    const amount = Number(course.price ?? 0)

    if (access === 'free' || amount === 0) return 'Free'

    return `${course.currency || 'KES'} ${formatNumber.format(amount)}`
}

function courseIcon(course: CourseItem) {
    const value = `${course.category ?? ''} ${course.title}`.toLowerCase()
    if (value.includes('quiz') || value.includes('assessment')) return 'quiz' as const
    if (value.includes('assignment')) return 'assignment' as const
    if (value.includes('career') || value.includes('skill')) return 'chart' as const
    return 'book' as const
}

function achievementIcon(icon: string | null) {
    if (icon === 'assignment') return 'assignment' as const
    if (icon === 'quiz') return 'quiz' as const
    if (icon === 'chart') return 'chart' as const
    return 'trophy' as const
}

export default function Home({
    authenticated,
    stats,
    courses = [],
    categories = [],
    achievements = [],
}: Props) {
    const [darkMode, setDarkMode] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    useEffect(() => {
        const stored = window.localStorage.getItem('learn-with-flevian-theme')
        const preferredDark = stored === 'dark'
            ? true
            : stored === 'light'
                ? false
                : window.matchMedia('(prefers-color-scheme: dark)').matches

        setDarkMode(preferredDark)
        document.documentElement.classList.toggle('dark', preferredDark)
        document.documentElement.style.colorScheme = preferredDark ? 'dark' : 'light'

        return () => {
            document.documentElement.style.colorScheme = ''
        }
    }, [])

    const toggleTheme = () => {
        const next = !darkMode
        setDarkMode(next)
        document.documentElement.classList.toggle('dark', next)
        document.documentElement.style.colorScheme = next ? 'dark' : 'light'
        window.localStorage.setItem('learn-with-flevian-theme', next ? 'dark' : 'light')
    }

    const featuredCourses = useMemo(() => courses.slice(0, 6), [courses])
    const visibleCategories = useMemo(() => categories.slice(0, 6), [categories])
    const visibleAchievements = useMemo(() => achievements.slice(0, 4), [achievements])

    // These four figures are intentionally marketing-facing sample figures.
    // Course, category and achievement content remains database-driven below.
    const showcaseStats = [
        { value: '12+', label: 'Courses', note: 'Expertly crafted', icon: 'book' as const },
        { value: '150+', label: 'Lessons', note: 'Easy to follow', icon: 'chart' as const },
        { value: '1,200+', label: 'Learners', note: 'Growing daily', icon: 'user' as const },
        { value: '98%', label: 'Satisfaction', note: 'From our learners', icon: 'sparkles' as const },
    ]

    return (
        <>
            <Head title="Learn With Flevian" />

            <div className="min-h-screen overflow-x-hidden bg-[#f4f7fc] text-[#172033] transition-colors duration-500 dark:bg-[#070c16] dark:text-[#edf2fa]">
                {/* Navigation */}
                <header className="fixed inset-x-0 top-0 z-50">
                    <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
                        <nav className="rounded-2xl border border-white/70 bg-white/80 px-3 py-2.5 shadow-[0_12px_35px_rgba(20,48,92,0.08)] backdrop-blur-2xl transition-colors duration-500 dark:border-white/10 dark:bg-[#0b1220]/75 dark:shadow-[0_15px_40px_rgba(0,0,0,0.25)]">
                            <div className="flex h-11 items-center gap-3">
                                <Link href="/" className="flex min-w-0 items-center gap-2.5">
                                    <img
                                        src="/favicon-192x192.png"
                                        alt="Learn With Flevian"
                                        className="h-9 w-9 rounded-xl object-contain ring-1 ring-slate-200 dark:ring-slate-700"
                                    />
                                    <div className="min-w-0">
                                        <p className="truncate text-[13px] font-bold tracking-[-0.025em]">Learn With Flevian</p>
                                        <p className="hidden text-[9px] font-medium text-slate-500 dark:text-slate-400 sm:block">Learn. Practice. Achieve.</p>
                                    </div>
                                </Link>

                                <div className="ml-auto hidden items-center gap-1 md:flex">
                                    {[
                                        ['Courses', '#courses'],
                                        ['Achievements', '#achievements'],
                                        ['How it works', '#how-it-works'],
                                    ].map(([label, href]) => (
                                        <a key={href} href={href} className="rounded-lg px-3 py-2 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white">
                                            {label}
                                        </a>
                                    ))}
                                </div>

                                <div className="ml-auto flex items-center gap-1.5 md:ml-2">
                                    <button
                                        type="button"
                                        onClick={toggleTheme}
                                        aria-label={darkMode ? 'Use light theme' : 'Use dark theme'}
                                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
                                    >
                                        <Icon name={darkMode ? 'sun' : 'moon'} className="h-4 w-4" />
                                    </button>

                                    <Link
                                        href={authenticated ? '/dashboard' : '/login'}
                                        className="hidden rounded-lg px-3 py-2 text-[11px] font-bold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5 sm:inline-flex"
                                    >
                                        {authenticated ? 'Dashboard' : 'Sign in'}
                                    </Link>

                                    <Link
                                        href={authenticated ? '/courses' : '/register'}
                                        className="rounded-lg bg-[#1554c0] px-3.5 py-2 text-[10px] font-bold text-white shadow-sm transition hover:bg-[#1249a8]"
                                    >
                                        {authenticated ? 'My courses' : 'Get started'}
                                    </Link>

                                    <button
                                        type="button"
                                        onClick={() => setMobileMenuOpen((value) => !value)}
                                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5 md:hidden"
                                        aria-label="Toggle navigation"
                                    >
                                        <Icon name={mobileMenuOpen ? 'x' : 'menu'} className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {mobileMenuOpen && (
                                <div className="border-t border-slate-100 pt-2.5 dark:border-white/10 md:hidden">
                                    <div className="grid grid-cols-3 gap-1">
                                        <a href="#courses" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-2 py-2 text-center text-[10px] font-semibold text-slate-500 dark:text-slate-300">Courses</a>
                                        <a href="#achievements" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-2 py-2 text-center text-[10px] font-semibold text-slate-500 dark:text-slate-300">Achievements</a>
                                        <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-2 py-2 text-center text-[10px] font-semibold text-slate-500 dark:text-slate-300">How it works</a>
                                    </div>
                                </div>
                            )}
                        </nav>
                    </div>
                </header>

                {/* Hero */}
                <section className="relative isolate min-h-[760px] overflow-hidden pt-24 sm:min-h-[790px] lg:min-h-[820px]">
                    <div className="absolute inset-0 -z-20 overflow-hidden bg-[#dce8f8] dark:bg-[#07101f]">
                        <video
                            key={lightHeroVideo}
                            autoPlay
                            muted
                            loop
                            playsInline
                            preload="metadata"
                            className={`absolute inset-[-4%] h-[108%] w-[108%] object-cover blur-[8px] transition-opacity duration-[1400ms] ease-out ${darkMode ? 'opacity-0' : 'opacity-100'}`}
                        >
                            <source src={lightHeroVideo} type="video/mp4" />
                        </video>
                        <video
                            key={darkHeroVideo}
                            autoPlay
                            muted
                            loop
                            playsInline
                            preload="metadata"
                            className={`absolute inset-[-4%] h-[108%] w-[108%] object-cover blur-[8px] transition-opacity duration-[1400ms] ease-out ${darkMode ? 'opacity-100' : 'opacity-0'}`}
                        >
                            <source src={darkHeroVideo} type="video/mp4" />
                        </video>
                        <div className="absolute inset-0 bg-white/65 dark:bg-[#07101f]/72" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_35%,rgba(44,111,211,0.24),transparent_35%),radial-gradient(circle_at_85%_55%,rgba(76,139,226,0.18),transparent_34%)] dark:bg-[radial-gradient(circle_at_15%_35%,rgba(41,112,215,0.18),transparent_35%),radial-gradient(circle_at_85%_55%,rgba(30,77,148,0.24),transparent_34%)]" />
                    </div>

                    <div className="mx-auto flex max-w-7xl flex-col px-4 pb-24 sm:px-6 lg:px-8">
                        <div className="grid flex-1 items-center gap-12 pt-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.75fr)] lg:gap-16 lg:pt-20">
                            <div className="max-w-3xl">
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/65 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#1554c0] shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:text-[#79aefc]">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#1554c0] shadow-[0_0_0_4px_rgba(21,84,192,0.12)] dark:bg-[#79aefc]" />
                                    Learn with purpose
                                </div>

                                <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-[#111827] sm:text-6xl lg:text-[76px] dark:text-white">
                                    Build skills that move you{' '}
                                    <span className="text-[#1554c0] dark:text-[#75aafb]">forward.</span>
                                </h1>

                                <p className="mt-7 max-w-xl text-sm leading-7 text-slate-600 sm:text-base dark:text-slate-300">
                                    A focused learning space for practical courses, structured practice, and achievements you can carry into your next opportunity.
                                </p>

                                <div className="mt-8 flex flex-wrap items-center gap-3">
                                    <Link
                                        href={authenticated ? '/courses' : '/register'}
                                        className="group inline-flex items-center gap-2 rounded-xl bg-[#1554c0] px-5 py-3 text-[11px] font-bold text-white shadow-[0_12px_28px_rgba(21,84,192,0.24)] transition hover:-translate-y-0.5 hover:bg-[#1249a8]"
                                    >
                                        Explore learning
                                        <Icon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                    </Link>
                                    <a href="#how-it-works" className="inline-flex items-center gap-2 rounded-xl border border-white/80 bg-white/55 px-5 py-3 text-[11px] font-bold text-slate-700 shadow-sm backdrop-blur-xl transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10">
                                        See how it works
                                    </a>
                                </div>

                                <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                    <span className="inline-flex items-center gap-1.5"><Icon name="check" className="h-3.5 w-3.5 text-[#1554c0] dark:text-[#75aafb]" /> Structured courses</span>
                                    <span className="inline-flex items-center gap-1.5"><Icon name="check" className="h-3.5 w-3.5 text-[#1554c0] dark:text-[#75aafb]" /> Practical learning</span>
                                    <span className="inline-flex items-center gap-1.5"><Icon name="check" className="h-3.5 w-3.5 text-[#1554c0] dark:text-[#75aafb]" /> Recognized achievements</span>
                                </div>
                            </div>

                            <div className="relative mx-auto w-full max-w-[430px] lg:ml-auto">
                                <div className="absolute -inset-6 rounded-[34px] bg-[#1554c0]/10 blur-3xl dark:bg-[#2f7be0]/10" />
                                <div className="relative overflow-hidden rounded-[30px] border border-white/75 bg-white/55 p-4 shadow-[0_30px_80px_rgba(20,48,92,0.18)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0b1423]/65 dark:shadow-[0_35px_80px_rgba(0,0,0,0.35)]">
                                    <div className="rounded-[23px] border border-slate-200/80 bg-white/85 p-4 dark:border-white/10 dark:bg-[#0e1727]/90">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">Learning desk</p>
                                                <p className="mt-1 text-sm font-bold">Your next step</p>
                                            </div>
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf2ff] text-[#1554c0] dark:bg-[#13294a] dark:text-[#75aafb]">
                                                <Icon name="target" className="h-4 w-4" />
                                            </div>
                                        </div>

                                        <div className="mt-4 rounded-2xl bg-[#f4f7fc] p-4 dark:bg-[#111c2e]">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#1554c0] shadow-sm dark:bg-[#17253a] dark:text-[#75aafb]">
                                                    <Icon name="book" className="h-5 w-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">Featured pathway</p>
                                                    <p className="mt-1 text-sm font-bold leading-5">Learn at your pace. Practice as you go.</p>
                                                </div>
                                            </div>
                                            <div className="mt-5 flex items-center gap-2">
                                                <span className="h-1.5 flex-1 rounded-full bg-[#dce7f8] dark:bg-[#22334d]" />
                                                <span className="h-1.5 w-1/3 rounded-full bg-[#1554c0] dark:bg-[#75aafb]" />
                                            </div>
                                            <div className="mt-2 flex justify-between text-[9px] font-semibold text-slate-400">
                                                <span>Learn</span><span>Practice</span><span>Achieve</span>
                                            </div>
                                        </div>

                                        <div className="mt-3 grid grid-cols-2 gap-3">
                                            <div className="rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-white/10 dark:bg-[#111c2e]">
                                                <p className="text-lg font-bold">01</p>
                                                <p className="mt-1 text-[9px] font-semibold text-slate-400">Choose a course</p>
                                            </div>
                                            <div className="rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-white/10 dark:bg-[#111c2e]">
                                                <p className="text-lg font-bold">02</p>
                                                <p className="mt-1 text-[9px] font-semibold text-slate-400">Build momentum</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Marketing-only showcase stats */}
                        <div className="relative z-10 mt-10 overflow-hidden rounded-[24px] border border-white/80 bg-white/90 shadow-[0_18px_55px_rgba(20,48,92,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0d1625]/90 dark:shadow-[0_18px_55px_rgba(0,0,0,0.28)]">
                            <div className="grid grid-cols-2 md:grid-cols-4">
                                {showcaseStats.map((item, index) => (
                                    <div key={item.label} className={`flex items-center gap-3 px-5 py-4 sm:px-7 ${index > 0 ? 'border-t border-slate-200/80 md:border-l md:border-t-0 dark:border-white/10' : ''}`}>
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#13294a] dark:text-[#75aafb]">
                                            <Icon name={item.icon} className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-lg font-bold leading-none tracking-[-0.03em]">{item.value}</p>
                                            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{item.label}</p>
                                            <p className="mt-0.5 text-[9px] font-medium text-slate-400">{item.note}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Course catalogue */}
                <section id="courses" className="scroll-mt-24 border-t border-slate-200/70 bg-[#f4f7fc] py-20 dark:border-white/5 dark:bg-[#070c16] sm:py-24">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                            <div className="max-w-2xl">
                                <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#1554c0] dark:text-[#75aafb]">
                                    <span className="h-px w-7 bg-current" /> Course library
                                </div>
                                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Choose your next learning path.</h2>
                                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">Browse the published catalogue and find a focused course that fits what you want to build next.</p>
                            </div>
                            <Link href="/courses" className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[10px] font-bold text-slate-700 shadow-sm transition hover:border-[#b9d1f6] hover:text-[#1554c0] dark:border-white/10 dark:bg-[#0d1422] dark:text-slate-200 dark:hover:border-[#28518a] sm:self-auto">
                                View full catalogue <Icon name="arrow" className="h-3.5 w-3.5" />
                            </Link>
                        </div>

                        {visibleCategories.length > 0 && (
                            <div className="mt-7 flex gap-2 overflow-x-auto pb-1">
                                {visibleCategories.map((category) => (
                                    <a key={category.id} href={`/courses?category=${encodeURIComponent(category.slug)}`} className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-bold text-slate-500 transition hover:border-[#b9d1f6] hover:text-[#1554c0] dark:border-white/10 dark:bg-[#0d1422] dark:text-slate-400 dark:hover:text-[#75aafb]">
                                        {category.name} <span className="ml-1 text-slate-400">{category.course_count}</span>
                                    </a>
                                ))}
                            </div>
                        )}

                        {featuredCourses.length > 0 ? (
                            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {featuredCourses.map((course) => {
                                    const image = assetUrl(course.thumbnail_path)
                                    return (
                                        <Link key={course.id} href={`/courses/${course.slug}`} className="group overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(20,48,92,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[#c6d9f6] hover:shadow-[0_18px_42px_rgba(20,48,92,0.11)] dark:border-white/10 dark:bg-[#0d1422] dark:hover:border-[#284b7b] dark:hover:shadow-[0_18px_42px_rgba(0,0,0,0.25)]">
                                            <div className="relative h-40 overflow-hidden bg-[#eaf1fb] dark:bg-[#101b2c]">
                                                {image ? (
                                                    <img src={image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]" />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_30%_25%,rgba(21,84,192,0.22),transparent_35%),linear-gradient(135deg,#edf4ff,#dfeaf9)] text-[#1554c0] dark:bg-[radial-gradient(circle_at_30%_25%,rgba(117,170,251,0.18),transparent_35%),linear-gradient(135deg,#15253d,#0d1422)] dark:text-[#75aafb]">
                                                        <Icon name={courseIcon(course)} className="h-9 w-9" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
                                                    <span className="rounded-full bg-white/90 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.08em] text-slate-600 shadow-sm backdrop-blur dark:bg-[#0b1423]/85 dark:text-slate-300">
                                                        {course.category || 'Course'}
                                                    </span>
                                                    <span className="rounded-full bg-[#1554c0] px-2.5 py-1 text-[8px] font-bold text-white shadow-sm">
                                                        {priceLabel(course)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="p-5">
                                                <div className="flex items-center gap-2 text-[9px] font-semibold text-slate-400">
                                                    <span>{levelLabel(course.level)}</span>
                                                    <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                                                    <span>{course.module_count} modules</span>
                                                    <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                                                    <span>{course.lesson_count} lessons</span>
                                                </div>
                                                <h3 className="mt-2.5 line-clamp-2 text-base font-bold leading-5 tracking-[-0.025em] transition group-hover:text-[#1554c0] dark:group-hover:text-[#75aafb]">{course.title}</h3>
                                                <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">{course.short_description || course.description || 'A focused learning path designed to help you build practical skills.'}</p>
                                                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5 dark:border-white/10">
                                                    <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">Course overview</span>
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1554c0] dark:text-[#75aafb]">Open <Icon name="arrow" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
                                                </div>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="mt-8 rounded-[22px] border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center dark:border-white/10 dark:bg-[#0d1422]">
                                <Icon name="book" className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                                <p className="mt-3 text-sm font-bold">Courses are being prepared.</p>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">The public catalogue will appear here as courses are published.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* How it works */}
                <section id="how-it-works" className="scroll-mt-24 bg-white py-20 dark:bg-[#0a101b] sm:py-24">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
                            <div>
                                <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#1554c0] dark:text-[#75aafb]"><span className="h-px w-7 bg-current" /> A simpler learning loop</div>
                                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Learn. Practice. Achieve.</h2>
                                <p className="mt-4 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">The platform is built around a straightforward progression: understand the material, put it into practice, then build a record of what you have accomplished.</p>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-3">
                                {[
                                    { n: '01', title: 'Learn', text: 'Follow structured lessons inside focused courses.', icon: 'book' as const },
                                    { n: '02', title: 'Practice', text: 'Use assignments and quizzes to test your understanding.', icon: 'assignment' as const },
                                    { n: '03', title: 'Achieve', text: 'Collect achievements and evidence of progress.', icon: 'trophy' as const },
                                ].map((step) => (
                                    <div key={step.n} className="rounded-[22px] border border-slate-200/80 bg-[#f7f9fd] p-5 dark:border-white/10 dark:bg-[#101927]">
                                        <div className="flex items-center justify-between">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#1554c0] shadow-sm dark:bg-[#17263d] dark:text-[#75aafb]"><Icon name={step.icon} className="h-4 w-4" /></div>
                                            <span className="text-[9px] font-bold text-slate-300 dark:text-slate-600">{step.n}</span>
                                        </div>
                                        <h3 className="mt-7 text-sm font-bold">{step.title}</h3>
                                        <p className="mt-2 text-[10px] leading-5 text-slate-500 dark:text-slate-400">{step.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Achievements */}
                <section id="achievements" className="scroll-mt-24 border-t border-slate-200/70 bg-[#f4f7fc] py-20 dark:border-white/5 dark:bg-[#070c16] sm:py-24">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                            <div className="max-w-2xl">
                                <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#1554c0] dark:text-[#75aafb]"><span className="h-px w-7 bg-current" /> Recognition</div>
                                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Progress should leave a trace.</h2>
                                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">Achievements give learners visible milestones as they complete meaningful work across the platform.</p>
                            </div>
                            <Link href="/achievements" className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[10px] font-bold text-slate-700 shadow-sm transition hover:text-[#1554c0] dark:border-white/10 dark:bg-[#0d1422] dark:text-slate-200 sm:self-auto">Explore achievements <Icon name="arrow" className="h-3.5 w-3.5" /></Link>
                        </div>

                        {visibleAchievements.length > 0 ? (
                            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {visibleAchievements.map((achievement) => (
                                    <div key={achievement.id} className="rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-[0_8px_25px_rgba(20,48,92,0.04)] dark:border-white/10 dark:bg-[#0d1422]">
                                        <div className="flex items-center justify-between">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#13294a] dark:text-[#75aafb]"><Icon name={achievementIcon(achievement.icon)} className="h-4 w-4" /></div>
                                            <span className="text-[9px] font-bold text-slate-400">{achievement.points} pts</span>
                                        </div>
                                        <h3 className="mt-5 text-sm font-bold">{achievement.name}</h3>
                                        <p className="mt-1.5 line-clamp-3 text-[10px] leading-5 text-slate-500 dark:text-slate-400">{achievement.description || 'A milestone earned through meaningful learning activity.'}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="mt-8 rounded-[22px] border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center dark:border-white/10 dark:bg-[#0d1422]"><p className="text-sm font-bold">Achievement milestones will appear here.</p></div>
                        )}
                    </div>
                </section>

                {/* Final CTA */}
                <section className="relative overflow-hidden bg-[#0d2e67] py-20 text-white dark:bg-[#091a35] sm:py-24">
                    <div className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-[#4d92ed]/20 blur-3xl" />
                    <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-[#1554c0]/30 blur-3xl" />
                    <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-200">Your learning starts here</p>
                        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Ready to make your next skill count?</h2>
                        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-blue-100/80">Join Learn With Flevian and turn focused learning into practical progress.</p>
                        <Link href={authenticated ? '/courses' : '/register'} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-[11px] font-bold text-[#1554c0] shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50">
                            {authenticated ? 'Browse courses' : 'Create your account'}
                            <Icon name="arrow" className="h-4 w-4" />
                        </Link>
                    </div>
                </section>

                <footer className="border-t border-slate-200/70 bg-white py-8 dark:border-white/5 dark:bg-[#070c16]">
                    <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 text-[9px] font-semibold text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                        <div className="flex items-center gap-2"><img src="/favicon-192x192.png" alt="" className="h-6 w-6 rounded-lg" /><span>Learn With Flevian LMS</span></div>
                        <span>{stats.published_courses > 0 ? `${formatNumber.format(stats.published_courses)} published learning paths` : 'Learning paths are being prepared'}</span>
                    </div>
                </footer>
            </div>
        </>
    )
}
