import { Head, Link, router, usePage } from '@inertiajs/react'
import { FormEvent, useState } from 'react'

interface PageProps {
    [key: string]: unknown

    auth?: {
        user?: {
            name?: string
            email?: string
        }
    }

    status?: string | null
}

function MailIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-6 w-6"
            aria-hidden="true"
        >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
        </svg>
    )
}

function ArrowIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4"
            aria-hidden="true"
        >
            <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
    )
}

export default function VerifyEmail() {
    const { auth, status } = usePage<PageProps>().props
    const [processing, setProcessing] = useState(false)
    const [resent, setResent] = useState(false)

    const user = auth?.user

    const handleResend = (event: FormEvent) => {
        event.preventDefault()
        setProcessing(true)
        setResent(false)

        router.post(
            '/email/verification-notification',
            {},
            {
                preserveScroll: true,
                onSuccess: () => setResent(true),
                onFinish: () => setProcessing(false),
            },
        )
    }

    const handleLogout = (event: FormEvent) => {
        event.preventDefault()
        router.post('/logout')
    }

    return (
        <>
            <Head title="Verify Your Email" />

            <main className="min-h-screen bg-[#f5f7fa] px-4 py-10 text-[#172033] transition-colors dark:bg-[#0b1220] dark:text-[#f3f6fc] sm:py-14">
                <div className="mx-auto flex w-full max-w-[460px] flex-col items-center">
                    {/* LWF Brand */}
                    <Link href="/" className="group mb-7 flex flex-col items-center">
                        <div className="relative">
                            <div className="absolute inset-0 rounded-[16px] bg-[#1554c0]/10 blur-md transition group-hover:bg-[#1554c0]/20 dark:bg-[#4c8dff]/10 dark:group-hover:bg-[#4c8dff]/20" />
                            <img
                                src="/favicon-192x192.png"
                                alt="Learn With Flevian"
                                className="relative h-16 w-16 rounded-[16px] object-contain"
                            />
                        </div>
                        <span className="mt-3 text-[15px] font-semibold tracking-[-0.01em] text-[#172033] dark:text-white">
                            Learn With Flevian
                        </span>
                    </Link>

                    <section className="w-full rounded-[8px] border border-[#d8dee9] bg-white p-6 shadow-[0_2px_8px_rgba(23,32,51,0.08)] dark:border-[#2a3850] dark:bg-[#111827] dark:shadow-[0_2px_10px_rgba(0,0,0,0.28)] sm:p-8">
                        <header className="mb-7 text-center">
                            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-[8px] bg-[#1554c0]/[0.08] text-[#1554c0] dark:bg-[#4c8dff]/10 dark:text-[#6ba3ff]">
                                <MailIcon />
                            </div>

                            <h1 className="text-[25px] font-semibold tracking-[-0.025em] text-[#172033] dark:text-white">
                                Verify your email
                            </h1>

                            <p className="mt-2 text-sm leading-6 text-[#53627a] dark:text-[#aab7cc]">
                                Welcome{user?.name ? `, ${user.name}` : ''}. We sent a verification link to{' '}
                                {user?.email ? (
                                    <span className="font-semibold text-[#172033] dark:text-[#e5ebf5]">
                                        {user.email}
                                    </span>
                                ) : (
                                    'your email address'
                                )}.
                            </p>
                        </header>

                        {(status || resent) && (
                            <div
                                className="mb-5 rounded-[6px] border border-[#a7d8a7] bg-[#f0fff0] px-3 py-2.5 text-sm text-[#107c10] dark:border-[#275b2b] dark:bg-[#102718] dark:text-[#6ccb5f]"
                                role="status"
                            >
                                {resent
                                    ? 'A new verification email has been sent.'
                                    : status}
                            </div>
                        )}

                        <div className="rounded-[6px] border border-[#e1e6ee] bg-[#f8fafc] px-4 py-4 dark:border-[#2a3850] dark:bg-[#0d1626]">
                            <p className="text-sm font-semibold text-[#172033] dark:text-[#e5ebf5]">
                                Check your inbox
                            </p>
                            <p className="mt-1.5 text-sm leading-6 text-[#53627a] dark:text-[#aab7cc]">
                                Open the verification email and click the verification button. If you do not see it, check your spam or junk folder.
                            </p>
                        </div>

                        <form onSubmit={handleResend} className="mt-5">
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex h-11 w-full items-center justify-center gap-2 rounded-[6px] bg-[#1554c0] px-4 text-sm font-semibold text-white shadow-[0_2px_5px_rgba(21,84,192,0.22)] transition hover:bg-[#1048a8] focus:outline-none focus:ring-2 focus:ring-[#1554c0]/30 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#4c8dff] dark:text-[#07101f] dark:shadow-[0_2px_8px_rgba(76,141,255,0.22)] dark:hover:bg-[#6ba3ff] dark:focus:ring-[#4c8dff]/30 dark:focus:ring-offset-[#111827]"
                            >
                                {processing ? 'Sending verification email...' : 'Resend verification email'}
                                {!processing && <ArrowIcon />}
                            </button>
                        </form>

                        <div className="mt-6 border-t border-[#e1e6ee] pt-6 text-center dark:border-[#2a3850]">
                            <p className="text-sm text-[#71809a] dark:text-[#8392aa]">
                                Not ready to verify yet?
                            </p>
                            <Link
                                href="/dashboard"
                                className="mt-2 inline-flex text-sm font-semibold text-[#1554c0] hover:underline dark:text-[#6ba3ff]"
                            >
                                Verify later and continue learning
                            </Link>
                        </div>

                        <form onSubmit={handleLogout} className="mt-5 text-center">
                            <button
                                type="submit"
                                className="text-sm font-medium text-[#71809a] transition hover:text-[#172033] hover:underline dark:text-[#8392aa] dark:hover:text-white"
                            >
                                Sign out
                            </button>
                        </form>
                    </section>

                    <footer className="mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-[#71809a] dark:text-[#66758c]">
                        <Link href="/" className="hover:text-[#1554c0] hover:underline dark:hover:text-[#6ba3ff]">
                            Learn With Flevian
                        </Link>
                        <span aria-hidden="true">•</span>
                        <span>© {new Date().getFullYear()}</span>
                        <span aria-hidden="true">•</span>
                        <span>Secure authentication</span>
                    </footer>
                </div>
            </main>
        </>
    )
}
