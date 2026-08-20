import { Head, useForm, usePage } from '@inertiajs/react'
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from 'react'
import type { PageProps } from '../Components/student-types'
import StudentLayout from '../Components/StudentLayout'
import {
    Card,
    Icon,
    SectionHeader,
    assetUrl,
    formatDate,
    initials,
} from '../Components/StudentUI'

interface LearningInterest {
    id: number
    name: string
}

interface ProfileData {
    name: string
    email: string
    avatar_path: string | null
    timezone: string
    locale: string
    role: string | null
    email_verified_at: string | null
    onboarding_completed_at: string | null
}

interface LinkedAccounts {
    google: boolean
    github: boolean
}

interface ProfilePageProps extends PageProps {
    profile: ProfileData
    learningInterests: LearningInterest[]
    selectedLearningInterestIds: number[]
    linkedAccounts?: LinkedAccounts
}

function ProviderMark({ provider }: { provider: 'google' | 'github' }) {
    if (provider === 'google') {
        return (
            <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
            >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path
                        fill="#4285F4"
                        d="M21.35 12.27c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.26Z"
                    />
                    <path
                        fill="#34A853"
                        d="M12 21.82c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.82Z"
                    />
                    <path
                        fill="#FBBC05"
                        d="M6.54 13.9a5.86 5.86 0 0 1 0-3.76V7.61H3.3a9.83 9.83 0 0 0 0 8.82l3.24-2.53Z"
                    />
                    <path
                        fill="#EA4335"
                        d="M12 6.11c1.43 0 2.72.49 3.73 1.45l2.8-2.8C16.84 3.19 14.63 2.18 12 2.18a9.74 9.74 0 0 0-8.7 5.43l3.24 2.53C7.31 7.83 9.46 6.11 12 6.11Z"
                    />
                </svg>
            </span>
        )
    }

    return (
        <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.24c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.09 1.84 1.23 1.84 1.23 1.07 1.83 2.8 1.3 3.49.99.11-.77.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.18 0 0 1-.32 3.3 1.23A11.47 11.47 0 0 1 12 6.06c1.02 0 2.05.14 3.01.41 2.3-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57A12 12 0 0 0 12 .5Z" />
            </svg>
        </span>
    )
}

function StatusPill({ linked }: { linked: boolean }) {
    return (
        <span
            className={[
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em]',
                linked
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
            ].join(' ')}
        >
            <span
                className={[
                    'h-1.5 w-1.5 rounded-full',
                    linked ? 'bg-emerald-500' : 'bg-slate-400',
                ].join(' ')}
            />
            {linked ? 'Linked' : 'Not linked'}
        </span>
    )
}

function InfoItem({
    label,
    value,
}: {
    label: string
    value: string
}) {
    return (
        <div className="rounded-xl bg-slate-50/80 px-3.5 py-3 dark:bg-slate-900/70">
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                {label}
            </p>
            <p className="mt-1 truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                {value}
            </p>
        </div>
    )
}

export default function Profile() {
    const {
        student,
        stats,
        profile,
        learningInterests,
        selectedLearningInterestIds,
        linkedAccounts = { google: false, github: false },
    } = usePage<ProfilePageProps>().props

    const avatarInput = useRef<HTMLInputElement | null>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(
        assetUrl(profile.avatar_path),
    )

    const form = useForm<{
        name: string
        email: string
        timezone: string
        locale: string
        avatar: File | null
        learning_interest_ids: number[]
    }>({
        name: profile.name,
        email: profile.email,
        timezone: 'Africa/Nairobi',
        locale: 'en',
        avatar: null,
        learning_interest_ids: selectedLearningInterestIds,
    })

    const selectedNames = useMemo(
        () =>
            learningInterests
                .filter((interest) =>
                    form.data.learning_interest_ids.includes(interest.id),
                )
                .map((interest) => interest.name),
        [learningInterests, form.data.learning_interest_ids],
    )

    const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null
        if (!file) return

        form.setData('avatar', file)
        setAvatarPreview(URL.createObjectURL(file))
    }

    const toggleInterest = (id: number) => {
        const selected = form.data.learning_interest_ids

        form.setData(
            'learning_interest_ids',
            selected.includes(id)
                ? selected.filter((interestId) => interestId !== id)
                : [...selected, id],
        )
    }

    const submit = (event: FormEvent) => {
        event.preventDefault()

        form.post('/profile', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => form.setData('avatar', null),
        })
    }

    const resetForm = () => {
        form.setData({
            name: profile.name,
            email: profile.email,
            timezone: 'Africa/Nairobi',
            locale: 'en',
            avatar: null,
            learning_interest_ids: selectedLearningInterestIds,
        })

        setAvatarPreview(assetUrl(profile.avatar_path))

        if (avatarInput.current) {
            avatarInput.current.value = ''
        }
    }

    return (
        <>
            <Head title="Profile" />

            <StudentLayout
                student={student}
                stats={stats}
                title="Profile"
            >
                <div className="space-y-5">
                    <section className="relative isolate overflow-hidden rounded-[26px] bg-[#10213f] px-6 py-6 text-white shadow-[0_18px_45px_rgba(21,84,192,0.14)] sm:px-7 sm:py-7">
                        <div
                            className="pointer-events-none absolute -inset-20 opacity-90"
                            style={{
                                background:
                                    'radial-gradient(circle at 86% 20%, rgba(76,141,255,.35), transparent 30%), radial-gradient(circle at 18% 100%, rgba(68,56,168,.28), transparent 34%)',
                            }}
                        />
                        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                            <div>
                                <div className="flex items-center gap-2 text-[#a9c7ff]">
                                    <Icon name="user" className="h-4 w-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                                        Account profile
                                    </span>
                                </div>
                                <h1 className="mt-2 text-2xl font-bold tracking-[-0.035em] sm:text-3xl">
                                    Your profile
                                </h1>
                                <p className="mt-2 max-w-xl text-xs leading-5 text-blue-100/75 sm:text-sm">
                                    Manage your personal details, preferences and
                                    learning interests.
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/10 text-lg font-bold ring-1 ring-white/15">
                                    {avatarPreview ? (
                                        <img
                                            src={avatarPreview}
                                            alt={profile.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        initials(profile.name)
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="max-w-[170px] truncate text-sm font-bold">
                                        {profile.name}
                                    </p>
                                    <p className="text-[10px] text-slate-300">
                                        {profile.role ?? 'Student'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {form.recentlySuccessful && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
                            Your profile has been updated successfully.
                        </div>
                    )}

                    {form.hasErrors && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
                            Please correct the highlighted fields and try again.
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-5">
                        <div className="grid gap-5 xl:grid-cols-[0.72fr_1.28fr]">
                            <Card className="p-5 sm:p-6">
                                <SectionHeader
                                    title="Profile photo"
                                    description="Use a clear photo for your student account."
                                />

                                <div className="mt-5 flex items-center gap-4">
                                    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[22px] bg-[#1554c0]/[0.08] text-2xl font-bold text-[#1554c0] ring-1 ring-[#1554c0]/10 dark:bg-[#4c8dff]/10 dark:text-[#8bb8ff]">
                                        {avatarPreview ? (
                                            <img
                                                src={avatarPreview}
                                                alt={`${profile.name}'s avatar`}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            initials(profile.name)
                                        )}
                                    </div>

                                    <div className="min-w-0">
                                        <input
                                            ref={avatarInput}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={handleAvatarChange}
                                            className="hidden"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => avatarInput.current?.click()}
                                            className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#1554c0] px-3.5 text-xs font-bold text-white transition hover:bg-[#1048a8]"
                                        >
                                            <Icon name="user" className="h-3.5 w-3.5" />
                                            Change photo
                                        </button>

                                        <p className="mt-2 text-[10px] leading-4 text-slate-400">
                                            JPG, PNG or WebP · Maximum 5 MB
                                        </p>

                                        {form.errors.avatar && (
                                            <p className="mt-1 text-[10px] font-medium text-red-600">
                                                {form.errors.avatar}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-5 grid grid-cols-2 gap-2">
                                    <InfoItem
                                        label="Role"
                                        value={profile.role ?? 'Student'}
                                    />
                                    <InfoItem
                                        label="Member since"
                                        value={formatDate(
                                            profile.onboarding_completed_at,
                                        )}
                                    />
                                </div>
                            </Card>

                            <Card className="p-5 sm:p-6">
                                <SectionHeader
                                    title="Personal information"
                                    description="The details used across your Learn With Flevian account."
                                />

                                <input type="hidden" name="timezone" value="Africa/Nairobi" />
                                <input type="hidden" name="locale" value="en" />

                                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <label
                                            htmlFor="profile-name"
                                            className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200"
                                        >
                                            Full name
                                        </label>
                                        <input
                                            id="profile-name"
                                            value={form.data.name}
                                            onChange={(event) =>
                                                form.setData(
                                                    'name',
                                                    event.target.value,
                                                )
                                            }
                                            className="h-10.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs outline-none transition focus:border-[#1554c0] focus:ring-4 focus:ring-[#1554c0]/10 dark:border-slate-700 dark:bg-slate-900/60 dark:text-white"
                                        />
                                        {form.errors.name && (
                                            <p className="mt-1 text-[10px] font-medium text-red-600">
                                                {form.errors.name}
                                            </p>
                                        )}
                                    </div>

                                    <div className="sm:col-span-2">
                                        <div className="mb-1.5 flex items-center justify-between">
                                            <label
                                                htmlFor="profile-email"
                                                className="block text-xs font-bold text-slate-700 dark:text-slate-200"
                                            >
                                                Email address
                                            </label>
                                            <span
                                                className={[
                                                    'rounded-full px-2 py-1 text-[8px] font-bold uppercase tracking-[0.1em]',
                                                    profile.email_verified_at
                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                                                        : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
                                                ].join(' ')}
                                            >
                                                {profile.email_verified_at
                                                    ? 'Verified'
                                                    : 'Unverified'}
                                            </span>
                                        </div>
                                        <input
                                            id="profile-email"
                                            type="email"
                                            value={form.data.email}
                                            onChange={(event) =>
                                                form.setData(
                                                    'email',
                                                    event.target.value,
                                                )
                                            }
                                            className="h-10.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs outline-none transition focus:border-[#1554c0] focus:ring-4 focus:ring-[#1554c0]/10 dark:border-slate-700 dark:bg-slate-900/60 dark:text-white"
                                        />
                                        <p className="mt-1.5 text-[10px] text-slate-400">
                                            Changing your email requires verification again.
                                        </p>
                                        {form.errors.email && (
                                            <p className="mt-1 text-[10px] font-medium text-red-600">
                                                {form.errors.email}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <p className="mb-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                                            Timezone
                                        </p>
                                        <div className="flex h-10.5 items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs dark:border-slate-700 dark:bg-slate-900/60">
                                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                                                East Africa Time (Nairobi)
                                            </span>
                                            <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                Fixed
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="mb-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                                            Language
                                        </p>
                                        <div className="flex h-10.5 items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs dark:border-slate-700 dark:bg-slate-900/60">
                                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                                                English
                                            </span>
                                            <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                Fixed
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                            <Card className="p-5 sm:p-6">
                                <SectionHeader
                                    title="Learning interests"
                                    description="Choose subjects that shape your learning recommendations."
                                />

                                <div className="mt-4 flex items-center justify-between gap-3">
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                        {form.data.learning_interest_ids.length}{' '}
                                        selected
                                        {selectedNames.length
                                            ? ` · ${selectedNames.join(', ')}`
                                            : ''}
                                    </p>

                                    {form.data.learning_interest_ids.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                form.setData(
                                                    'learning_interest_ids',
                                                    [],
                                                )
                                            }
                                            className="text-[10px] font-bold text-slate-500 hover:text-[#1554c0]"
                                        >
                                            Clear all
                                        </button>
                                    )}
                                </div>

                                <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                                    {learningInterests.map((interest) => {
                                        const selected =
                                            form.data.learning_interest_ids.includes(
                                                interest.id,
                                            )

                                        return (
                                            <button
                                                key={interest.id}
                                                type="button"
                                                onClick={() =>
                                                    toggleInterest(interest.id)
                                                }
                                                className={[
                                                    'rounded-xl border px-3 py-2.5 text-left transition',
                                                    selected
                                                        ? 'border-[#1554c0] bg-[#1554c0]/[0.06] ring-2 ring-[#1554c0]/10 dark:border-[#6ba3ff] dark:bg-[#4c8dff]/10'
                                                        : 'border-slate-200 bg-white hover:border-[#1554c0]/40 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40',
                                                ].join(' ')}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="truncate text-[11px] font-semibold text-slate-800 dark:text-slate-100">
                                                        {interest.name}
                                                    </span>
                                                    <span
                                                        className={[
                                                            'flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold',
                                                            selected
                                                                ? 'border-[#1554c0] bg-[#1554c0] text-white'
                                                                : 'border-slate-300 text-transparent dark:border-slate-600',
                                                        ].join(' ')}
                                                    >
                                                        ✓
                                                    </span>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </Card>

                            <Card className="p-5 sm:p-6">
                                <SectionHeader
                                    title="Connected accounts"
                                    description="External accounts connected to your Learn With Flevian identity."
                                />

                                <div className="mt-4 space-y-2.5">
                                    {(
                                        [
                                            ['google', 'Google', linkedAccounts.google],
                                            ['github', 'GitHub', linkedAccounts.github],
                                        ] as const
                                    ).map(([provider, label, linked]) => (
                                        <div
                                            key={provider}
                                            className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/60"
                                        >
                                            <ProviderMark provider={provider} />

                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                                    {label}
                                                </p>
                                                <p className="mt-0.5 text-[10px] text-slate-400">
                                                    {linked
                                                        ? `Account linked with ${label}`
                                                        : `No ${label} account linked`}
                                                </p>
                                            </div>

                                            <StatusPill linked={linked} />
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 rounded-xl border border-[#dbe5f3] bg-[#f7faff] px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/70">
                                    <p className="text-[10px] leading-4 text-slate-500 dark:text-slate-400">
                                        Linked accounts are managed by your authentication
                                        provider and are shown here for account visibility.
                                    </p>
                                </div>
                            </Card>
                        </div>

                        <Card className="p-5 sm:p-6">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs font-bold text-slate-800 dark:text-white">
                                        Account information
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                            {profile.role ?? 'Student'}
                                        </span>
                                        <span className="rounded-full bg-[#1554c0]/[0.07] px-2.5 py-1 text-[9px] font-semibold text-[#1554c0] dark:bg-[#4c8dff]/10 dark:text-[#6ba3ff]">
                                            {stats.courses.active} active course
                                            {stats.courses.active === 1 ? '' : 's'}
                                        </span>
                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                            {stats.progress.percentage}% progress
                                        </span>
                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                            Joined {formatDate(profile.onboarding_completed_at)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2.5">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        disabled={form.processing}
                                        className="h-9 rounded-xl border border-slate-200 px-3.5 text-[10px] font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                        Reset
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className="h-9 rounded-xl bg-[#1554c0] px-4 text-[10px] font-bold text-white shadow-sm transition hover:bg-[#1048a8] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {form.processing ? 'Saving...' : 'Save changes'}
                                    </button>
                                </div>
                            </div>
                        </Card>
                    </form>
                </div>
            </StudentLayout>
        </>
    )
}
