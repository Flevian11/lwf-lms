import { FormEvent, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';

interface ResetPasswordProps {
    token: string;
    email?: string;
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

function LockIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
            aria-hidden="true"
        >
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
    );
}

function EyeIcon({ open }: { open: boolean }) {
    return open ? (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
            aria-hidden="true"
        >
            <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
            <circle cx="12" cy="12" r="2.5" />
        </svg>
    ) : (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
            aria-hidden="true"
        >
            <path d="M3 3l18 18" />
            <path d="M10.6 6.2A9.7 9.7 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3.1 3.7" />
            <path d="M6.2 6.7C3.8 8.2 2.5 12 2.5 12s3.5 6 9.5 6c1.2 0 2.3-.2 3.3-.6" />
            <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
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

export default function ResetPassword({
    token,
    email = '',
}: ResetPasswordProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const form = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.post('/reset-password', {
            onFinish: () => {
                form.reset('password', 'password_confirmation');
            },
        });
    };

    return (
        <>
            <Head title="Reset Password" />

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
                                Create a new password
                            </h1>

                            <p className="mt-2 text-center text-sm leading-5 text-[#53627a] dark:text-[#aab7cc]">
                                Choose a strong password for your Learn With
                                Flevian account.
                            </p>
                        </header>

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
                                        onChange={(event) =>
                                            form.setData(
                                                'email',
                                                event.target.value,
                                            )
                                        }
                                        autoComplete="email"
                                        required
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

                            {/* New password */}
                            <div>
                                <label
                                    htmlFor="password"
                                    className="mb-2 block text-sm font-semibold text-[#172033] dark:text-[#e5ebf5]"
                                >
                                    New password
                                </label>

                                <div className="relative">
                                    <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-[#7b8aa3] dark:text-[#8392aa]">
                                        <LockIcon />
                                    </span>

                                    <input
                                        id="password"
                                        type={
                                            showPassword
                                                ? 'text'
                                                : 'password'
                                        }
                                        name="password"
                                        value={form.data.password}
                                        onChange={(event) =>
                                            form.setData(
                                                'password',
                                                event.target.value,
                                            )
                                        }
                                        autoComplete="new-password"
                                        required
                                        placeholder="Enter your new password"
                                        className={`h-11 w-full rounded-[6px] border bg-white pl-11 pr-11 text-sm text-[#172033] outline-none transition placeholder:text-[#8794a9] dark:bg-[#0d1626] dark:text-white dark:placeholder:text-[#697891] ${
                                            form.errors.password
                                                ? 'border-[#d13438] focus:border-[#d13438] focus:ring-2 focus:ring-[#d13438]/20 dark:border-[#ff7b7b]'
                                                : 'border-[#c9d2df] hover:border-[#aebbd0] focus:border-[#1554c0] focus:ring-2 focus:ring-[#1554c0]/15 dark:border-[#34435a] dark:hover:border-[#4b5d78] dark:focus:border-[#4c8dff] dark:focus:ring-[#4c8dff]/15'
                                        }`}
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(
                                                (value) => !value,
                                            )
                                        }
                                        aria-label={
                                            showPassword
                                                ? 'Hide password'
                                                : 'Show password'
                                        }
                                        className="absolute inset-y-0 right-3 flex items-center text-[#7b8aa3] transition hover:text-[#172033] dark:text-[#8392aa] dark:hover:text-white"
                                    >
                                        <EyeIcon
                                            open={showPassword}
                                        />
                                    </button>
                                </div>

                                {form.errors.password && (
                                    <p className="mt-1.5 text-xs text-[#d13438] dark:text-[#ff7b7b]">
                                        {form.errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Confirm password */}
                            <div>
                                <label
                                    htmlFor="password_confirmation"
                                    className="mb-2 block text-sm font-semibold text-[#172033] dark:text-[#e5ebf5]"
                                >
                                    Confirm new password
                                </label>

                                <div className="relative">
                                    <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-[#7b8aa3] dark:text-[#8392aa]">
                                        <LockIcon />
                                    </span>

                                    <input
                                        id="password_confirmation"
                                        type={
                                            showConfirmation
                                                ? 'text'
                                                : 'password'
                                        }
                                        name="password_confirmation"
                                        value={
                                            form.data.password_confirmation
                                        }
                                        onChange={(event) =>
                                            form.setData(
                                                'password_confirmation',
                                                event.target.value,
                                            )
                                        }
                                        autoComplete="new-password"
                                        required
                                        placeholder="Confirm your new password"
                                        className={`h-11 w-full rounded-[6px] border bg-white pl-11 pr-11 text-sm text-[#172033] outline-none transition placeholder:text-[#8794a9] dark:bg-[#0d1626] dark:text-white dark:placeholder:text-[#697891] ${
                                            form.errors.password_confirmation
                                                ? 'border-[#d13438] focus:border-[#d13438] focus:ring-2 focus:ring-[#d13438]/20 dark:border-[#ff7b7b]'
                                                : 'border-[#c9d2df] hover:border-[#aebbd0] focus:border-[#1554c0] focus:ring-2 focus:ring-[#1554c0]/15 dark:border-[#34435a] dark:hover:border-[#4b5d78] dark:focus:border-[#4c8dff] dark:focus:ring-[#4c8dff]/15'
                                        }`}
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowConfirmation(
                                                (value) => !value,
                                            )
                                        }
                                        aria-label={
                                            showConfirmation
                                                ? 'Hide password confirmation'
                                                : 'Show password confirmation'
                                        }
                                        className="absolute inset-y-0 right-3 flex items-center text-[#7b8aa3] transition hover:text-[#172033] dark:text-[#8392aa] dark:hover:text-white"
                                    >
                                        <EyeIcon
                                            open={showConfirmation}
                                        />
                                    </button>
                                </div>

                                {form.errors.password_confirmation && (
                                    <p className="mt-1.5 text-xs text-[#d13438] dark:text-[#ff7b7b]">
                                        {form.errors.password_confirmation}
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
                                    ? 'Resetting password...'
                                    : 'Reset password'}

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