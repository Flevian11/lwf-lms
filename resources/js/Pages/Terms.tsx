import { Head, Link } from '@inertiajs/react'
import { useEffect, useState } from 'react'

const SITE_URL = 'https://lwf.yaliid.cloud'

export default function Privacy() {
    const [darkMode, setDarkMode] = useState(false)

    useEffect(() => {
        const stored = window.localStorage.getItem('learn-with-flevian-theme')
        const preferredDark = stored === 'dark' ? true : stored === 'light' ? false : window.matchMedia('(prefers-color-scheme: dark)').matches
        setDarkMode(preferredDark)
        document.documentElement.classList.toggle('dark', preferredDark)
        document.documentElement.style.colorScheme = preferredDark ? 'dark' : 'light'
    }, [])

    const toggleTheme = () => {
        const next = !darkMode
        setDarkMode(next)
        document.documentElement.classList.toggle('dark', next)
        document.documentElement.style.colorScheme = next ? 'dark' : 'light'
        window.localStorage.setItem('learn-with-flevian-theme', next ? 'dark' : 'light')
    }

    return (
        <>
            <Head>
                <title>Terms of Service — Learn With Flevian LMS</title>
                <meta name="description" content="Privacy Policy for Learn With Flevian LMS." />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href={`${SITE_URL}/terms`} />
            </Head>

            <main className="min-h-screen bg-[#f4f7fc] text-[#172033] transition-colors duration-500 dark:bg-[#080d18] dark:text-[#edf2fa]">
                <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl dark:border-slate-800/70 dark:bg-[#0b1220]/90">
                    <div className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between px-5 sm:px-8">
                        <Link href="/" className="flex items-center gap-3">
                            <img src="/favicon-192x192.png" alt="Learn With Flevian" className="h-10 w-10 rounded-xl object-contain ring-1 ring-slate-200 dark:ring-slate-700" />
                            <div><p className="text-[13px] font-bold tracking-[-.02em]">Learn With Flevian</p><p className="text-[9px] font-medium text-slate-500 dark:text-slate-400">Learning platform</p></div>
                        </Link>
                        <div className="flex items-center gap-2.5">
                            <button type="button" onClick={toggleTheme} aria-label="Toggle theme" className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:text-[#1554c0] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"><span className="text-sm">{darkMode ? '☀' : '◐'}</span></button>
                            <Link href="/login" className="hidden rounded-xl px-3 py-2 text-[11px] font-bold text-slate-600 sm:block dark:text-slate-300">Sign in</Link>
                            <Link href="/register" className="rounded-xl bg-[#1554c0] px-4 py-2.5 text-[11px] font-bold text-white shadow-[0_8px_20px_rgba(21,84,192,.22)] transition hover:bg-[#1249a7]">Get started</Link>
                        </div>
                    </div>
                </header>

                <section className="relative overflow-hidden border-b border-slate-200/60 dark:border-slate-800/70">
                    <div className="absolute inset-0 bg-[#eef4ff] dark:bg-[#071225]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(21,84,192,.14),transparent_48%)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(67,121,255,.16),transparent_48%)]" />
                    <div className="relative mx-auto max-w-[1240px] px-5 py-20 sm:px-8 sm:py-24">
                        <span className="inline-flex items-center gap-2 rounded-full border border-[#1554c0]/15 bg-white/80 px-3.5 py-2 text-[9px] font-bold uppercase tracking-[.2em] text-[#1554c0] shadow-sm backdrop-blur-md dark:border-blue-300/15 dark:bg-[#101b31]/75 dark:text-[#8bb8ff]"><span className="h-1.5 w-1.5 rounded-full bg-[#1554c0] dark:bg-[#8bb8ff]" />Learn with confidence</span>
                        <h1 className="mt-6 max-w-3xl text-[42px] font-bold leading-[1.02] tracking-[-.05em] text-[#0b1020] sm:text-[60px] dark:text-white">Terms of Service</h1>
                        <p className="mt-5 max-w-2xl text-[13px] leading-6 text-slate-600 sm:text-[15px] dark:text-slate-300">These terms set out the basic rules for using Learn With Flevian LMS, including accounts, courses, learning activities, payments and acceptable use.</p>
                        <p className="mt-4 text-[9px] font-bold uppercase tracking-[.16em] text-slate-400">Last updated: August 2026</p>
                    </div>
                </section>

                <section className="mx-auto grid max-w-[1240px] gap-5 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[.72fr_1.8fr]">
                    <aside className="h-fit rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-[0_7px_24px_rgba(23,32,51,.045)] dark:border-slate-800 dark:bg-[#101827] lg:sticky lg:top-24">
                        <p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#1554c0] dark:text-[#78aaff]">On this page</p>
                        <nav className="mt-4 space-y-2 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                            <a href="#acceptance" className="block hover:text-[#1554c0]">Acceptance</a>
                            <a href="#accounts" className="block hover:text-[#1554c0]">Accounts</a>
                            <a href="#courses" className="block hover:text-[#1554c0]">Courses & learning</a>
                            <a href="#payments" className="block hover:text-[#1554c0]">Payments</a>
                            <a href="#conduct" className="block hover:text-[#1554c0]">Acceptable use</a>
                            <a href="#access" className="block hover:text-[#1554c0]">Access & changes</a>
                            <a href="#contact" className="block hover:text-[#1554c0]">Contact</a>
                        </nav>
                    </aside>

                    <article className="rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-[0_7px_24px_rgba(23,32,51,.045)] sm:p-9 dark:border-slate-800 dark:bg-[#101827]">
                        <div className="space-y-10 text-[12px] leading-6 text-slate-600 dark:text-slate-300">
                            <section id="acceptance"><h2 className="text-xl font-bold tracking-[-.03em] text-slate-950 dark:text-white">1. Acceptance of these terms</h2><p className="mt-3">By creating an account or using Learn With Flevian LMS, you agree to use the platform in accordance with these Terms of Service and applicable laws.</p></section>
                            <section id="accounts"><h2 className="text-xl font-bold tracking-[-.03em] text-slate-950 dark:text-white">2. Learner accounts</h2><p className="mt-3">You must provide accurate information when creating an account and keep your login credentials secure. You are responsible for activity performed through your account.</p><p className="mt-3">You must not share, transfer, impersonate, or misuse another person's account. We may restrict or suspend access where necessary to protect users, the platform or the integrity of learning activities.</p></section>
                            <section id="courses"><h2 className="text-xl font-bold tracking-[-.03em] text-slate-950 dark:text-white">3. Courses and learning activities</h2><p className="mt-3">Courses, lessons, assignments, quizzes and other learning materials are provided for educational purposes. Access may depend on enrollment, approval, payment status or other requirements shown by the platform.</p><p className="mt-3">Learning records, assessment results, achievements and certificates are tied to the learner account and may be subject to verification and platform rules.</p></section>
                            <section id="payments"><h2 className="text-xl font-bold tracking-[-.03em] text-slate-950 dark:text-white">4. Payments and access</h2><p className="mt-3">Where a course or service requires payment, the applicable price and currency will be presented through the platform. Payment processing may be handled through supported third-party payment services.</p><p className="mt-3">Access to paid learning content may depend on successful payment and the enrollment status recorded by the LMS.</p></section>
                            <section id="conduct"><h2 className="text-xl font-bold tracking-[-.03em] text-slate-950 dark:text-white">5. Acceptable use</h2><p className="mt-3">You may not use the platform to interfere with its operation, bypass access controls, submit malicious content, abuse authentication or payment systems, impersonate another person, or attempt to obtain unauthorized access to data or accounts.</p><p className="mt-3">You must not copy, redistribute, resell or publicly republish protected course materials except where expressly permitted.</p></section>
                            <section id="access"><h2 className="text-xl font-bold tracking-[-.03em] text-slate-950 dark:text-white">6. Platform access and changes</h2><p className="mt-3">We may update, improve, suspend or modify parts of the platform from time to time. We may also make changes necessary for security, legal compliance, maintenance or technical operation.</p><p className="mt-3">We aim to keep the service reliable, but continuous or uninterrupted availability cannot be guaranteed.</p></section>
                            <section><h2 className="text-xl font-bold tracking-[-.03em] text-slate-950 dark:text-white">7. Educational information</h2><p className="mt-3">Course content is provided for learning and skills development. Completion of a course or receipt of a certificate does not by itself guarantee employment, admission, professional licensing or a particular outcome.</p></section>
                            <section id="contact"><h2 className="text-xl font-bold tracking-[-.03em] text-slate-950 dark:text-white">8. Contact</h2><p className="mt-3">Questions about these terms can be directed to Learn With Flevian through the support contact associated with the platform.</p><a href="mailto:info@yaliid.cloud" className="mt-3 inline-flex font-bold text-[#1554c0] dark:text-[#8bb8ff]">info@yaliid.cloud</a></section>
                        </div>
                    </article>
                </section>

                <footer className="border-t border-slate-200/70 bg-white dark:border-slate-800/70 dark:bg-[#0b1220]">
                    <div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-5 py-8 text-[9px] text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                        <span>© {new Date().getFullYear()} Learn With Flevian LMS. All rights reserved.</span>
                        <div className="flex gap-4"><Link href="/privacy" className="font-semibold text-[#1554c0] dark:text-[#8bb8ff]">Privacy</Link><Link href="/terms" className="hover:text-[#1554c0]">Terms</Link><Link href="/" className="hover:text-[#1554c0]">Home</Link></div>
                    </div>
                </footer>
            </main>
        </>
    )
}
