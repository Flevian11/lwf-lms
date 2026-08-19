import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';

interface TwoFactorChallengeProps {
    email: string;
    expires_at: string | null;
}

function ShieldIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
        >
            <path d="M12 3 20 6v5c0 5-3.2 8.3-8 10-4.8-1.7-8-5-8-10V6l8-3Z" />
            <path d="m9 12 2 2 4-4" />
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
        >
            <path d="M10 17l5-5-5-5" />
            <path d="M15 12H3" />
        </svg>
    );
}

export default function TwoFactorChallenge({
    email,
    expires_at,
}: TwoFactorChallengeProps) {
    const [secondsRemaining, setSecondsRemaining] = useState<number | null>(
        null,
    );

    const form = useForm({
        code: '',
    });

    const resendForm = useForm({});

    useEffect(() => {
        if (!expires_at) {
            return;
        }

        const updateCountdown = () => {
            const difference =
                new Date(expires_at).getTime() - Date.now();

            setSecondsRemaining(
                Math.max(0, Math.floor(difference / 1000)),
            );
        };

        updateCountdown();

        const timer = window.setInterval(
            updateCountdown,
            1000,
        );

        return () => {
            window.clearInterval(timer);
        };
    }, [expires_at]);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.post('/two-factor-challenge', {
            onFinish: () => {
                form.reset('code');
            },
        });
    };

    const resend = () => {
        resendForm.post('/two-factor-challenge/resend');
    };

    const formattedTime =
        secondsRemaining !== null
            ? `${Math.floor(secondsRemaining / 60)
                  .toString()
                  .padStart(2, '0')}:${(secondsRemaining % 60)
                  .toString()
                  .padStart(2, '0')}`
            : null;

    return (
        <>
            <Head title="Email verification" />

            <main className="min-h-screen bg-[#f5f7fa] px-4 py-10 text-[#172033] transition-colors dark:bg-[#0b1220] dark:text-[#f3f6fc] sm:py-14">
                <div className="mx-auto flex w-full max-w-[460px] flex-col items-center">

                    {/* Brand */}
                    <Link
                        href="/"
                        className="group mb-7 flex flex-col items-center"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 rounded-[16px] bg-[#1554c0]/10 blur-md" />

                            <div className="relative flex h-14 w-14 items-center justify-center rounded-[16px] bg-white shadow-sm ring-1 ring-[#dfe5ee] dark:bg-[#101a2b] dark:ring-[#26344a]">
                                <span className="text-xl font-bold text-[#1554c0]">
                                    &lt;/&gt;
                                </span>
                            </div>
                        </div>

                        <span className="mt-3 text-[15px] font-medium text-[#172033] dark:text-white">
                            Learn With Flevian
                        </span>
                    </Link>

                    {/* Card */}
                    <section className="w-full overflow-hidden rounded-[8px] border border-[#dce3ed] bg-white shadow-sm dark:border-[#26344a] dark:bg-[#111b2c]">

                        <div className="px-5 py-8 sm:px-7">

                            {/* Icon */}
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eaf0fb] text-[#1554c0] dark:bg-[#162844] dark:text-[#70a2ff]">
                                <ShieldIcon />
                            </div>

                            <header className="mt-5 text-center">
                                <h1 className="text-[25px] font-semibold tracking-[-0.025em] text-[#172033] dark:text-white">
                                    Check your email
                                </h1>

                                <p className="mt-2 text-sm leading-6 text-[#53627a] dark:text-[#aab7cc]">
                                    We sent a 6-digit security code to
                                </p>

                                <p className="mt-1 text-sm font-semibold text-[#172033] dark:text-white">
                                    {email}
                                </p>
                            </header>

                            {form.errors.code && (
                                <div className="mt-5 rounded-[6px] border border-[#d13438] bg-[#fff5f5] px-3 py-2.5 text-sm text-[#b42318] dark:border-[#6f3030] dark:bg-[#2a1517] dark:text-[#ff8b8b]">
                                    {form.errors.code}
                                </div>
                            )}

                            <form
                                onSubmit={submit}
                                className="mt-6 space-y-5"
                            >
                                <div>
                                    <label
                                        htmlFor="code"
                                        className="mb-2 block text-sm font-semibold text-[#172033] dark:text-[#e5ebf5]"
                                    >
                                        Security code
                                    </label>

                                    <div className="relative">
                                        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-[#7b8aa3] dark:text-[#8392aa]">
                                            <ShieldIcon />
                                        </span>

                                        <input
                                            id="code"
                                            name="code"
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            autoFocus
                                            maxLength={6}
                                            value={form.data.code}
                                            onChange={(event) =>
                                                form.setData(
                                                    'code',
                                                    event.target.value
                                                        .replace(
                                                            /\D/g,
                                                            '',
                                                        )
                                                        .slice(0, 6),
                                                )
                                            }
                                            placeholder="000000"
                                            className="h-11 w-full rounded-[6px] border border-[#c9d2df] bg-white pl-11 pr-3 text-center text-base font-semibold tracking-[0.3em] text-[#172033] outline-none transition placeholder:font-normal placeholder:tracking-normal placeholder:text-[#8794a9] hover:border-[#aebbd0] focus:border-[#1554c0] focus:ring-2 focus:ring-[#1554c0]/15 dark:border-[#34435a] dark:bg-[#0d1626] dark:text-white dark:placeholder:text-[#697891] dark:hover:border-[#4b5d78] dark:focus:border-[#4c8dff] dark:focus:ring-[#4c8dff]/15"
                                        />
                                    </div>
                                </div>

                                {formattedTime && secondsRemaining !== 0 && (
                                    <p className="text-center text-xs text-[#6b7890] dark:text-[#8e9bb0]">
                                        Code expires in{' '}
                                        <span className="font-semibold text-[#172033] dark:text-white">
                                            {formattedTime}
                                        </span>
                                    </p>
                                )}

                                {secondsRemaining === 0 && (
                                    <p className="text-center text-xs font-medium text-[#b42318]">
                                        This code has expired. Request a new
                                        code below.
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={
                                        form.processing ||
                                        form.data.code.length !== 6
                                    }
                                    className="flex h-11 w-full items-center justify-center gap-2 rounded-[6px] bg-[#1554c0] px-4 text-sm font-semibold text-white transition hover:bg-[#124aa8] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {form.processing
                                        ? 'Verifying...'
                                        : 'Verify code'}

                                    {!form.processing && <ArrowIcon />}
                                </button>
                            </form>

                            <div className="mt-6 border-t border-[#e5e9f0] pt-5 text-center dark:border-[#29374c]">
                                <p className="text-sm text-[#53627a] dark:text-[#9aa8bc]">
                                    Didn't receive the email?
                                </p>

                                <button
                                    type="button"
                                    onClick={resend}
                                    disabled={resendForm.processing}
                                    className="mt-2 text-sm font-semibold text-[#1554c0] hover:underline disabled:opacity-50 dark:text-[#70a2ff]"
                                >
                                    {resendForm.processing
                                        ? 'Sending...'
                                        : 'Send a new code'}
                                </button>
                            </div>
                        </div>

                        <div className="border-t border-[#e5e9f0] px-5 py-4 text-center dark:border-[#29374c]">
                            <Link
                                href="/login"
                                className="text-sm font-medium text-[#53627a] hover:text-[#1554c0] dark:text-[#9aa8bc] dark:hover:text-[#70a2ff]"
                            >
                                Back to sign in
                            </Link>
                        </div>
                    </section>

                    <footer className="mt-7 text-center text-xs text-[#708099] dark:text-[#78879d]">
                        <span>Learn With Flevian</span>
                        <span className="mx-3">•</span>
                        <span>© 2026</span>
                        <span className="mx-3">•</span>
                        <span>Secure authentication</span>
                    </footer>
                </div>
            </main>
        </>
    );
}