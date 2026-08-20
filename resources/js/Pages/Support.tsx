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
                <div className="space-y-6">
                    <section className="relative isolate overflow-hidden rounded-[26px] bg-[#10213f] p-6 text-white shadow-[0_18px_45px_rgba(21,84,192,0.14)] sm:p-8 lg:p-9">
                        <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#1554c0]/25 blur-3xl" />
                        <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-[#6a5cff]/20 blur-3xl" />

                        <div className="relative max-w-3xl">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                                    <Icon
                                        name="support"
                                        className="h-5 w-5"
                                    />
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-200">
                                        Support Centre
                                    </p>

                                    <p className="mt-0.5 text-xs text-blue-100/75">
                                        Learn With Flevian
                                    </p>
                                </div>
                            </div>

                            <h1 className="mt-6 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
                                How can we help?
                            </h1>

                            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/80">
                                Find the right place to get help with your courses,
                                assignments, quizzes, account, or a technical problem.
                            </p>

                            <div className="mt-6 flex flex-wrap gap-2">
                                <a
                                    href="#support-topics"
                                    className="rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#1554c0] shadow-sm transition hover:-translate-y-0.5"
                                >
                                    Browse support topics
                                </a>

                                <a
                                    href="#faq"
                                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10"
                                >
                                    View FAQs
                                </a>
                            </div>
                        </div>
                    </section>

                    <section id="support-topics">
                        <div className="mb-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#1554c0] dark:text-[#6ba3ff]">
                                Support topics
                            </p>
                        </div>

                        <SectionHeader
                            title="Get help with a specific area"
                            description="Start with the area closest to the problem you are experiencing."
                        />

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            {supportTopics.map((topic) => (
                                <Card
                                    key={topic.title}
                                    className="group p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(21,84,192,0.08)]"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#6ba3ff]">
                                            <Icon
                                                name={topic.icon}
                                                className="h-5 w-5"
                                            />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                                                {topic.title}
                                            </h2>

                                            <p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                                {topic.description}
                                            </p>

                                            <Link
                                                href={topic.href}
                                                className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#1554c0] dark:text-[#6ba3ff]"
                                            >
                                                {topic.label}
                                                <span aria-hidden="true">
                                                    →
                                                </span>
                                            </Link>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </section>

                    <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                        <Card className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#6ba3ff]">
                                    <Icon
                                        name="chatbot"
                                        className="h-5 w-5"
                                    />
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#1554c0] dark:text-[#6ba3ff]">
                                        Instant help
                                    </p>

                                    <h2 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                                        Ask TechGhost AI
                                    </h2>

                                    <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                        Use the assistant in the bottom-right corner
                                        for quick questions about your learning space,
                                        courses, lessons, assignments, quizzes and
                                        progress.
                                    </p>

                                    <p className="mt-4 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                                        Look for the blue AI button at the bottom-right.
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                                    <Icon
                                        name="support"
                                        className="h-5 w-5"
                                    />
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-300">
                                        Need human help?
                                    </p>

                                    <h2 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                                        Report a problem
                                    </h2>

                                    <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                        When you contact the support team, include the
                                        page, action, error message, and what you expected
                                        to happen.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </section>

                    <section id="faq">
                        <div className="mb-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#1554c0] dark:text-[#6ba3ff]">
                                Frequently asked questions
                            </p>
                        </div>

                        <SectionHeader
                            title="Common questions"
                            description="Quick answers to the issues students are most likely to encounter."
                        />

                        <Card className="mt-4 overflow-hidden">
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {faqs.map((faq, index) => {
                                    const open = openFaq === index

                                    return (
                                        <div key={faq.question}>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setOpenFaq(
                                                        open ? null : index,
                                                    )
                                                }
                                                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-900/60"
                                                aria-expanded={open}
                                            >
                                                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                                    {faq.question}
                                                </span>

                                                <span
                                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-transform dark:bg-slate-800 dark:text-slate-400 ${
                                                        open
                                                            ? 'rotate-45'
                                                            : ''
                                                    }`}
                                                    aria-hidden="true"
                                                >
                                                    +
                                                </span>
                                            </button>

                                            {open ? (
                                                <div className="px-5 pb-5 pr-14">
                                                    <p className="text-xs leading-6 text-slate-500 dark:text-slate-400">
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

                    <section className="rounded-2xl border border-[#dfe7f3] bg-gradient-to-br from-[#f8fbff] via-white to-[#f6f4ff] p-5 dark:border-[#273753] dark:from-[#101827] dark:via-[#111b2d] dark:to-[#17152d] sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">
                                    Still need help?
                                </p>

                                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                    If none of the options above solves the problem,
                                    contact the Learn With Flevian support team with
                                    enough detail to reproduce the issue.
                                </p>
                            </div>

                            <Link
                                href="/dashboard"
                                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#1554c0] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1249a8]"
                            >
                                Back to dashboard
                            </Link>
                        </div>
                    </section>
                </div>
            </StudentLayout>
        </>
    )
}