import { FormEvent, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';

interface ForgotPasswordProps {
    status?: string | null;
}

function MailIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
            aria-hidden="true"
        >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
        </svg>
    );
}

function ArrowIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
            aria-hidden="true"
        >
            <path d="M14 7l5 5-5 5" />
            <path d="M19 12H3" />
        </svg>
    );
}

export default function ForgotPassword({
    status,
}: ForgotPasswordProps) {
    const [submitted, setSubmitted] = useState(false);

    const form = useForm({
        email: '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setSubmitted(false);

        form.post('/forgot-password', {
            preserveScroll: true,
            onSuccess: () => {
                setSubmitted(true);
            },
        });
    };

    return (
        <>
            <Head title="Forgot Password" />

            <main className="min-h-screen bg-[#f5f7fa] px-4 py-10 text-[#172033] transition-colors dark:bg-[#0b1220] dark:text-[#f3f6fc] sm:py-14">
                <div className="mx-auto flex w-full max-w-[460px] flex-col items-center">
                    {/* LWF Brand */}
                    <Link
                        href="/"
                        className="group mb-7 flex flex-col items-center"
                    >
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

                    {/* Main authentication surface */}
                    <section className="w-full rounded-[8px] border border-[#d8dee9] bg-white p-6 shadow-[0_2px_8px_rgba(23,32,51,0.08)] dark:border-[#2a3850] dark:bg-[#111827] dark:shadow-[0_2px_10px_rgba(0,0,0,0.28)] sm:p-8">
                        <header className="mb-7">
                            <h1 className="text-center text-[25px] font-semibold tracking-[-0.025em] text-[#172033] dark:text-white">
                                Forgot your password?
                            </h1>

                            <p className="mt-2 text-center text-sm text-[#53627a] dark:text-[#aab7cc]">
                                Enter your email address and we&apos;ll send
                                you a secure password reset link.
                            </p>
                        </header>

                        {status && (
                            <div className="mb-5 rounded-[6px] border border-[#a7d8a7] bg-[#f0fff0] px-3 py-2.5 text-sm text-[#107c10] dark:border-[#275b2b] dark:bg-[#102718] dark:text-[#6ccb5f]">
                                {status}
                            </div>
                        )}

                        {submitted && !form.errors.email && (
                            <div className="mb-5 rounded-[6px] border border-[#a7d8a7] bg-[#f0fff0] px-3 py-2.5 text-sm leading-5 text-[#107c10] dark:border-[#275b2b] dark:bg-[#102718] dark:text-[#6ccb5f]">
                                If an account exists for that email address,
                                a password reset link has been sent.
                            </div>
                        )}

                        <form
                            onSubmit={submit}
                            className="space-y-5"
                        >
                            {/* Email */}
                            <div>
                                <label
                                    htmlFor="email"
                                    className="mb-2 block text-sm font-semibold text-[#172033] dark:text-[#e5ebf5]"
                                >
                                    Email address
                                </label>

                                <div className="relative">
                                    <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-[#7b8aa3] dark:text-[#8392aa]">
                                        <MailIcon />
                                    </span>

                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={form.data.email}
                                        onChange={(event) => {
                                            setSubmitted(false);

                                            form.setData(
                                                'email',
                                                event.target.value,
                                            );
                                        }}
                                        autoComplete="email"
                                        autoFocus
                                        required
                                        placeholder="you@example.com"
                                        className={`h-11 w-full rounded-[6px] border bg-white pl-11 pr-3 text-sm text-[#172033] outline-none transition placeholder:text-[#8794a9] dark:bg-[#0d1626] dark:text-white dark:placeholder:text-[#697891] ${
                                            form.errors.email
                                                ? 'border-[#d13438] focus:border-[#d13438] focus:ring-2 focus:ring-[#d13438]/20 dark:border-[#ff7b7b]'
                                                : 'border-[#c9d2df] hover:border-[#aebbd0] focus:border-[#1554c0] focus:ring-2 focus:ring-[#1554c0]/15 dark:border-[#34435a] dark:hover:border-[#4b5d78] dark:focus:border-[#4c8dff] dark:focus:ring-[#4c8dff]/15'
                                        }`}
                                    />
                                </div>

                                {form.errors.email && (
                                    <p className="mt-1.5 text-xs text-[#d13438] dark:text-[#ff7b7b]">
                                        {form.errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Primary action */}
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="flex h-11 w-full items-center justify-center gap-2 rounded-[6px] bg-[#1554c0] px-4 text-sm font-semibold text-white shadow-[0_2px_5px_rgba(21,84,192,0.22)] transition hover:bg-[#1048a8] focus:outline-none focus:ring-2 focus:ring-[#1554c0]/30 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#4c8dff] dark:text-[#07101f] dark:shadow-[0_2px_8px_rgba(76,141,255,0.22)] dark:hover:bg-[#6ba3ff] dark:focus:ring-[#4c8dff]/30 dark:focus:ring-offset-[#111827]"
                            >
                                {form.processing
                                    ? 'Sending reset link...'
                                    : 'Send reset link'}

                                {!form.processing && <ArrowIcon />}
                            </button>
                        </form>

                        {/* Back to sign in */}
                        <div className="mt-6 text-center">
                            <Link
                                href="/login"
                                className="text-sm font-semibold text-[#1554c0] hover:underline dark:text-[#6ba3ff]"
                            >
                                ← Back to sign in
                            </Link>
                        </div>
                    </section>

                    {/* Footer */}
                    <footer className="mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-[#71809a] dark:text-[#66758c]">
                        <Link
                            href="/"
                            className="hover:text-[#1554c0] hover:underline dark:hover:text-[#6ba3ff]"
                        >
                            Learn With Flevian
                        </Link>

                        <span aria-hidden="true">•</span>

                        <span>
                            © {new Date().getFullYear()}
                        </span>

                        <span aria-hidden="true">•</span>

                        <span>Secure authentication</span>
                    </footer>
                </div>
            </main>
        </>
    );
}