import { Form, Head } from '@inertiajs/react';
import { useMemo, useState } from 'react';

interface OnboardingUser {
    name: string;
    email: string;
    avatar_path: string | null;
}

interface LearningInterest {
    id: number;
    name: string;
    slug: string;
}

interface OnboardingProps {
    user: OnboardingUser;
    interests: LearningInterest[];
}

type Step = 1 | 2 | 3;

function ArrowRightIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
            aria-hidden="true"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 12h14M13 6l6 6-6 6"
            />
        </svg>
    );
}

function ArrowLeftIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
            aria-hidden="true"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 12H5m6 6-6-6 6-6"
            />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="h-4 w-4"
            aria-hidden="true"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m5 12 4 4L19 6"
            />
        </svg>
    );
}

function SparklesIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-6 w-6"
            aria-hidden="true"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m12 3-1.15 4.35a4 4 0 0 1-2.8 2.8L3.7 11.3l4.35 1.15a4 4 0 0 1 2.8 2.8L12 19.6l1.15-4.35a4 4 0 0 1 2.8-2.8l4.35-1.15-4.35-1.15a4 4 0 0 1-2.8-2.8L12 3Z"
            />
        </svg>
    );
}

function GraduationIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-6 w-6"
            aria-hidden="true"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m3 9 9-5 9 5-9 5-9-5Z"
            />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 11.2V15c2.8 2.2 7.2 2.2 10 0v-3.8"
            />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 9v6"
            />
        </svg>
    );
}

function ShieldIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-6 w-6"
            aria-hidden="true"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3 20 6v5.5c0 4.7-3.2 7.9-8 9.5-4.8-1.6-8-4.8-8-9.5V6l8-3Z"
            />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.5 12 2.2 2.2 4.8-5"
            />
        </svg>
    );
}

function UserAvatar({
    user,
    size = 'large',
}: {
    user: OnboardingUser;
    size?: 'large' | 'small';
}) {
    const firstName = user.name.trim().split(/\s+/)[0] || '';
    const initials =
        user.name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join('') || '?';

    const sizeClasses =
        size === 'large'
            ? 'h-20 w-20 text-2xl'
            : 'h-10 w-10 text-sm';

    return user.avatar_path ? (
        <img
            src={`/storage/${user.avatar_path}`}
            alt={`${firstName}'s profile`}
            className={`${sizeClasses} rounded-full object-cover ring-4 ring-blue-500/10`}
        />
    ) : (
        <div
            className={`${sizeClasses} flex items-center justify-center rounded-full bg-blue-600 font-bold text-white shadow-lg shadow-blue-600/20 dark:bg-blue-500`}
            aria-label={`${firstName}'s profile`}
        >
            {initials}
        </div>
    );
}

export default function Onboarding({
    user,
    interests,
}: OnboardingProps) {
    const [step, setStep] = useState<Step>(1);
    const [selectedInterests, setSelectedInterests] = useState<number[]>([]);

    const firstName = useMemo(
        () => user.name.trim().split(/\s+/)[0] || 'there',
        [user.name],
    );

    const progress = `${(step / 3) * 100}%`;

    const toggleInterest = (id: number) => {
        setSelectedInterests((current) =>
            current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id],
        );
    };

    const nextStep = () => {
        if (step === 2 && selectedInterests.length === 0) {
            return;
        }

        if (step < 3) {
            setStep((current) => (current + 1) as Step);
        }
    };

    const previousStep = () => {
        if (step > 1) {
            setStep((current) => (current - 1) as Step);
        }
    };

    const selectedInterestNames = interests.filter((interest) =>
        selectedInterests.includes(interest.id),
    );

    return (
        <>
            <Head title="Set up your Learn With Flevian account" />

            <div className="min-h-screen bg-slate-50 text-slate-950 transition-colors dark:bg-slate-950 dark:text-white">
                <div className="relative min-h-screen overflow-hidden">
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-600/10" />
                        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-600/10" />
                    </div>

                    <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-6 sm:px-8 sm:py-8">
                        <header className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img
                                    src="/favicon-192x192.png"
                                    alt="Learn With Flevian"
                                    className="h-10 w-10 rounded-xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800"
                                />

                                <div>
                                    <p className="text-sm font-semibold text-slate-950 dark:text-white">
                                        Learn With Flevian
                                    </p>

                                    <p className="text-xs text-slate-500 dark:text-slate-500">
                                        Learning Management System
                                    </p>
                                </div>
                            </div>

                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                Step {step} of 3
                            </span>
                        </header>

                        <div className="mx-auto mt-8 w-full max-w-3xl">
                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                                <div
                                    className="h-full rounded-full bg-blue-600 transition-all duration-500 ease-out dark:bg-blue-500"
                                    style={{ width: progress }}
                                />
                            </div>

                            <div className="mt-3 flex justify-between text-xs font-medium text-slate-400 dark:text-slate-500">
                                <span
                                    className={
                                        step >= 1
                                            ? 'text-blue-600 dark:text-blue-400'
                                            : ''
                                    }
                                >
                                    Welcome
                                </span>

                                <span
                                    className={
                                        step >= 2
                                            ? 'text-blue-600 dark:text-blue-400'
                                            : ''
                                    }
                                >
                                    Interests
                                </span>

                                <span
                                    className={
                                        step >= 3
                                            ? 'text-blue-600 dark:text-blue-400'
                                            : ''
                                    }
                                >
                                    Finish
                                </span>
                            </div>
                        </div>

                        <main className="mx-auto flex w-full max-w-3xl flex-1 items-center py-10">
                            <div className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">

                                {/* Welcome */}
                                {step === 1 && (
                                    <section className="px-6 py-12 text-center sm:px-12 sm:py-16">
                                        <div className="mx-auto mb-6 flex justify-center">
                                            <UserAvatar user={user} />
                                        </div>

                                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">
                                            Welcome to Learn With Flevian
                                        </p>

                                        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                                            Welcome, {firstName}.
                                        </h1>

                                        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
                                            Your account is ready. Let's take
                                            one quick step to personalize your
                                            learning experience.
                                        </p>

                                        <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left dark:border-slate-800 dark:bg-slate-950/60">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                                    <SparklesIcon />
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="font-semibold">
                                                        Let's personalize your
                                                        learning
                                                    </p>

                                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                        Tell us which areas you
                                                        would like to explore.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                )}

                                {/* Interests */}
                                {step === 2 && (
                                    <section className="px-6 py-10 sm:px-12 sm:py-14">
                                        <div className="mx-auto max-w-2xl">
                                            <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                                                <GraduationIcon />
                                            </div>

                                            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">
                                                Your interests
                                            </p>

                                            <h1 className="mt-3 text-3xl font-bold tracking-tight">
                                                What would you like to learn?
                                            </h1>

                                            <p className="mt-3 text-slate-600 dark:text-slate-400">
                                                Select the areas that interest
                                                you. Choose as many as you like.
                                            </p>

                                            <div className="mt-8 grid gap-3 sm:grid-cols-2">
                                                {interests.map((interest) => {
                                                    const selected =
                                                        selectedInterests.includes(
                                                            interest.id,
                                                        );

                                                    return (
                                                        <button
                                                            key={interest.id}
                                                            type="button"
                                                            onClick={() =>
                                                                toggleInterest(
                                                                    interest.id,
                                                                )
                                                            }
                                                            className={`flex items-center justify-between rounded-xl border p-4 text-left text-sm font-medium transition ${
                                                                selected
                                                                    ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/10 dark:border-blue-500 dark:bg-blue-500/10 dark:text-blue-300'
                                                                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-900'
                                                            }`}
                                                        >
                                                            <span>
                                                                {interest.name}
                                                            </span>

                                                            <span
                                                                className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                                                                    selected
                                                                        ? 'border-blue-600 bg-blue-600 text-white'
                                                                        : 'border-slate-300 text-transparent dark:border-slate-700'
                                                                }`}
                                                            >
                                                                <CheckIcon />
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            <p className="mt-5 text-xs text-slate-500 dark:text-slate-500">
                                                {selectedInterests.length === 0
                                                    ? 'Select at least one area to continue.'
                                                    : `${selectedInterests.length} ${
                                                          selectedInterests.length ===
                                                          1
                                                              ? 'interest'
                                                              : 'interests'
                                                      } selected.`}
                                            </p>
                                        </div>
                                    </section>
                                )}

                                {/* Finish */}
                                {step === 3 && (
                                    <section className="px-6 py-12 text-center sm:px-12 sm:py-16">
                                        <div className="mx-auto mb-6 flex justify-center">
                                            <UserAvatar
                                                user={user}
                                            />
                                        </div>

                                        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                                            <ShieldIcon />
                                        </div>

                                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                                            You're ready
                                        </p>

                                        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                                            You're all set, {firstName}.
                                        </h1>

                                        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
                                            Your learning space is ready. We've
                                            saved your interests so your
                                            experience can be personalized.
                                        </p>

                                        <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-slate-200 bg-slate-50 p-6 text-left dark:border-slate-800 dark:bg-slate-950/60">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                                                    <CheckIcon />
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="font-semibold">
                                                        Account ready
                                                    </p>

                                                    <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mx-auto mt-6 max-w-xl text-left">
                                            <p className="mb-3 text-sm font-semibold">
                                                Your selected interests
                                            </p>

                                            <div className="flex flex-wrap gap-2">
                                                {selectedInterestNames.map(
                                                    (interest) => (
                                                        <span
                                                            key={interest.id}
                                                            className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                                                        >
                                                            {interest.name}
                                                        </span>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    </section>
                                )}

                                {/* Navigation */}
                                <div className="border-t border-slate-200 bg-slate-50/70 px-6 py-5 dark:border-slate-800 dark:bg-slate-950/40">
                                    <div className="flex items-center justify-between gap-4">
                                        {step > 1 ? (
                                            <button
                                                type="button"
                                                onClick={previousStep}
                                                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                                            >
                                                <ArrowLeftIcon />
                                                Back
                                            </button>
                                        ) : (
                                            <div />
                                        )}

                                        {step < 3 ? (
                                            <button
                                                type="button"
                                                onClick={nextStep}
                                                disabled={
                                                    step === 2 &&
                                                    selectedInterests.length ===
                                                        0
                                                }
                                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
                                            >
                                                Continue
                                                <ArrowRightIcon />
                                            </button>
                                        ) : (
                                            <Form
                                                method="post"
                                                action="/onboarding/complete"
                                                options={{
                                                    preserveScroll: true,
                                                }}
                                            >
                                                {({ processing }) => (
                                                    <>
                                                        {selectedInterests.map(
                                                            (interestId) => (
                                                                <input
                                                                    key={
                                                                        interestId
                                                                    }
                                                                    type="hidden"
                                                                    name="interests[]"
                                                                    value={
                                                                        interestId
                                                                    }
                                                                />
                                                            ),
                                                        )}

                                                        <button
                                                            type="submit"
                                                            disabled={
                                                                processing ||
                                                                selectedInterests.length ===
                                                                    0
                                                            }
                                                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-600"
                                                        >
                                                            {processing
                                                                ? 'Finishing setup...'
                                                                : 'Go to Dashboard'}

                                                            {!processing && (
                                                                <ArrowRightIcon />
                                                            )}
                                                        </button>
                                                    </>
                                                )}
                                            </Form>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </main>

                        <footer className="pb-2 text-center text-xs text-slate-500 dark:text-slate-500">
                            Learn With Flevian LMS
                        </footer>
                    </div>
                </div>
            </div>
        </>
    );
}