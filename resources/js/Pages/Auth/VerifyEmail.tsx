import { Head, router, usePage } from '@inertiajs/react'
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
                onSuccess: () => {
                    setResent(true)
                },
                onFinish: () => {
                    setProcessing(false)
                },
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

            <div className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
                <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-2xl items-center justify-center">
                    <main className="w-full">
                        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
                            <div className="mx-auto max-w-xl text-center">
                                <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        className="h-7 w-7"
                                        aria-hidden="true"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M3 7.5 12 13l9-5.5M4.5 5.5h15A1.5 1.5 0 0 1 21 7v10a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17V7a1.5 1.5 0 0 1 1.5-1.5Z"
                                        />
                                    </svg>
                                </div>

                                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                                    Learn With Flevian
                                </p>

                                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                    Verify your email
                                </h1>

                                <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-slate-600">
                                    Welcome
                                    {user?.name ? `, ${user.name}` : ''}. We
                                    sent a verification link to
                                    {user?.email ? (
                                        <span className="font-medium text-slate-900">
                                            {' '}
                                            {user.email}
                                        </span>
                                    ) : (
                                        ' your email address'
                                    )}
                                    .
                                </p>

                                <div className="mt-8 rounded-2xl bg-slate-50 p-5 text-left">
                                    <p className="text-sm font-medium text-slate-800">
                                        Check your inbox
                                    </p>

                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        Open the verification email and click
                                        the verification button. If you do not
                                        see it, check your spam or junk folder.
                                    </p>
                                </div>

                                {(status || resent) && (
                                    <div
                                        className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                                        role="status"
                                    >
                                        {resent
                                            ? 'A new verification email has been sent.'
                                            : status}
                                    </div>
                                )}

                                <form
                                    onSubmit={handleResend}
                                    className="mt-7"
                                >
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {processing
                                            ? 'Sending verification email...'
                                            : 'Resend verification email'}
                                    </button>
                                </form>

                                <div className="mt-6 border-t border-slate-200 pt-6">
                                    <p className="text-sm text-slate-500">
                                        Already verified your email?
                                    </p>

                                    <a
                                        href="/dashboard"
                                        className="mt-2 inline-flex text-sm font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-900"
                                    >
                                        Continue to Learn With Flevian
                                    </a>
                                </div>

                                <form
                                    onSubmit={handleLogout}
                                    className="mt-5"
                                >
                                    <button
                                        type="submit"
                                        className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
                                    >
                                        Sign out
                                    </button>
                                </form>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </>
    )
}