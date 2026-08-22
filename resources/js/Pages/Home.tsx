import { Head, Link } from '@inertiajs/react'
import { useEffect, useMemo, useRef, useState } from 'react'

interface CourseItem {
    id: number
    title: string
    slug: string
    short_description: string | null
    thumbnail_path: string | null
    level: string
    access_type: string | null
    price: string | number | null
    currency: string | null
    category: { name: string; slug: string } | null
    modules_count: number
    lessons_count: number
}

interface AchievementItem {
    id: number
    name: string
    description: string
    icon: string | null
    points: number
}

interface Props {
    courses: CourseItem[]
    publishedCourses: number
    publishedLessons: number
    achievements: AchievementItem[]
}

const LIGHT_VIDEO = '/videos/hero-bg2.mp4'
const DARK_VIDEO = '/videos/hero-bg1.mp4'
const CTA_VIDEO = '/videos/cta-bg.mp4'
const SITE_URL = 'https://lwf.yaliid.cloud'

function assetUrl(path: string | null): string | null {
    if (!path) return null
    if (/^(https?:\/\/|\/)/.test(path)) return path
    return `/storage/${path}`
}

function formatPrice(price: string | number | null, currency: string | null, accessType: string | null) {
    if (accessType === 'free' || accessType === 'free_for_demo') return 'Free'
    if (price === null || price === undefined || price === '') return 'Contact for access'

    return `${currency || 'KES'} ${Number(price).toLocaleString('en-KE')}`
}

function levelLabel(value: string): string {
    return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
}

export default function Home({ courses, publishedCourses, publishedLessons, achievements }: Props) {
    const [darkMode, setDarkMode] = useState(false)
    const [expandedCourse, setExpandedCourse] = useState<number | null>(null)
    const lightRef = useRef<HTMLVideoElement>(null)
    const darkRef = useRef<HTMLVideoElement>(null)

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
    }, [])

    useEffect(() => {
        const active = darkMode ? darkRef.current : lightRef.current
        active?.play().catch(() => undefined)
    }, [darkMode])

    const toggleTheme = () => {
        const next = !darkMode
        setDarkMode(next)
        document.documentElement.classList.toggle('dark', next)
        document.documentElement.style.colorScheme = next ? 'dark' : 'light'
        window.localStorage.setItem('learn-with-flevian-theme', next ? 'dark' : 'light')
    }

    const categories = useMemo(() => {
        const map = new Map<string, { name: string; slug: string; count: number }>()
        courses.forEach(course => {
            if (!course.category) return
            const current = map.get(course.category.slug)
            map.set(course.category.slug, {
                name: course.category.name,
                slug: course.category.slug,
                count: (current?.count || 0) + 1,
            })
        })
        return Array.from(map.values())
    }, [courses])

    return (
        <>
            <Head>
                <title>Learn With Flevian — Online Learning &amp; Skills Platform in Kenya</title>
                <meta name="description" content="Learn With Flevian is an online learning platform for practical courses, programming, web development, technology skills, structured learning and meaningful achievements." />
                <meta name="keywords" content="online learning Kenya, LMS Kenya, online courses Kenya, programming courses, web development courses, coding courses, technology education, digital skills, online certificates, Learn With Flevian, Flevian LMS" />
                <meta name="author" content="Flevian Ochoka" />
                <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
                <meta name="theme-color" content="#1554c0" />
                <meta name="geo.region" content="KE" />
                <meta name="geo.placename" content="Nairobi" />
                <link rel="canonical" href={`${SITE_URL}/`} />
                <link rel="alternate" href={`${SITE_URL}/`} hrefLang="en-ke" />
                <link rel="alternate" href={`${SITE_URL}/`} hrefLang="en" />
                <link rel="alternate" href={`${SITE_URL}/`} hrefLang="x-default" />
                <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={`${SITE_URL}/`} />
                <meta property="og:title" content="Learn With Flevian — Practical Online Learning in Kenya" />
                <meta property="og:description" content="Build practical skills through focused online courses, structured learning and achievements with Learn With Flevian LMS." />
                <meta property="og:site_name" content="Learn With Flevian LMS" />
                <meta property="og:locale" content="en_KE" />
                <meta name="twitter:card" content="summary" />
                <meta name="twitter:title" content="Learn With Flevian — Online Learning Platform" />
                <meta name="twitter:description" content="Practical courses, focused learning and meaningful achievements from Learn With Flevian LMS." />
                <script type="application/ld+json">{JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': 'EducationalOrganization',
                    name: 'Learn With Flevian LMS',
                    description: 'Online learning platform offering practical courses, structured learning and achievements.',
                    url: SITE_URL,
                    logo: `${SITE_URL}/favicon-32x32.png`,
                    address: { '@type': 'PostalAddress', addressCountry: 'KE', addressLocality: 'Nairobi' },
                    knowsAbout: ['Online learning', 'Programming', 'Web development', 'Technology skills', 'Digital skills'],
                    hasCourse: courses.slice(0, 6).map(course => ({
                        '@type': 'Course',
                        name: course.title,
                        description: course.short_description || `Learn ${course.title} through structured online lessons.`,
                        url: `${SITE_URL}/#courses`,
                        provider: { '@type': 'EducationalOrganization', name: 'Learn With Flevian LMS', sameAs: SITE_URL },
                    })),
                })}</script>
            </Head>

            <main className="min-h-screen bg-[#f4f7fc] text-[#172033] transition-colors duration-500 dark:bg-[#080d18] dark:text-[#edf2fa]">
                <header className="relative z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl dark:border-slate-800/70 dark:bg-[#0b1220]/85">
                    <div className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between px-5 sm:px-8">
                        <a href="#top" className="flex items-center gap-3">
                            <img src="/favicon-192x192.png" alt="Learn With Flevian" className="h-10 w-10 rounded-xl object-contain ring-1 ring-slate-200 dark:ring-slate-700" />
                            <div>
                                <p className="text-[13px] font-bold tracking-[-0.02em]">Learn With Flevian</p>
                                <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400">Learning platform</p>
                            </div>
                        </a>

                        <nav className="hidden items-center gap-7 text-[12px] font-semibold text-slate-500 md:flex dark:text-slate-400">
                            <a className="text-[#1554c0]" href="#top">Home</a>
                            <a href="#courses" className="transition hover:text-[#1554c0]">Courses</a>
                            <a href="#achievements" className="transition hover:text-[#1554c0]">Achievements</a>
                            <a href="#how-it-works" className="transition hover:text-[#1554c0]">How it works</a>
                        </nav>

                        <div className="flex items-center gap-2.5">
                            <button type="button" onClick={toggleTheme} aria-label="Toggle theme" className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:text-[#1554c0] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                <span className="text-sm">{darkMode ? '☀' : '◐'}</span>
                            </button>
                            <Link href="/login" className="hidden rounded-xl px-3 py-2 text-[11px] font-bold text-slate-600 sm:block dark:text-slate-300">Sign in</Link>
                            <Link href="/register" className="rounded-xl bg-[#1554c0] px-4 py-2.5 text-[11px] font-bold text-white shadow-[0_8px_20px_rgba(21,84,192,.22)] transition hover:bg-[#1249a7]">Get started</Link>
                        </div>
                    </div>
                </header>

                <section id="top" className="relative isolate overflow-hidden border-b border-slate-200/60 dark:border-slate-800/70">
                    <div className="absolute inset-0 bg-[#eef4ff] dark:bg-[#071225]" />
                    <video ref={lightRef} className={`absolute inset-0 h-full w-full object-cover scale-[1.04] blur-[5px] transition-opacity duration-[1200ms] ${darkMode ? 'opacity-0' : 'opacity-[.70]'}`} src={LIGHT_VIDEO} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />
                    <video ref={darkRef} className={`absolute inset-0 h-full w-full object-cover scale-[1.04] blur-[5px] transition-opacity duration-[1200ms] ${darkMode ? 'opacity-[.52]' : 'opacity-0'}`} src={DARK_VIDEO} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />
                    <div className="absolute inset-0 bg-white/40 dark:bg-[#071225]/62" />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/40 to-[#f4f7fc] dark:from-[#071225]/70 dark:via-[#071225]/55 dark:to-[#080d18]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(21,84,192,.16),transparent_48%)] dark:bg-[radial-gradient(circle_at_50%_28%,rgba(67,121,255,.18),transparent_48%)]" />

                    <div className="relative mx-auto flex min-h-[720px] max-w-[1240px] flex-col items-center justify-center px-5 py-24 text-center sm:px-8 sm:py-28 lg:py-32">
                        <span className="inline-flex items-center gap-2 rounded-full border border-[#1554c0]/15 bg-white/80 px-3.5 py-2 text-[9px] font-bold uppercase tracking-[.2em] text-[#1554c0] shadow-sm backdrop-blur-md dark:border-blue-300/15 dark:bg-[#101b31]/75 dark:text-[#8bb8ff]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#1554c0] dark:bg-[#8bb8ff]" />
                            Empower. Learn. Achieve.
                        </span>

                        <h1 className="mt-7 max-w-5xl text-[46px] font-bold leading-[.98] tracking-[-.055em] text-[#0b1020] sm:text-[66px] lg:text-[78px] dark:text-white">
                            Build skills that move <span className="text-[#1554c0] dark:text-[#78aaff]">you</span><br className="hidden sm:block" /> forward.
                        </h1>

                        <p className="mt-6 max-w-2xl text-[14px] leading-6 text-slate-600 sm:text-[16px] dark:text-slate-300">
                            Practical courses, focused learning paths, and achievements designed to help you learn with confidence and turn knowledge into progress.
                        </p>

                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                            <a href="#courses" className="rounded-xl bg-[#1554c0] px-5 py-3 text-[11px] font-bold text-white shadow-[0_12px_28px_rgba(21,84,192,.25)] transition hover:-translate-y-0.5 hover:bg-[#1249a7]">Explore courses <span className="ml-1">→</span></a>
                            <a href="#how-it-works" className="rounded-xl border border-slate-300/80 bg-white/75 px-5 py-3 text-[11px] font-bold text-slate-700 backdrop-blur-md transition hover:-translate-y-0.5 dark:border-slate-700 dark:bg-[#101827]/75 dark:text-slate-200">See how it works</a>
                        </div>

                        <div className="mt-16 grid w-full max-w-[900px] grid-cols-2 overflow-hidden rounded-[22px] border border-slate-200/80 bg-white/88 text-left shadow-[0_24px_60px_rgba(30,60,120,.12)] backdrop-blur-xl sm:grid-cols-4 dark:border-slate-700/80 dark:bg-[#0f192a]/88 dark:shadow-[0_24px_60px_rgba(0,0,0,.22)]">
                            {[
                                [publishedCourses || 0, 'Courses', 'Published learning'],
                                [publishedLessons || 0, 'Lessons', 'Practical & focused'],
                                ['1,200+', 'Learners', 'Growing every day'],
                                ['98%', 'Satisfaction', 'Built around learners'],
                            ].map(([value, label, detail], index) => (
                                <div key={label} className={`flex items-center gap-3 px-4 py-4 sm:px-5 ${index > 1 ? 'border-t border-slate-200/80 sm:border-t-0' : ''} ${index % 2 === 1 ? 'border-l border-slate-200/80 sm:border-l' : ''} dark:border-slate-700/80`}>
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#8bb8ff]">{index === 3 ? '★' : index === 2 ? '♙' : index === 1 ? '▱' : '▣'}</div>
                                    <div className="min-w-0">
                                        <p className="text-[18px] font-bold tracking-[-.03em] text-slate-900 dark:text-white">{value}</p>
                                        <p className="text-[8px] font-bold uppercase tracking-[.12em] text-slate-400">{label}</p>
                                        <p className="mt-0.5 truncate text-[8px] text-slate-400">{detail}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="courses" className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-28">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#1554c0] dark:text-[#78aaff]">Learn something useful</p>
                            <h2 className="mt-1 text-3xl font-bold tracking-[-.04em] text-slate-950 dark:text-white">Explore our courses</h2>
                            <p className="mt-2 max-w-xl text-[12px] leading-5 text-slate-500 dark:text-slate-400">Discover focused courses and choose the path that matches what you want to build next.</p>
                        </div>
                    </div>

                    {categories.length > 0 && (
                        <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
                            {categories.map(category => (
                                <span key={category.slug} className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-[#101827] dark:text-slate-300">
                                    {category.name} <span className="text-slate-400">{category.count}</span>
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {courses.map(course => {
                            const thumbnail = assetUrl(course.thumbnail_path)
                            return (
                                <article key={course.id} className="group overflow-hidden rounded-[18px] border border-slate-200/80 bg-white shadow-[0_7px_24px_rgba(23,32,51,.045)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(23,32,51,.09)] dark:border-slate-800/80 dark:bg-[#101827] dark:hover:shadow-[0_18px_40px_rgba(0,0,0,.22)]">
                                    <div className="relative h-36 overflow-hidden bg-gradient-to-br from-[#dfeaff] to-[#f4f0ff] dark:from-[#14243d] dark:to-[#19152f]">
                                        {thumbnail ? <img src={thumbnail} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" /> : <div className="flex h-full items-end p-4"><span className="rounded-full bg-white/70 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[.12em] text-[#1554c0] dark:bg-[#0c1728]/75 dark:text-[#8bb8ff]">Learn With Flevian</span></div>}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                                        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[.08em] text-slate-700 shadow-sm dark:bg-[#0c1728]/90 dark:text-slate-200">{course.category?.name || 'Course'}</span>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <h3 className="text-[13px] font-bold leading-5 text-slate-950 dark:text-white">{course.title}</h3>
                                            <span className="shrink-0 text-[10px] font-bold text-[#1554c0] dark:text-[#8bb8ff]">{formatPrice(course.price, course.currency, course.access_type)}</span>
                                        </div>
                                        <p className={`mt-1.5 text-[10px] leading-4 text-slate-500 dark:text-slate-400 ${expandedCourse === course.id ? '' : 'line-clamp-2'}`}>{course.short_description || 'Build practical knowledge through focused lessons and guided learning.'}</p>
                                        <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-3 text-[8px] font-semibold uppercase tracking-[.08em] text-slate-400 dark:border-slate-800">
                                            <span>{levelLabel(course.level)}</span><span>•</span><span>{course.modules_count} modules</span><span>•</span><span>{course.lessons_count} lessons</span>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between gap-3">
                                            <button type="button" onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)} className="text-[10px] font-bold text-[#1554c0] transition hover:text-[#0e429b] dark:text-[#8bb8ff]">
                                                {expandedCourse === course.id ? 'Hide details' : 'Explore course'} <span className="ml-1">→</span>
                                            </button>
                                            <Link href="/register" className="rounded-lg bg-[#1554c0] px-3 py-2 text-[9px] font-bold text-white transition hover:bg-[#1249a7]">Start learning</Link>
                                        </div>
                                        {expandedCourse === course.id && (
                                            <div className="mt-3 rounded-xl bg-[#f4f7fc] p-3 text-[9px] leading-4 text-slate-500 dark:bg-[#0b1424] dark:text-slate-400">
                                                <p><span className="font-bold text-slate-700 dark:text-slate-200">Course format:</span> {course.modules_count} modules and {course.lessons_count} published lessons.</p>
                                                <p className="mt-1"><span className="font-bold text-slate-700 dark:text-slate-200">Level:</span> {levelLabel(course.level)} · <span className="font-bold text-slate-700 dark:text-slate-200">Access:</span> {formatPrice(course.price, course.currency, course.access_type)}</p>
                                            </div>
                                        )}
                                    </div>
                                </article>
                            )
                        })}
                    </div>
                </section>

                <section id="how-it-works" className="border-y border-slate-200/70 bg-white/70 dark:border-slate-800/70 dark:bg-[#0d1422]/70">
                    <div className="mx-auto grid max-w-[1240px] gap-4 px-5 py-14 sm:grid-cols-3 sm:px-8 sm:py-16">
                        {[
                            ['01', 'Choose a course', 'Start with a focused course that matches the skill you want to develop.'],
                            ['02', 'Learn & practice', 'Move through structured lessons and reinforce the ideas with practical work.'],
                            ['03', 'Build your record', 'Complete learning, earn achievements and keep building evidence of progress.'],
                        ].map(([number, title, description]) => (
                            <div key={number} className="rounded-[18px] border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-[#101827]">
                                <span className="text-[10px] font-bold text-[#1554c0] dark:text-[#78aaff]">{number}</span>
                                <h3 className="mt-4 text-[14px] font-bold text-slate-950 dark:text-white">{title}</h3>
                                <p className="mt-1.5 text-[10px] leading-4 text-slate-500 dark:text-slate-400">{description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section id="achievements" className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20">
                    <div>
                        <p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#1554c0] dark:text-[#78aaff]">Progress that stays with you</p>
                        <h2 className="mt-1 text-3xl font-bold tracking-[-.04em] text-slate-950 dark:text-white">Achievements worth earning</h2>
                    </div>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {achievements.map(item => (
                            <div key={item.id} className="rounded-[18px] border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-[#101827]">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#8bb8ff]">★</div>
                                <h3 className="mt-3 text-[12px] font-bold text-slate-950 dark:text-white">{item.name}</h3>
                                <p className="mt-1 text-[9px] leading-4 text-slate-500 dark:text-slate-400">{item.description}</p>
                                <p className="mt-3 text-[8px] font-bold uppercase tracking-[.1em] text-amber-600 dark:text-amber-300">+{item.points} points</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="px-5 pb-24 pt-10 sm:px-8 sm:pb-28 sm:pt-14">
                    <div className="relative mx-auto max-w-[1240px] overflow-hidden rounded-[28px] border border-slate-700/50 bg-[#081426] px-6 py-16 text-center shadow-[0_24px_70px_rgba(8,20,38,.18)] sm:px-10 sm:py-20">
                        <video className="absolute inset-0 h-full w-full object-cover opacity-40 blur-[2px]" src={CTA_VIDEO} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />
                        <div className="absolute inset-0 bg-[#071225]/72" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(67,121,255,.25),transparent_55%)]" />
                        <div className="relative mx-auto max-w-2xl">
                            <p className="text-[9px] font-bold uppercase tracking-[.22em] text-[#8bb8ff]">Start your next chapter</p>
                            <h2 className="mt-4 text-3xl font-bold tracking-[-.045em] text-white sm:text-5xl">Ready to learn something that matters?</h2>
                            <p className="mx-auto mt-4 max-w-xl text-[12px] leading-5 text-slate-300 sm:text-[14px]">Create your learner account and start building practical knowledge, completed work and achievements in one place.</p>
                            <Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-[11px] font-bold text-[#1554c0] shadow-lg transition hover:-translate-y-0.5">Create your account <span>→</span></Link>
                        </div>
                    </div>
                </section>

                <footer className="border-t border-slate-200/70 bg-white dark:border-slate-800/70 dark:bg-[#0b1220]">
                    <div className="mx-auto max-w-[1240px] px-5 py-12 sm:px-8 sm:py-14">
                        <div className="grid gap-10 md:grid-cols-[1.5fr_.8fr_.8fr]">
                            <div>
                                <a href="#top" className="flex items-center gap-3">
                                    <img src="/favicon-192x192.png" alt="Learn With Flevian LMS" className="h-9 w-9 rounded-xl" />
                                    <div><p className="text-[12px] font-bold text-slate-900 dark:text-white">Learn With Flevian</p><p className="text-[9px] text-slate-400">Learning Management System</p></div>
                                </a>
                                <p className="mt-4 max-w-md text-[10px] leading-5 text-slate-500 dark:text-slate-400">A practical online learning platform for building technology skills, completing focused courses and earning meaningful achievements.</p>
                            </div>
                            <div><p className="text-[9px] font-bold uppercase tracking-[.16em] text-slate-400">Explore</p><div className="mt-4 space-y-2 text-[10px] font-semibold text-slate-600 dark:text-slate-300"><a href="#courses" className="block hover:text-[#1554c0]">Courses</a><a href="#achievements" className="block hover:text-[#1554c0]">Achievements</a><a href="#how-it-works" className="block hover:text-[#1554c0]">How it works</a></div></div>
                            <div><p className="text-[9px] font-bold uppercase tracking-[.16em] text-slate-400">Learner access</p><div className="mt-4 space-y-2 text-[10px] font-semibold text-slate-600 dark:text-slate-300"><Link href="/login" className="block hover:text-[#1554c0]">Sign in</Link><Link href="/register" className="block hover:text-[#1554c0]">Create account</Link></div></div>
                        </div>
                        <div className="mt-10 flex flex-col gap-2 border-t border-slate-200/70 pt-5 text-[9px] text-slate-400 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800/70">
                            <span>© {new Date().getFullYear()} Learn With Flevian LMS. All rights reserved.</span><span>Learn with purpose. Build with confidence.</span>
                        </div>
                    </div>
                </footer>
            </main>
        </>
    )
}
