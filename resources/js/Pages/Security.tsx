import { Head, router, usePage } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import type { PageProps } from '../Components/student-types'
import StudentLayout from '../Components/StudentLayout'
import { Card, Icon, SectionHeader } from '../Components/StudentUI'
import { usePasskeyRegister } from '@laravel/passkeys/react'

interface PasskeyItem {
    id: number
    name: string
    authenticator: string | null
    last_used_at: string | null
    created_at: string | null
}

interface TwoFactorState {
    enabled: boolean
    configured?: boolean
    enabledAt?: string | null
    confirmedAt?: string | null
}

interface SecuritySession {
    id: string
    is_current?: boolean
    ip_address?: string | null
    user_agent?: string | null
    device_type?: string | null
    device_name?: string | null
    browser?: string | null
    browser_version?: string | null
    platform?: string | null
    platform_version?: string | null
    last_activity?: number | null
    last_activity_at?: string | null
}

interface SecurityPageProps extends Record<string, unknown> {
    user: {
        id: number
        name: string
        email: string
        avatar_path?: string | null
        role?: string | null
        timezone?: string | null
        locale?: string | null
    }

    /*
     * Security now receives the same identity contract used by
     * Dashboard, Profile and the other StudentLayout pages.
     */
    student: PageProps['student']

    stats: PageProps['stats']

    twoFactor: TwoFactorState
    passkeys: PasskeyItem[]
    sessions?: SecuritySession[]
    sessionCount?: number
}

function csrfToken(): string {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? ''
    )
}

interface NavigatorUserAgentDataLike {
    platform?: string
    mobile?: boolean
    getHighEntropyValues?: (
        hints: string[],
    ) => Promise<{
        model?: string
        platform?: string
        platformVersion?: string
    }>
}

function detectBrowserName(userAgent: string): string {
    if (/Edg\//i.test(userAgent)) return 'Edge'
    if (/OPR\//i.test(userAgent)) return 'Opera'
    if (/Firefox\//i.test(userAgent)) return 'Firefox'
    if (/Chrome\//i.test(userAgent)) return 'Chrome'
    if (/Safari\//i.test(userAgent) && /Version\//i.test(userAgent)) {
        return 'Safari'
    }

    return 'Browser'
}

function detectPlatformName(userAgent: string): string {
    if (/iPhone/i.test(userAgent)) return 'iPhone'
    if (/iPad/i.test(userAgent)) return 'iPad'

    if (/Android/i.test(userAgent)) {
        return /Mobile/i.test(userAgent)
            ? 'Android phone'
            : 'Android tablet'
    }

    if (/Windows/i.test(userAgent)) return 'Windows PC'
    if (/Macintosh|Mac OS X/i.test(userAgent)) return 'Mac'
    if (/Linux/i.test(userAgent)) return 'Linux PC'

    return 'This device'
}

async function detectPasskeyName(): Promise<string> {
    const userAgent = navigator.userAgent ?? ''
    const browser = detectBrowserName(userAgent)
    const platform = detectPlatformName(userAgent)

    const userAgentData = (
        navigator as Navigator & {
            userAgentData?: NavigatorUserAgentDataLike
        }
    ).userAgentData

    if (userAgentData?.getHighEntropyValues) {
        try {
            const details = await userAgentData.getHighEntropyValues([
                'model',
                'platform',
                'platformVersion',
            ])

            const model = details.model?.trim()

            if (model) {
                return `${model} · ${browser}`
            }
        } catch {
            // Use the privacy-safe platform fallback.
        }
    }

    return `${platform} · ${browser}`
}

async function readResponseError(
    response: Response,
    fallback: string,
): Promise<Error> {
    try {
        const data: unknown = await response.json()

        if (
            typeof data === 'object' &&
            data !== null &&
            'message' in data &&
            typeof data.message === 'string'
        ) {
            return new Error(data.message)
        }

        if (
            typeof data === 'object' &&
            data !== null &&
            'errors' in data
        ) {
            const errors = data.errors

            if (typeof errors === 'object' && errors !== null) {
                const first = Object.values(
                    errors as Record<string, unknown>,
                ).flat()[0]

                if (typeof first === 'string') {
                    return new Error(first)
                }
            }
        }
    } catch {
        // Non-JSON response. Use the supplied fallback.
    }

    return new Error(fallback)
}

function formatDate(value: string | null | undefined): string {
    if (!value) return 'Never'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return 'Unknown'
    }

    return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date)
}

function relativeTime(value: string | null | undefined): string {
    if (!value) return 'Unknown'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return 'Unknown'
    }

    const difference = Date.now() - date.getTime()

    if (difference < 60_000) {
        return 'Just now'
    }

    const minutes = Math.floor(difference / 60_000)

    if (minutes < 60) {
        return `${minutes}m ago`
    }

    const hours = Math.floor(minutes / 60)

    if (hours < 24) {
        return `${hours}h ago`
    }

    const days = Math.floor(hours / 24)

    if (days < 30) {
        return `${days}d ago`
    }

    return formatDate(value)
}

function sessionActivity(
    session: SecuritySession,
): string | null {
    if (session.last_activity_at) {
        return session.last_activity_at
    }

    if (typeof session.last_activity === 'number') {
        return new Date(
            session.last_activity * 1000,
        ).toISOString()
    }

    return null
}

function FingerprintIcon({
    className = 'h-5 w-5',
}: {
    className?: string
}) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <path d="M12 11a2 2 0 0 1 2 2c0 4-1 6-2 8" />
            <path d="M8 13a4 4 0 0 1 8 0c0 4-.7 6.5-2 8" />
            <path d="M6 13a6 6 0 0 1 12 0c0 2-.2 3.8-.7 5.3" />
            <path d="M4.5 13a7.5 7.5 0 0 1 15 0" />
            <path d="M10 21c.8-2.1 1.2-4.2 1.2-6.5" />
        </svg>
    )
}

function LockIcon({
    className = 'h-5 w-5',
}: {
    className?: string
}) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <rect
                x="4"
                y="10"
                width="16"
                height="11"
                rx="2"
            />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            <path d="M12 14v3" />
        </svg>
    )
}

function ComputerIcon({
    className = 'h-5 w-5',
}: {
    className?: string
}) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <rect
                x="3"
                y="4"
                width="18"
                height="13"
                rx="2"
            />
            <path d="M8 21h8M12 17v4" />
        </svg>
    )
}

function MobileIcon({
    className = 'h-5 w-5',
}: {
    className?: string
}) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <rect
                x="7"
                y="2.5"
                width="10"
                height="19"
                rx="2"
            />
            <path d="M10 18.5h4" />
        </svg>
    )
}

function DeviceIcon({
    session,
}: {
    session: SecuritySession
}) {
    const value = `${session.device_type ?? ''} ${
        session.device_name ?? ''
    } ${session.user_agent ?? ''}`.toLowerCase()

    return value.includes('mobile') ||
        value.includes('phone') ||
        value.includes('android') ||
        value.includes('iphone') ? (
        <MobileIcon />
    ) : (
        <ComputerIcon />
    )
}

function deviceLabel(
    session: SecuritySession,
): string {
    if (session.device_name) {
        return session.device_name
    }

    const type = (
        session.device_type ?? ''
    ).toLowerCase()

    if (
        type.includes('mobile') ||
        type.includes('phone')
    ) {
        return 'Mobile device'
    }

    if (type.includes('tablet')) {
        return 'Tablet'
    }

    return 'Computer'
}

function browserLabel(
    session: SecuritySession,
): string {
    if (!session.browser) {
        return 'Browser not detected'
    }

    return session.browser_version
        ? `${session.browser} ${session.browser_version}`
        : session.browser
}

function platformLabel(
    session: SecuritySession,
): string {
    if (!session.platform) {
        return 'Operating system not detected'
    }

    return session.platform_version
        ? `${session.platform} ${session.platform_version}`
        : session.platform
}

function StatusBadge({
    enabled,
}: {
    enabled: boolean
}) {
    return (
        <span
            className={[
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
                'text-[9px] font-bold uppercase tracking-[0.1em]',
                enabled
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
            ].join(' ')}
        >
            <span
                className={[
                    'h-1.5 w-1.5 rounded-full',
                    enabled
                        ? 'bg-emerald-500'
                        : 'bg-slate-400',
                ].join(' ')}
            />

            {enabled ? 'Enabled' : 'Disabled'}
        </span>
    )
}

export default function Security() {
    const {
        user,
        student: suppliedStudent,
        stats: suppliedStats,
        twoFactor,
        passkeys: initialPasskeys,
        sessions = [],
        sessionCount,
    } = usePage<SecurityPageProps>().props

    /*
     * IMPORTANT:
     *
     * StudentLayout uses the student object for the shared identity
     * displayed throughout Dashboard, Profile, Support and Security.
     *
     * The previous implementation could construct an incomplete
     * fallback object and therefore lose the avatar.
     *
     * Keep the server-supplied student object authoritative.
     * Only fall back to user data if absolutely necessary.
     */
    const student: PageProps['student'] =
        suppliedStudent ??
        ({
            id: user.id,
            name: user.name,
            email: user.email,
            avatar_path: user.avatar_path ?? null,
            timezone:
                user.timezone ?? 'Africa/Nairobi',
            locale: user.locale ?? 'en',
        } as PageProps['student'])

    /*
     * Security only needs the small stats contract required by
     * StudentLayout. If the controller supplies the real stats,
     * use them. Otherwise use safe defaults.
     */
    const stats: PageProps['stats'] =
        suppliedStats ??
        ({
            courses: {
                total: 0,
                active: 0,
                completed: 0,
            },
            progress: {
                percentage: 0,
                completed_lessons: 0,
                tracked_lessons: 0,
            },
            points: {
                total: 0,
            },
            streak: {
                current: 0,
                longest: 0,
                last_activity_on: null,
            },
        } as PageProps['stats'])

    const {
        register: registerPasskey,
        isLoading: passkeyRegistering,
        error: passkeyRegisterError,
        isSupported: passkeysSupported,
    } = usePasskeyRegister({
        onSuccess: () => {
            window.location.reload()
        },
    })

    const [
        twoFactorEnabled,
        setTwoFactorEnabled,
    ] = useState(twoFactor.enabled)

    const [
        twoFactorConfigured,
        setTwoFactorConfigured,
    ] = useState(
        twoFactor.configured ??
            twoFactor.enabled,
    )

    const [
        twoFactorProcessing,
        setTwoFactorProcessing,
    ] = useState(false)

    const [
        twoFactorError,
        setTwoFactorError,
    ] = useState<string | null>(null)

    const [
        localPasskeys,
        setLocalPasskeys,
    ] = useState<PasskeyItem[]>(
        initialPasskeys,
    )

    const [
        passkeyDeleteProcessing,
        setPasskeyDeleteProcessing,
    ] = useState<number | null>(null)

    const [
        passkeyError,
        setPasskeyError,
    ] = useState<string | null>(null)

    const [
        sessionsLocal,
        setSessionsLocal,
    ] = useState<SecuritySession[]>(
        sessions,
    )

    const [
        sessionError,
        setSessionError,
    ] = useState<string | null>(null)

    const [
        sessionSuccess,
        setSessionSuccess,
    ] = useState<string | null>(null)

    const [
        confirmation,
        setConfirmation,
    ] = useState<
        | {
              type:
                  | 'disable-2fa'
                  | 'remove-passkey'
                  | 'revoke-session'
                  | 'revoke-other-sessions'
              passkeyId?: number
              passkeyName?: string
              sessionId?: string
              sessionName?: string
          }
        | null
    >(null)

    useEffect(() => {
        setTwoFactorEnabled(twoFactor.enabled)

        setTwoFactorConfigured(
            twoFactor.configured ??
                twoFactor.enabled,
        )
    }, [
        twoFactor.enabled,
        twoFactor.configured,
    ])

    useEffect(() => {
        setLocalPasskeys(initialPasskeys)
    }, [initialPasskeys])

    useEffect(() => {
        setSessionsLocal(sessions)
    }, [sessions])

    useEffect(() => {
        const handleEscape = (
            event: KeyboardEvent,
        ) => {
            if (event.key === 'Escape') {
                setConfirmation(null)
            }
        }

        document.addEventListener(
            'keydown',
            handleEscape,
        )

        return () => {
            document.removeEventListener(
                'keydown',
                handleEscape,
            )
        }
    }, [])

    /*
     * Enable 2FA.
     */
    const enableTwoFactor = async () => {
        setTwoFactorProcessing(true)
        setTwoFactorError(null)

        try {
            const response = await fetch(
                '/user/two-factor-authentication',
                {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: {
                        Accept:
                            'application/json',
                        'X-Requested-With':
                            'XMLHttpRequest',
                        'X-CSRF-TOKEN':
                            csrfToken(),
                    },
                },
            )

            if (!response.ok) {
                throw await readResponseError(
                    response,
                    'Unable to enable two-factor authentication.',
                )
            }

            setTwoFactorEnabled(true)
            setTwoFactorConfigured(true)
        } catch (error) {
            setTwoFactorError(
                error instanceof Error
                    ? error.message
                    : 'Unable to enable two-factor authentication.',
            )
        } finally {
            setTwoFactorProcessing(false)
        }
    }

    /*
     * The original file referenced handleTwoFactorSubmit
     * but did not define it. Keep the form handler explicit.
     */
    const handleTwoFactorSubmit = (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault()
        void enableTwoFactor()
    }

    /*
     * Disable 2FA.
     */
    const disableTwoFactor = async () => {
        setConfirmation(null)
        setTwoFactorProcessing(true)
        setTwoFactorError(null)

        try {
            const response = await fetch(
                '/user/two-factor-authentication',
                {
                    method: 'DELETE',
                    credentials: 'same-origin',
                    headers: {
                        Accept:
                            'application/json',
                        'X-Requested-With':
                            'XMLHttpRequest',
                        'X-CSRF-TOKEN':
                            csrfToken(),
                    },
                },
            )

            if (!response.ok) {
                throw await readResponseError(
                    response,
                    'Unable to disable two-factor authentication.',
                )
            }

            setTwoFactorEnabled(false)
            setTwoFactorConfigured(false)
        } catch (error) {
            setTwoFactorError(
                error instanceof Error
                    ? error.message
                    : 'Unable to disable two-factor authentication.',
            )
        } finally {
            setTwoFactorProcessing(false)
        }
    }

    /*
     * Passkey registration.
     */
    const startPasskeyRegistration =
        async () => {
            setPasskeyError(null)

            if (!passkeysSupported) {
                setPasskeyError(
                    'Passkeys are not supported by this browser or device.',
                )
                return
            }

            try {
                const deviceName =
                    await detectPasskeyName()

                await registerPasskey(
                    deviceName,
                )
            } catch (error) {
                setPasskeyError(
                    error instanceof Error
                        ? error.message
                        : 'Unable to register this passkey.',
                )
            }
        }

    /*
     * Remove passkey.
     */
    const removePasskey = async (
        id: number,
    ) => {
        setConfirmation(null)
        setPasskeyDeleteProcessing(id)
        setPasskeyError(null)

        try {
            const response = await fetch(
                `/user/passkeys/${encodeURIComponent(
                    String(id),
                )}`,
                {
                    method: 'DELETE',
                    credentials: 'same-origin',
                    headers: {
                        Accept:
                            'application/json',
                        'X-Requested-With':
                            'XMLHttpRequest',
                        'X-CSRF-TOKEN':
                            csrfToken(),
                    },
                },
            )

            if (!response.ok) {
                throw await readResponseError(
                    response,
                    'Unable to remove this passkey.',
                )
            }

            setLocalPasskeys(
                current =>
                    current.filter(
                        passkey =>
                            passkey.id !== id,
                    ),
            )
        } catch (error) {
            setPasskeyError(
                error instanceof Error
                    ? error.message
                    : 'Unable to remove this passkey.',
            )
        } finally {
            setPasskeyDeleteProcessing(null)
        }
    }

    /*
     * Revoke one session.
     *
     * The backend returns an Inertia redirect,
     * therefore router.delete() is intentionally used.
     */
    const revokeSession = (
        sessionId: string,
    ) => {
        setSessionError(null)
        setSessionSuccess(null)

        router.delete(
            `/security/sessions/${encodeURIComponent(
                sessionId,
            )}`,
            {
                preserveScroll: true,

                onSuccess: page => {
                    setConfirmation(null)

                    const flash = (
                        page.props as Record<
                            string,
                            unknown
                        >
                    ).flash as
                        | {
                              success?: string
                              error?: string
                          }
                        | undefined

                    if (flash?.error) {
                        setSessionError(
                            flash.error,
                        )
                        return
                    }

                    setSessionSuccess(
                        flash?.success ??
                            'The selected device has been signed out.',
                    )
                },

                onError: () => {
                    setSessionError(
                        'Unable to revoke this session.',
                    )
                },
            },
        )
    }

    /*
     * Revoke every session except current.
     */
    const revokeOtherSessions = () => {
        setSessionError(null)
        setSessionSuccess(null)

        router.post(
            '/security/sessions/revoke-others',
            {},
            {
                preserveScroll: true,

                onSuccess: page => {
                    setConfirmation(null)

                    const flash = (
                        page.props as Record<
                            string,
                            unknown
                        >
                    ).flash as
                        | {
                              success?: string
                              error?: string
                          }
                        | undefined

                    if (flash?.error) {
                        setSessionError(
                            flash.error,
                        )
                        return
                    }

                    setSessionSuccess(
                        flash?.success ??
                            'All other devices have been signed out.',
                    )
                },

                onError: () => {
                    setSessionError(
                        'Unable to sign out the other sessions.',
                    )
                },
            },
        )
    }

    const otherSessions =
        sessionsLocal.filter(
            session =>
                !session.is_current,
        )

    return (
        <>
            <Head title="Security" />

            <StudentLayout
                student={student}
                stats={stats}
                title="Security"
            >
                <div className="space-y-6">
                    <section>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1554c0] dark:text-[#6ba3ff]">
                            Account
                        </p>

                        <div className="mt-1 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                            <div>
                                <h1 className="text-3xl font-bold tracking-[-0.04em] text-slate-950 dark:text-white">
                                    Security
                                </h1>

                                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                                    Manage sign-in
                                    protection,
                                    passkeys, and the
                                    devices currently
                                    using your account.
                                </p>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Icon
                                    name="shield"
                                    className="h-4 w-4"
                                />

                                <span>
                                    {user.email}
                                </span>
                            </div>
                        </div>
                    </section>

                    <section className="grid gap-4 sm:grid-cols-3">
                        <Card className="relative overflow-hidden p-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1554c0]/[0.07] text-[#1554c0] dark:bg-[#4c8dff]/10 dark:text-[#6ba3ff]">
                                    <Icon
                                        name="shield"
                                        className="h-5 w-5"
                                    />
                                </div>

                                <div>
                                    <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
                                        Two-factor
                                    </p>

                                    <p className="mt-1 text-sm font-bold text-slate-800 dark:text-white">
                                        {twoFactorEnabled
                                            ? 'Protected'
                                            : 'Not enabled'}
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <Card className="relative overflow-hidden p-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1554c0]/[0.07] text-[#1554c0] dark:bg-[#4c8dff]/10 dark:text-[#6ba3ff]">
                                    <FingerprintIcon />
                                </div>

                                <div>
                                    <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
                                        Passkeys
                                    </p>

                                    <p className="mt-1 text-sm font-bold text-slate-800 dark:text-white">
                                        {
                                            localPasskeys.length
                                        }{' '}
                                        registered
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <Card className="relative overflow-hidden p-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1554c0]/[0.07] text-[#1554c0] dark:bg-[#4c8dff]/10 dark:text-[#6ba3ff]">
                                    <Icon
                                        name="clock"
                                        className="h-5 w-5"
                                    />
                                </div>

                                <div>
                                    <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
                                        Active sessions
                                    </p>

                                    <p className="mt-1 text-sm font-bold text-slate-800 dark:text-white">
                                        {sessionCount ??
                                            sessionsLocal.length}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </section>

                    <Card className="p-5 sm:p-6">
                        <SectionHeader
                            title="Two-factor authentication"
                            description="Add another verification step to protect your account."
                            action={
                                <StatusBadge
                                    enabled={
                                        twoFactorEnabled
                                    }
                                />
                            }
                        />

                        {twoFactorError && (
                            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
                                {twoFactorError}
                            </div>
                        )}

                        <div className="mt-5 rounded-2xl bg-slate-50/80 p-5 dark:bg-slate-900/60">
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#1554c0] shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-[#6ba3ff] dark:ring-slate-700">
                                        <LockIcon className="h-4 w-4" />
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                                            {twoFactorEnabled
                                                ? 'Your account has an additional verification layer.'
                                                : 'Protect your account with two-factor authentication.'}
                                        </p>

                                        <p className="mt-1.5 max-w-xl text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                                            {twoFactorEnabled
                                                ? 'Two-factor authentication is active for your account.'
                                                : 'Enable two-factor authentication before relying on it as a sign-in protection method.'}
                                        </p>
                                    </div>
                                </div>

                                {twoFactorEnabled ? (
                                    <button
                                        type="button"
                                        disabled={
                                            twoFactorProcessing
                                        }
                                        onClick={() =>
                                            setConfirmation(
                                                {
                                                    type: 'disable-2fa',
                                                },
                                            )
                                        }
                                        className="h-9 shrink-0 rounded-xl border border-red-200 px-4 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/20"
                                    >
                                        {twoFactorProcessing
                                            ? 'Processing...'
                                            : 'Disable 2FA'}
                                    </button>
                                ) : (
                                    <form
                                        onSubmit={
                                            handleTwoFactorSubmit
                                        }
                                    >
                                        <button
                                            type="submit"
                                            disabled={
                                                twoFactorProcessing
                                            }
                                            className="h-9 rounded-xl bg-[#1554c0] px-4 text-xs font-semibold text-white transition hover:bg-[#1048a8] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#4c8dff] dark:text-[#07101f] dark:hover:bg-[#6ba3ff]"
                                        >
                                            {twoFactorProcessing
                                                ? 'Enabling...'
                                                : 'Enable 2FA'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>

                        {twoFactorConfigured &&
                            !twoFactorEnabled && (
                                <p className="mt-4 text-[10px] text-slate-400">
                                    Two-factor configuration
                                    exists but is not
                                    currently enabled.
                                </p>
                            )}
                    </Card>

                    <Card className="p-5 sm:p-6">
                        <SectionHeader
                            title="Passkeys"
                            description="Use a fingerprint, face recognition, PIN or another device authenticator."
                            action={
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1554c0]/[0.07] text-[#1554c0] dark:bg-[#4c8dff]/10 dark:text-[#6ba3ff]">
                                    <FingerprintIcon className="h-4 w-4" />
                                </div>
                            }
                        />

                        {(passkeyError || passkeyRegisterError) && (
                            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
                                {passkeyError ?? passkeyRegisterError}
                            </div>
                        )}

                        <div className="mt-5 rounded-2xl border border-[#dbe5f3] bg-gradient-to-r from-[#f2f6ff] to-[#f7f4ff] p-5 dark:border-slate-800 dark:from-[#121e33] dark:to-[#18152f]">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                                        Add a passkey
                                    </p>

                                    <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                                        This device is
                                        identified
                                        automatically. You
                                        will not be asked to
                                        enter a passkey name.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    disabled={
                                        passkeyRegistering ||
                                        !passkeysSupported
                                    }
                                    onClick={() =>
                                        void startPasskeyRegistration()
                                    }
                                    className="h-9 shrink-0 rounded-xl bg-[#1554c0] px-4 text-xs font-semibold text-white transition hover:bg-[#1048a8] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#4c8dff] dark:text-[#07101f] dark:hover:bg-[#6ba3ff]"
                                >
                                    {passkeyRegistering
                                        ? 'Registering...'
                                        : 'Add passkey'}
                                </button>
                            </div>

                            {!passkeysSupported && (
                                <p className="mt-3 text-[10px] leading-5 text-amber-600 dark:text-amber-400">
                                    Passkeys are not
                                    supported by this
                                    browser or device.
                                </p>
                            )}
                        </div>

                        {localPasskeys.length > 0 ? (
                            <div className="mt-5 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 dark:divide-slate-800 dark:border-slate-800">
                                {localPasskeys.map(
                                    passkey => (
                                        <div
                                            key={
                                                passkey.id
                                            }
                                            className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1554c0]/[0.07] text-[#1554c0] dark:bg-[#4c8dff]/10 dark:text-[#6ba3ff]">
                                                    <FingerprintIcon className="h-4 w-4" />
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                                                        {
                                                            passkey.name
                                                        }
                                                    </p>

                                                    <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                                                        {passkey.authenticator ??
                                                            'Authenticator'}{' '}
                                                        · Added{' '}
                                                        {formatDate(
                                                            passkey.created_at,
                                                        )}{' '}
                                                        · Last used{' '}
                                                        {formatDate(
                                                            passkey.last_used_at,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                disabled={
                                                    passkeyDeleteProcessing !==
                                                    null
                                                }
                                                onClick={() =>
                                                    setConfirmation(
                                                        {
                                                            type: 'remove-passkey',
                                                            passkeyId:
                                                                passkey.id,
                                                            passkeyName:
                                                                passkey.name,
                                                        },
                                                    )
                                                }
                                                className="h-8 shrink-0 rounded-lg border border-red-200 px-3 text-[10px] font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/20"
                                            >
                                                {passkeyDeleteProcessing ===
                                                passkey.id
                                                    ? 'Removing...'
                                                    : 'Remove'}
                                            </button>
                                        </div>
                                    ),
                                )}
                            </div>
                        ) : (
                            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-5 py-8 text-center dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:ring-slate-700">
                                    <FingerprintIcon />
                                </div>

                                <p className="mt-3 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                    No passkeys registered
                                </p>

                                <p className="mx-auto mt-1 max-w-sm text-[10px] leading-5 text-slate-400">
                                    Add a passkey to make
                                    signing in faster and
                                    more secure.
                                </p>
                            </div>
                        )}
                    </Card>

                    <Card className="p-5 sm:p-6">
                        <SectionHeader
                            title="Active sessions"
                            description="Review the devices and sessions associated with your account."
                            action={
                                otherSessions.length >
                                0 ? (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setConfirmation(
                                                {
                                                    type: 'revoke-other-sessions',
                                                },
                                            )
                                        }
                                        className="hidden h-9 rounded-xl border border-slate-200 px-3 text-[10px] font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 sm:inline-flex sm:items-center dark:border-slate-700 dark:text-slate-300"
                                    >
                                        Sign out others
                                    </button>
                                ) : null
                            }
                        />

                        {sessionError && (
                            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
                                {sessionError}
                            </div>
                        )}

                        {sessionSuccess && (
                            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
                                {sessionSuccess}
                            </div>
                        )}

                        {sessionsLocal.length > 0 ? (
                            <div className="mt-5 space-y-3">
                                {sessionsLocal.map(
                                    session => {
                                        const current =
                                            Boolean(
                                                session.is_current,
                                            )

                                        const activity =
                                            sessionActivity(
                                                session,
                                            )

                                        return (
                                            <div
                                                key={
                                                    session.id
                                                }
                                                className={[
                                                    'rounded-2xl border p-4',
                                                    current
                                                        ? 'border-[#bfd0ee] bg-[#f5f8ff] dark:border-[#29466f] dark:bg-[#101c30]'
                                                        : 'border-slate-100 dark:border-slate-800',
                                                ].join(
                                                    ' ',
                                                )}
                                            >
                                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                                    <div className="flex min-w-0 flex-1 items-start gap-3">
                                                        <div
                                                            className={[
                                                                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                                                                current
                                                                    ? 'bg-[#1554c0]/10 text-[#1554c0] dark:bg-[#4c8dff]/10 dark:text-[#6ba3ff]'
                                                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                                                            ].join(
                                                                ' ',
                                                            )}
                                                        >
                                                            <DeviceIcon
                                                                session={
                                                                    session
                                                                }
                                                            />
                                                        </div>

                                                        <div className="min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                                                    {deviceLabel(
                                                                        session,
                                                                    )}
                                                                </p>

                                                                {current && (
                                                                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                                                                        Current
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                                                                {browserLabel(
                                                                    session,
                                                                )}{' '}
                                                                ·{' '}
                                                                {platformLabel(
                                                                    session,
                                                                )}
                                                            </p>

                                                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400">
                                                                <span>
                                                                    IP:{' '}
                                                                    {session.ip_address ??
                                                                        'Unavailable'}
                                                                </span>

                                                                <span>
                                                                    {activity
                                                                        ? relativeTime(
                                                                              activity,
                                                                          )
                                                                        : 'Activity unavailable'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {!current && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setConfirmation(
                                                                    {
                                                                        type: 'revoke-session',
                                                                        sessionId:
                                                                            session.id,
                                                                        sessionName:
                                                                            deviceLabel(
                                                                                session,
                                                                            ),
                                                                    },
                                                                )
                                                            }
                                                            className="h-8 shrink-0 rounded-lg border border-red-200 px-3 text-[10px] font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:text-red-300"
                                                        >
                                                            Revoke
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    },
                                )}
                            </div>
                        ) : (
                            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-5 py-9 text-center dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                                    <Icon
                                        name="clock"
                                        className="h-5 w-5"
                                    />
                                </div>

                                <p className="mt-3 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                    No session details
                                    available
                                </p>

                                <p className="mx-auto mt-1 max-w-md text-[10px] leading-5 text-slate-400">
                                    The security controller
                                    has not supplied
                                    session records.
                                </p>
                            </div>
                        )}

                        {otherSessions.length > 0 && (
                            <button
                                type="button"
                                onClick={() =>
                                    setConfirmation(
                                        {
                                            type: 'revoke-other-sessions',
                                        },
                                    )
                                }
                                className="mt-4 h-9 w-full rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 sm:hidden dark:border-slate-700 dark:text-slate-300"
                            >
                                Sign out other devices
                            </button>
                        )}

                        <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900/60">
                            <p className="text-[10px] leading-5 text-slate-400 dark:text-slate-500">
                                Session information can
                                include the device,
                                browser, operating system,
                                IP address and recent
                                activity. Location
                                information is intentionally
                                not displayed here.
                            </p>
                        </div>
                    </Card>
                </div>
            </StudentLayout>

            {confirmation && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[2px]"
                    onMouseDown={event => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            setConfirmation(null)
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        className="w-full max-w-md overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_25px_80px_rgba(15,23,42,0.22)] dark:border-slate-700 dark:bg-[#111827]"
                    >
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">
                                    <Icon
                                        name="shield"
                                        className="h-5 w-5"
                                    />
                                </div>

                                <div>
                                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                                        {confirmation.type ===
                                        'disable-2fa'
                                            ? 'Disable two-factor authentication?'
                                            : confirmation.type ===
                                                'remove-passkey'
                                              ? 'Remove passkey?'
                                              : confirmation.type ===
                                                  'revoke-other-sessions'
                                                ? 'Sign out other devices?'
                                                : 'Revoke this session?'}
                                    </h2>

                                    <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                        {confirmation.type ===
                                        'disable-2fa'
                                            ? 'Two-factor authentication will no longer protect this account.'
                                            : confirmation.type ===
                                                'remove-passkey'
                                              ? `"${confirmation.passkeyName}" will no longer be available for signing in.`
                                              : confirmation.type ===
                                                  'revoke-other-sessions'
                                                ? 'All other sessions will be invalidated while this current session remains active.'
                                                : `"${confirmation.sessionName}" will be signed out and will need to authenticate again.`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-6 py-4 sm:flex-row sm:justify-end dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() =>
                                    setConfirmation(null)
                                }
                                className="h-9 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    if (
                                        confirmation.type ===
                                        'disable-2fa'
                                    ) {
                                        void disableTwoFactor()
                                    } else if (
                                        confirmation.type ===
                                            'remove-passkey' &&
                                        confirmation.passkeyId !==
                                            undefined
                                    ) {
                                        void removePasskey(
                                            confirmation.passkeyId,
                                        )
                                    } else if (
                                        confirmation.type ===
                                            'revoke-session' &&
                                        confirmation.sessionId
                                    ) {
                                        revokeSession(
                                            confirmation.sessionId,
                                        )
                                    } else if (
                                        confirmation.type ===
                                        'revoke-other-sessions'
                                    ) {
                                        revokeOtherSessions()
                                    }
                                }}
                                className="h-9 rounded-xl bg-red-600 px-4 text-xs font-semibold text-white transition hover:bg-red-700"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}