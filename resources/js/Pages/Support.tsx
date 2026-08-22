import { Head, Link, usePage } from '@inertiajs/react'
import { useState } from 'react'
import type { PageProps } from '../Components/student-types'
import StudentLayout from '../Components/StudentLayout'
import { Card, Icon, SectionHeader } from '../Components/StudentUI'

export default function Support() {
    const { student, stats } = usePage<PageProps>().props
    const [openFaq, setOpenFaq] = useState<number | null>(0)

    const supportTopics = [
        {
            title: 'Learning & courses',
            description:
                'Need help finding a course, opening a lesson, or understanding your learning progress?',
            href: '/courses',
            icon: 'book' as const,
            label: 'View my courses',
        },
        {
            title: 'Assignments',
            description:
                'Having trouble finding an assignment, checking a deadline, or opening your submitted work?',
            href: '/assignments',
            icon: 'assignment' as const,
            label: 'View assignments',
        },
        {
            title: 'Quizzes',
            description:
                'Get help locating quizzes and understanding where your quiz activity appears.',
            href: '/quizzes',
            icon: 'quiz' as const,
            label: 'View quizzes',
        },
        {
            title: 'Account & security',
            description:
                'Problems with your profile, password, passkeys, two-factor authentication, or account access?',
            href: '/security',
            icon: 'shield' as const,
            label: 'Open security',
        },
    ]

    const faqs = [
        {
            question: 'I cannot find my course. What should I do?',
            answer:
                'Open My Courses first and check your enrolled courses. If the course is still missing, contact support with the course name and the account email you use for Learn With Flevian.',
        },
        {
            question: 'How do I update my account details?',
            answer:
                'Open Profile from the Account section in the sidebar. You can update the editable profile information there. Your platform timezone and language are fixed to Nairobi and English.',
        },
        {
            question: 'I am having trouble signing in.',
            answer:
                'Check that you are using the correct email and password. If you still cannot access your account, use the account recovery flow or contact support with a clear description of the problem.',
        },
        {
            question: 'Where can I get help with my learning?',
            answer:
                'You can use the TechGhost AI assistant from the floating button at the bottom-right of the portal for questions about courses, lessons, assignments, quizzes and learning progress.',
        },
        {
            question: 'Something on the portal is not working.',
            answer:
                'Tell support exactly what you were trying to do, what happened, and which page you were on. If possible, include the error message or a screenshot so the issue can be reproduced quickly.',
        },
    ]

    return (
        <>
            <Head title="Get Support" />

            <StudentLayout
                student={student}
                stats={stats}
                title="Get Support"
            >
                <div className="w-full px-4 py-4 sm:px-5 lg:px-6">
                    {/* Header */}
                    <section className="relative isolate mb-4 overflow-hidden rounded-[26px] bg-[#10213f] p-6 text-white shadow-[0_18px_45px_rgba(21,84,192,0.14)] sm:p-8">
                        <video
                            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                            src="/videos/support-bg.mp4"
                            autoPlay
                            muted
                            loop
                            playsInline
                            aria-hidden="true"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-[#071225]/55 dark:bg-[#020817]/70" />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#1554c0]/25 via-transparent to-[#4438a8]/30" />
                        <div className="relative">
                            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-blue-100/80">
                                Help centre
                            </p>
                            <h1 className="mt-0.5 text-2xl font-bold tracking-[-0.03em] text-white">
                                Support & learning help
                            </h1>
                            <p className="mt-0.5 max-w-2xl text-[11px] leading-4 text-blue-100/80">
                                Find quick answers, jump directly to the part of the portal you need,
                                or ask TechGhost AI for guidance.
                            </p>
                        </div>
                    </section>

                    {/* Summary */}
                    <div className="grid gap-2.5 sm:grid-cols-3">
                        <Card className="p-3.5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#8bb8ff]">
                                    <Icon name="book" className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-slate-400">Learning areas</p>
                                    <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">4</p>
                                    <p className="text-[8px] text-slate-400">Courses, assignments, quizzes & account</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-3.5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#8bb8ff]">
                                    <Icon name="chatbot" className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-slate-400">Instant help</p>
                                    <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">AI</p>
                                    <p className="text-[8px] text-slate-400">Ask TechGhost AI for guidance</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-3.5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#8bb8ff]">
                                    <Icon name="quiz" className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-slate-400">FAQs</p>
                                    <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">{faqs.length}</p>
                                    <p className="text-[8px] text-slate-400">Common portal questions answered</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Main content */}
                    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_310px]">
                        <div className="min-w-0 space-y-4">
                            {/* Support topics */}
                            <section id="support-topics">
                                <SectionHeader
                                    title="Get help with a specific area"
                                    description="Start with the area closest to the problem you are experiencing."
                                />

                                <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                                    {supportTopics.map(topic => (
                                        <Card
                                            key={topic.title}
                                            className="p-3.5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(21,84,192,0.08)]"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#8bb8ff]">
                                                    <Icon name={topic.icon} className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h2 className="text-xs font-bold text-slate-900 dark:text-white">
                                                        {topic.title}
                                                    </h2>
                                                    <p className="mt-1 text-[9px] leading-4 text-slate-500 dark:text-slate-400">
                                                        {topic.description}
                                                    </p>
                                                    <Link
                                                        href={topic.href}
                                                        className="mt-2.5 inline-flex items-center gap-1.5 text-[9px] font-bold text-[#1554c0] dark:text-[#6ba3ff]"
                                                    >
                                                        {topic.label}
                                                        <span aria-hidden="true">→</span>
                                                    </Link>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </section>

                            {/* AI + human support */}
                            <section className="grid gap-2.5 sm:grid-cols-2">
                                <Card className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#8bb8ff]">
                                            <Icon name="chatbot" className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#1554c0] dark:text-[#6ba3ff]">
                                                Instant help
                                            </p>
                                            <h2 className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
                                                Ask TechGhost AI
                                            </h2>
                                            <p className="mt-1.5 text-[9px] leading-4 text-slate-500 dark:text-slate-400">
                                                Ask about courses, lessons, assignments, quizzes and learning progress. The chatbot will be designed as the next dedicated support experience.
                                            </p>
                                            <p className="mt-2.5 text-[8px] font-medium text-slate-400 dark:text-slate-500">
                                                AI integration coming next.
                                            </p>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                                            <Icon name="support" className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-300">
                                                Need human help?
                                            </p>
                                            <h2 className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
                                                Report a problem
                                            </h2>
                                            <p className="mt-1.5 text-[9px] leading-4 text-slate-500 dark:text-slate-400">
                                                When contacting support, include the page, action, error message, and what you expected to happen so the issue can be reproduced quickly.
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </section>

                            {/* FAQ */}
                            <section id="faq">
                                <SectionHeader
                                    title="Common questions"
                                    description="Quick answers to the issues students are most likely to encounter."
                                />

                                <Card className="mt-3 overflow-hidden p-0">
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {faqs.map((faq, index) => {
                                            const open = openFaq === index
                                            return (
                                                <div key={faq.question}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setOpenFaq(open ? null : index)}
                                                        className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-900/60"
                                                        aria-expanded={open}
                                                    >
                                                        <span className="text-[10px] font-bold text-slate-800 dark:text-slate-100">
                                                            {faq.question}
                                                        </span>
                                                        <span
                                                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-transform dark:bg-slate-800 dark:text-slate-400 ${open ? 'rotate-45' : ''}`}
                                                            aria-hidden="true"
                                                        >
                                                            +
                                                        </span>
                                                    </button>
                                                    {open ? (
                                                        <div className="px-4 pb-4 pr-12">
                                                            <p className="text-[9px] leading-5 text-slate-500 dark:text-slate-400">
                                                                {faq.answer}
                                                            </p>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </Card>
                            </section>
                        </div>

                        {/* Right */}
                        <aside className="min-w-0 space-y-3">
                            <Card className="p-4">
                                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                    Quick help
                                </p>
                                <h2 className="mt-0.5 text-base font-bold tracking-[-0.02em] text-slate-900 dark:text-white">
                                    Start with TechGhost AI
                                </h2>
                                <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
                                    For questions about the learning portal, the upcoming chatbot will be the fastest place to start.
                                </p>
                                <div className="mt-3 rounded-xl bg-gradient-to-r from-[#edf4ff] to-[#f7f4ff] p-3 dark:from-[#121e33] dark:to-[#18152f]">
                                    <div className="flex items-center gap-3">
                                        <Icon name="chatbot" className="h-5 w-5 text-[#1554c0] dark:text-[#8bb8ff]" />
                                        <div>
                                            <p className="text-xs font-bold text-slate-900 dark:text-white">Ask AI</p>
                                            <p className="text-[9px] text-slate-400">Learning assistant</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-4">
                                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                    How to report an issue
                                </p>
                                <div className="mt-3 space-y-2.5">
                                    {[
                                        ['1', 'Describe the action', 'Tell us what you were trying to do.'],
                                        ['2', 'Share what happened', 'Include the message or behaviour you saw.'],
                                        ['3', 'Add useful evidence', 'A screenshot can make reproduction much faster.'],
                                    ].map(([number, title, description]) => (
                                        <div key={number} className="flex gap-2.5">
                                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#edf4ff] text-[9px] font-bold text-[#1554c0] dark:bg-[#172945] dark:text-[#8bb8ff]">
                                                {number}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{title}</p>
                                                <p className="mt-0.5 text-[9px] leading-4 text-slate-400">{description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            <div className="rounded-2xl border border-[#dfe7f3] bg-gradient-to-br from-[#f8fbff] via-white to-[#f6f4ff] p-4 dark:border-[#273753] dark:from-[#101827] dark:via-[#111b2d] dark:to-[#17152d]">
                                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#1554c0] dark:text-[#8bb8ff]">
                                    Still need help?
                                </p>
                                <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                                    Ask the AI assistant
                                </p>
                                <p className="mt-1 text-[9px] leading-4 text-slate-500 dark:text-slate-400">
                                    The dedicated chatbot experience is next. This button is already prepared for that route.
                                </p>
                            </div>
                        </aside>
                    </div>

                    {/* AI CTA */}
                    <section className="mt-4 rounded-2xl border border-[#dfe7f3] bg-gradient-to-br from-[#f8fbff] via-white to-[#f6f4ff] p-4 dark:border-[#273753] dark:from-[#101827] dark:via-[#111b2d] dark:to-[#17152d] sm:p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#1554c0] dark:text-[#8bb8ff]">
                                    AI support
                                </p>
                                <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
                                    Need help beyond these answers?
                                </p>
                                <p className="mt-1 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
                                    Ask TechGhost AI about your courses, lessons, assignments, quizzes and learning progress.
                                </p>
                            </div>

                            <Link
                                href="/chatbot"
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#1554c0] px-4 py-2.5 text-[10px] font-bold text-white shadow-sm transition hover:bg-[#1249a8] dark:bg-[#4c8dff] dark:text-[#07101f]"
                            >
                                <Icon name="chatbot" className="h-3.5 w-3.5" />
                                Ask AI
                            </Link>
                        </div>
                    </section>
                </div>
            </StudentLayout>
        </>
    )

}
