import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

interface LoginProps {
    canResetPassword?: boolean;
    canRegister?: boolean;
    status?: string;
}

function MailIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
        </svg>
    );
}

function LockIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
    );
}

function EyeIcon({ open }: { open: boolean }) {
    return open ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
            <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
            <circle cx="12" cy="12" r="2.5" />
        </svg>
    ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
            <path d="M3 3l18 18" />
            <path d="M10.6 6.2A9.7 9.7 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3.1 3.7" />
            <path d="M6.2 6.7C3.8 8.2 2.5 12 2.5 12s3.5 6 9.5 6c1.2 0 2.3-.2 3.3-.6" />
            <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
        </svg>
    );
}

function ArrowIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
            <path d="M10 17l5-5-5-5" />
            <path d="M15 12H3" />
        </svg>
    );
}

function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-5 w-5">
            <path
                fill="#4285F4"
                d="M21.35 12.27c0-.68-.06-1.35-.17-1.99H12v3.77h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.17Z"
            />
            <path
                fill="#34A853"
                d="M12 21.8c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.47-4.03H3.29v2.53A9.75 9.75 0 0 0 12 21.8Z"
            />
            <path
                fill="#FBBC05"
                d="M6.53 13.88a5.86 5.86 0 0 1 0-3.76V7.59H3.29a9.8 9.8 0 0 0 0 8.82l3.24-2.53Z"
            />
            <path
                fill="#EA4335"
                d="M12 6.09c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.18 14.63 2.2 12 2.2a9.75 9.75 0 0 0-8.71 5.39l3.24 2.53C7.3 7.81 9.46 6.09 12 6.09Z"
            />
        </svg>
    );
}

function GithubIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path d="M12 .5A11.5 11.5 0 0 0 8.36 22.9c.58.1.79-.25.79-.56v-2.16c-3.2.7-3.87-1.54-3.87-1.54-.53-1.36-1.3-1.72-1.3-1.72-1.04-.72.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.67 1.25 3.32.95.1-.74.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.47.11-3.06 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.73 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.77.11 3.06.73.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.25 5.69.41.35.78 1.04.78 2.1v3.1c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
        </svg>
    );
}

export default function Login({
    canResetPassword = true,
    canRegister = true,
    status,
}: LoginProps) {
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.post('/login', {
            onFinish: () => form.reset('password'),
        });
    };

    return (
        <>
            <Head title="Sign in" />

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
                                Sign in
                            </h1>

                            <p className="mt-2 text-center text-sm text-[#53627a] dark:text-[#aab7cc]">
                                Continue your learning journey.
                            </p>
                        </header>

                        {status && (
                            <div className="mb-5 rounded-[6px] border border-[#a7d8a7] bg-[#f0fff0] px-3 py-2.5 text-sm text-[#107c10] dark:border-[#275b2b] dark:bg-[#102718] dark:text-[#6ccb5f]">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-5">

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
                                            form.setData('email', event.target.value)
                                        }
                                        autoComplete="email"
                                        autoFocus
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

                            {/* Password */}
                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <label
                                        htmlFor="password"
                                        className="text-sm font-semibold text-[#172033] dark:text-[#e5ebf5]"
                                    >
                                        Password
                                    </label>

                                    {canResetPassword && (
                                        <Link
                                            href="/forgot-password"
                                            className="text-xs font-semibold text-[#1554c0] hover:underline dark:text-[#6ba3ff]"
                                        >
                                            Forgot password?
                                        </Link>
                                    )}
                                </div>

                                <div className="relative">
                                    <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-[#7b8aa3] dark:text-[#8392aa]">
                                        <LockIcon />
                                    </span>

                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={form.data.password}
                                        onChange={(event) =>
                                            form.setData('password', event.target.value)
                                        }
                                        autoComplete="current-password"
                                        placeholder="Enter your password"
                                        className={`h-11 w-full rounded-[6px] border bg-white pl-11 pr-11 text-sm text-[#172033] outline-none transition placeholder:text-[#8794a9] dark:bg-[#0d1626] dark:text-white dark:placeholder:text-[#697891] ${
                                            form.errors.password
                                                ? 'border-[#d13438] focus:border-[#d13438] focus:ring-2 focus:ring-[#d13438]/20 dark:border-[#ff7b7b]'
                                                : 'border-[#c9d2df] hover:border-[#aebbd0] focus:border-[#1554c0] focus:ring-2 focus:ring-[#1554c0]/15 dark:border-[#34435a] dark:hover:border-[#4b5d78] dark:focus:border-[#4c8dff] dark:focus:ring-[#4c8dff]/15'
                                        }`}
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((value) => !value)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        className="absolute inset-y-0 right-3 flex items-center text-[#7b8aa3] transition hover:text-[#172033] dark:text-[#8392aa] dark:hover:text-white"
                                    >
                                        <EyeIcon open={showPassword} />
                                    </button>
                                </div>

                                {form.errors.password && (
                                    <p className="mt-1.5 text-xs text-[#d13438] dark:text-[#ff7b7b]">
                                        {form.errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Remember */}
                            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[#53627a] dark:text-[#aab7cc]">
                                <input
                                    type="checkbox"
                                    checked={form.data.remember}
                                    onChange={(event) =>
                                        form.setData('remember', event.target.checked)
                                    }
                                    className="h-4 w-4 rounded-[3px] border-[#b8c3d3] text-[#1554c0] accent-[#1554c0] focus:ring-[#1554c0] dark:border-[#46566f] dark:bg-[#0d1626] dark:accent-[#4c8dff]"
                                />
                                Remember me
                            </label>

                            {/* Primary action */}
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="flex h-11 w-full items-center justify-center gap-2 rounded-[6px] bg-[#1554c0] px-4 text-sm font-semibold text-white shadow-[0_2px_5px_rgba(21,84,192,0.22)] transition hover:bg-[#1048a8] focus:outline-none focus:ring-2 focus:ring-[#1554c0]/30 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#4c8dff] dark:text-[#07101f] dark:shadow-[0_2px_8px_rgba(76,141,255,0.22)] dark:hover:bg-[#6ba3ff] dark:focus:ring-[#4c8dff]/30 dark:focus:ring-offset-[#111827]"
                            >
                                {form.processing ? 'Signing in...' : 'Sign in'}

                                {!form.processing && <ArrowIcon />}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="my-6 flex items-center gap-3">
                            <div className="h-px flex-1 bg-[#e1e6ee] dark:bg-[#2a3850]" />

                            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#7b8aa3] dark:text-[#71819a]">
                                Or
                            </span>

                            <div className="h-px flex-1 bg-[#e1e6ee] dark:bg-[#2a3850]" />
                        </div>

                        {/* Social authentication */}
                        <div className="space-y-3">

                            <a
                                href="/auth/google"
                                className="flex h-11 w-full items-center justify-center gap-3 rounded-[6px] border border-[#c9d2df] bg-white px-4 text-sm font-semibold text-[#172033] transition hover:border-[#aebbd0] hover:bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#1554c0]/20 focus:ring-offset-2 focus:ring-offset-white dark:border-[#34435a] dark:bg-[#182235] dark:text-[#edf2fa] dark:hover:border-[#4b5d78] dark:hover:bg-[#202c40] dark:focus:ring-[#4c8dff]/20 dark:focus:ring-offset-[#111827]"
                            >
                                <GoogleIcon />
                                Continue with Google
                            </a>

                            <a
                                href="/auth/github"
                                className="flex h-11 w-full items-center justify-center gap-3 rounded-[6px] border border-[#c9d2df] bg-white px-4 text-sm font-semibold text-[#172033] transition hover:border-[#aebbd0] hover:bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#1554c0]/20 focus:ring-offset-2 focus:ring-offset-white dark:border-[#34435a] dark:bg-[#182235] dark:text-[#edf2fa] dark:hover:border-[#4b5d78] dark:hover:bg-[#202c40] dark:focus:ring-[#4c8dff]/20 dark:focus:ring-offset-[#111827]"
                            >
                                <GithubIcon />
                                Continue with GitHub
                            </a>
                        </div>
                    </section>

                    {/* Registration */}
                    {canRegister && (
                        <div className="mt-4 w-full rounded-[6px] border border-[#d8dee9] bg-white px-5 py-4 text-center text-sm shadow-[0_1px_3px_rgba(23,32,51,0.04)] dark:border-[#2a3850] dark:bg-[#111827] dark:shadow-none">
                            <span className="text-[#53627a] dark:text-[#aab7cc]">
                                New to Learn With Flevian?
                            </span>{' '}
                            <Link
                                href="/register"
                                className="font-semibold text-[#1554c0] hover:underline dark:text-[#6ba3ff]"
                            >
                                Create an account
                            </Link>
                        </div>
                    )}

                    {/* Footer */}
                    <footer className="mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-[#71809a] dark:text-[#66758c]">
                        <Link
                            href="/"
                            className="hover:text-[#1554c0] hover:underline dark:hover:text-[#6ba3ff]"
                        >
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
    );
}