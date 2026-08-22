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
                <div className="w-full px-4 py-4 sm:px-5 lg:px-6">
                    {/* Header */}
                    <div className="mb-4">
                        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#1554c0] dark:text-[#6ba3ff]">
                            Account protection
                        </p>
                        <h1 className="mt-0.5 text-2xl font-bold tracking-[-0.03em] text-slate-950 dark:text-white">
                            Security & sign-in protection
                        </h1>
                        <p className="mt-0.5 max-w-2xl text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                            Manage how you sign in, review trusted authentication methods,
                            and keep track of the devices currently using your account.
                        </p>
                    </div>

                    {/* Summary */}
                    <div className="grid gap-2.5 sm:grid-cols-3">
                        {[
                            [
                                'shield',
                                'Two-factor authentication',
                                twoFactorEnabled ? 'Protected' : 'Not enabled',
                                twoFactorEnabled ? 'Additional sign-in verification active' : 'Add another layer of protection',
                            ],
                            [
                                'fingerprint',
                                'Passkeys',
                                localPasskeys.length,
                                localPasskeys.length === 1 ? 'Registered authenticator' : 'Registered authenticators',
                            ],
                            [
                                'clock',
                                'Active sessions',
                                sessionCount ?? sessionsLocal.length,
                                otherSessions.length > 0 ? `${otherSessions.length} other device${otherSessions.length === 1 ? '' : 's'}` : 'Current device only',
                            ],
                        ].map(([icon, label, value, detail]) => (
                            <Card key={String(label)} className="p-3.5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#8bb8ff]">
                                        {icon === 'fingerprint' ? (
                                            <FingerprintIcon className="h-4 w-4" />
                                        ) : (
                                            <Icon name={icon as any} className="h-4 w-4" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-slate-400">
                                            {label}
                                        </p>
                                        <p className="mt-0.5 truncate text-lg font-bold text-slate-900 dark:text-white">
                                            {value}
                                        </p>
                                        <p className="text-[8px] text-slate-400">
                                            {detail}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Main content */}
                    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_310px]">
                        <div className="min-w-0 space-y-4">
                            {/* Two-factor */}
                            <section>
                                <SectionHeader
                                    title="Two-factor authentication"
                                    description="Add another verification step to protect your account beyond your password."
                                    action={<StatusBadge enabled={twoFactorEnabled} />}
                                />

                                {twoFactorError && (
                                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[10px] leading-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
                                        {twoFactorError}
                                    </div>
                                )}

                                <Card className="mt-3 overflow-hidden p-0">
                                    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex min-w-0 items-start gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#8bb8ff]">
                                                <LockIcon className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-slate-900 dark:text-white">
                                                    {twoFactorEnabled
                                                        ? 'Your account has an additional verification layer.'
                                                        : 'Protect your account with two-factor authentication.'}
                                                </p>
                                                <p className="mt-1 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
                                                    {twoFactorEnabled
                                                        ? 'Two-factor authentication is active for your account. You can disable it if you no longer want this extra verification step.'
                                                        : 'Enable 2FA to require an additional verification step when protecting your account.'}
                                                </p>
                                            </div>
                                        </div>

                                        {twoFactorEnabled ? (
                                            <button
                                                type="button"
                                                disabled={twoFactorProcessing}
                                                onClick={() => setConfirmation({ type: 'disable-2fa' })}
                                                className="inline-flex shrink-0 items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-[9px] font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/20"
                                            >
                                                {twoFactorProcessing ? 'Processing...' : 'Disable 2FA'}
                                            </button>
                                        ) : (
                                            <form onSubmit={handleTwoFactorSubmit}>
                                                <button
                                                    type="submit"
                                                    disabled={twoFactorProcessing}
                                                    className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#1554c0] px-3.5 py-2 text-[9px] font-bold text-white shadow-sm transition hover:bg-[#1249a8] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#4c8dff] dark:text-[#07101f]"
                                                >
                                                    {twoFactorProcessing ? 'Enabling...' : 'Enable 2FA'}
                                                </button>
                                            </form>
                                        )}
                                    </div>

                                    {twoFactorConfigured && !twoFactorEnabled && (
                                        <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900/60">
                                            <p className="text-[9px] leading-4 text-slate-400 dark:text-slate-500">
                                                A two-factor configuration exists, but it is not currently enabled.
                                            </p>
                                        </div>
                                    )}
                                </Card>
                            </section>

                            {/* Passkeys */}
                            <section>
                                <SectionHeader
                                    title="Passkeys"
                                    description="Use a fingerprint, face recognition, PIN or another device authenticator for passwordless sign-in."
                                    action={
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#8bb8ff]">
                                            <FingerprintIcon className="h-4 w-4" />
                                        </div>
                                    }
                                />

                                {(passkeyError || passkeyRegisterError) && (
                                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[10px] leading-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
                                        {passkeyError ?? passkeyRegisterError}
                                    </div>
                                )}

                                <Card className="mt-3 overflow-hidden p-0">
                                    <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-[#edf4ff] to-[#f7f4ff] p-4 dark:border-slate-800 dark:from-[#121e33] dark:to-[#18152f] sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                                                Add a passkey to this device
                                            </p>
                                            <p className="mt-1 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
                                                The device is identified automatically. You will not be asked to enter a passkey name.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            disabled={passkeyRegistering || !passkeysSupported}
                                            onClick={() => void startPasskeyRegistration()}
                                            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#1554c0] px-3.5 py-2 text-[9px] font-bold text-white shadow-sm transition hover:bg-[#1249a8] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#4c8dff] dark:text-[#07101f]"
                                        >
                                            {passkeyRegistering ? 'Registering...' : 'Add passkey'}
                                        </button>
                                    </div>

                                    {!passkeysSupported && (
                                        <div className="border-b border-slate-100 bg-amber-50/60 px-4 py-2.5 dark:border-slate-800 dark:bg-amber-500/5">
                                            <p className="text-[9px] leading-4 text-amber-700 dark:text-amber-300">
                                                Passkeys are not supported by this browser or device.
                                            </p>
                                        </div>
                                    )}

                                    {localPasskeys.length > 0 ? (
                                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {localPasskeys.map(passkey => (
                                                <div key={passkey.id} className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#8bb8ff]">
                                                            <FingerprintIcon className="h-4 w-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                                                                {passkey.name}
                                                            </p>
                                                            <p className="mt-0.5 text-[9px] leading-4 text-slate-500 dark:text-slate-400">
                                                                {passkey.authenticator ?? 'Authenticator'} · Added {formatDate(passkey.created_at)} · Last used {formatDate(passkey.last_used_at)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        disabled={passkeyDeleteProcessing !== null}
                                                        onClick={() => setConfirmation({ type: 'remove-passkey', passkeyId: passkey.id, passkeyName: passkey.name })}
                                                        className="inline-flex shrink-0 items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-[9px] font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/20"
                                                    >
                                                        {passkeyDeleteProcessing === passkey.id ? 'Removing...' : 'Remove'}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="px-5 py-8 text-center">
                                            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 dark:bg-slate-900 dark:text-slate-500">
                                                <FingerprintIcon className="h-5 w-5" />
                                            </div>
                                            <p className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                                                No passkeys registered
                                            </p>
                                            <p className="mx-auto mt-1 max-w-sm text-[9px] leading-4 text-slate-400">
                                                Add a passkey to make signing in faster and more secure on a trusted device.
                                            </p>
                                        </div>
                                    )}
                                </Card>
                            </section>

                            {/* Sessions */}
                            <section>
                                <SectionHeader
                                    title="Active sessions"
                                    description="Review the devices and sessions associated with your account."
                                    action={
                                        otherSessions.length > 0 ? (
                                            <button
                                                type="button"
                                                onClick={() => setConfirmation({ type: 'revoke-other-sessions' })}
                                                className="hidden rounded-lg border border-slate-200 px-3 py-2 text-[9px] font-bold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 sm:inline-flex dark:border-slate-700 dark:text-slate-300"
                                            >
                                                Sign out others
                                            </button>
                                        ) : null
                                    }
                                />

                                {sessionError && (
                                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[10px] text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
                                        {sessionError}
                                    </div>
                                )}
                                {sessionSuccess && (
                                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[10px] text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
                                        {sessionSuccess}
                                    </div>
                                )}

                                {sessionsLocal.length > 0 ? (
                                    <div className="mt-3 space-y-2.5">
                                        {sessionsLocal.map(session => {
                                            const current = Boolean(session.is_current)
                                            const activity = sessionActivity(session)

                                            return (
                                                <Card
                                                    key={session.id}
                                                    className={[
                                                        'p-3.5',
                                                        current
                                                            ? 'border-[#bfd0ee] bg-[#f8faff] dark:border-[#29466f] dark:bg-[#101c30]'
                                                            : '',
                                                    ].join(' ')}
                                                >
                                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                                        <div className="flex min-w-0 flex-1 items-start gap-3">
                                                            <div className={[
                                                                'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                                                                current
                                                                    ? 'bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#8bb8ff]'
                                                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                                                            ].join(' ')}>
                                                                <DeviceIcon session={session} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                                                                        {deviceLabel(session)}
                                                                    </p>
                                                                    {current && (
                                                                        <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-300">
                                                                            Current
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="mt-0.5 text-[9px] text-slate-500 dark:text-slate-400">
                                                                    {browserLabel(session)} · {platformLabel(session)}
                                                                </p>
                                                                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-slate-400">
                                                                    <span>IP: {session.ip_address ?? 'Unavailable'}</span>
                                                                    <span>{activity ? relativeTime(activity) : 'Activity unavailable'}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {!current && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setConfirmation({
                                                                    type: 'revoke-session',
                                                                    sessionId: session.id,
                                                                    sessionName: deviceLabel(session),
                                                                })}
                                                                className="inline-flex shrink-0 items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-[9px] font-bold text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/20"
                                                            >
                                                                Revoke
                                                            </button>
                                                        )}
                                                    </div>
                                                </Card>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <Card className="mt-3 p-7 text-center">
                                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 dark:bg-slate-900 dark:text-slate-500">
                                            <Icon name="clock" className="h-5 w-5" />
                                        </div>
                                        <p className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                                            No session details available
                                        </p>
                                        <p className="mx-auto mt-1 max-w-md text-[9px] leading-4 text-slate-400">
                                            The security controller has not supplied session records.
                                        </p>
                                    </Card>
                                )}

                                {otherSessions.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setConfirmation({ type: 'revoke-other-sessions' })}
                                        className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-slate-200 px-3 py-2.5 text-[9px] font-bold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 sm:hidden dark:border-slate-700 dark:text-slate-300"
                                    >
                                        Sign out other devices
                                    </button>
                                )}

                                <div className="mt-3 rounded-xl bg-slate-50 px-3.5 py-2.5 dark:bg-slate-900/70">
                                    <p className="text-[9px] leading-4 text-slate-400 dark:text-slate-500">
                                        Session information can include the device, browser, operating system, IP address and recent activity. Location information is intentionally not displayed here.
                                    </p>
                                </div>
                            </section>
                        </div>

                        {/* Right */}
                        <aside className="min-w-0 space-y-3">
                            <Card className="p-4">
                                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                    Security overview
                                </p>
                                <h2 className="mt-0.5 text-base font-bold tracking-[-0.02em] text-slate-900 dark:text-white">
                                    Keep your account protected
                                </h2>
                                <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
                                    Strong authentication methods and regular session reviews reduce the chance of unauthorized account access.
                                </p>

                                <div className="mt-3 rounded-xl bg-gradient-to-r from-[#edf4ff] to-[#f7f4ff] p-3 dark:from-[#121e33] dark:to-[#18152f]">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 text-[#1554c0] dark:bg-slate-900/60 dark:text-[#8bb8ff]">
                                            <Icon name="shield" className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                                                {twoFactorEnabled ? 'Extra verification active' : 'Extra verification not active'}
                                            </p>
                                            <p className="text-[9px] text-slate-400">
                                                {twoFactorEnabled ? 'Your account has an additional sign-in layer.' : 'Enable 2FA from the section on the left.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-4">
                                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                    Authentication methods
                                </p>
                                <div className="mt-3 space-y-1.5">
                                    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/70">
                                        <span className="text-[9px] text-slate-500 dark:text-slate-400">Two-factor</span>
                                        <span className={twoFactorEnabled ? 'text-[9px] font-bold text-emerald-600 dark:text-emerald-400' : 'text-[9px] font-bold text-slate-400'}>
                                            {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/70">
                                        <span className="text-[9px] text-slate-500 dark:text-slate-400">Passkeys</span>
                                        <span className="text-[9px] font-bold text-slate-900 dark:text-white">
                                            {localPasskeys.length} registered
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/70">
                                        <span className="text-[9px] text-slate-500 dark:text-slate-400">Other sessions</span>
                                        <span className="text-[9px] font-bold text-slate-900 dark:text-white">
                                            {otherSessions.length}
                                        </span>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-4">
                                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                    Security checklist
                                </p>
                                <div className="mt-3 space-y-2.5">
                                    {[
                                        [twoFactorEnabled, 'Enable two-factor authentication', 'Adds another verification step to account sign-in.'],
                                        [localPasskeys.length > 0, 'Register a passkey', 'Use your device authenticator for faster sign-in.'],
                                        [otherSessions.length === 0, 'Review other sessions', 'Sign out devices you no longer recognize or use.'],
                                    ].map(([complete, title, description]) => (
                                        <div key={String(title)} className="flex gap-2.5">
                                            <div className={[
                                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                                                complete
                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                    : 'bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#8bb8ff]',
                                            ].join(' ')}>
                                                <Icon name={complete ? 'check' : 'shield'} className="h-3.5 w-3.5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200">
                                                    {title}
                                                </p>
                                                <p className="mt-0.5 text-[9px] leading-4 text-slate-400">
                                                    {description}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            <div className="rounded-2xl border border-[#dfe7f3] bg-gradient-to-br from-[#f8fbff] via-white to-[#f6f4ff] p-4 dark:border-[#273753] dark:from-[#101827] dark:via-[#111b2d] dark:to-[#17152d]">
                                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#1554c0] dark:text-[#8bb8ff]">
                                    Need help?
                                </p>
                                <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                                    Ask TechGhost AI
                                </p>
                                <p className="mt-1 text-[9px] leading-4 text-slate-500 dark:text-slate-400">
                                    Get guidance about your learning account and portal features from the AI assistant.
                                </p>
                            </div>
                        </aside>
                    </div>
                </div>
            </StudentLayout>

            {confirmation && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[2px]"
                    onMouseDown={event => {
                        if (event.target === event.currentTarget) {
                            setConfirmation(null)
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        className="w-full max-w-md overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_25px_80px_rgba(15,23,42,0.22)] dark:border-slate-700 dark:bg-[#111827]"
                    >
                        <div className="p-5">
                            <div className="flex items-start gap-3.5">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">
                                    <Icon name="shield" className="h-4 w-4" />
                                </div>
                                <div>
                                    <h2 className="text-xs font-bold text-slate-900 dark:text-white">
                                        {confirmation.type === 'disable-2fa'
                                            ? 'Disable two-factor authentication?'
                                            : confirmation.type === 'remove-passkey'
                                              ? 'Remove passkey?'
                                              : confirmation.type === 'revoke-other-sessions'
                                                ? 'Sign out other devices?'
                                                : 'Revoke this session?'}
                                    </h2>
                                    <p className="mt-1.5 text-[10px] leading-5 text-slate-500 dark:text-slate-400">
                                        {confirmation.type === 'disable-2fa'
                                            ? 'Two-factor authentication will no longer protect this account.'
                                            : confirmation.type === 'remove-passkey'
                                              ? `"${confirmation.passkeyName}" will no longer be available for signing in.`
                                              : confirmation.type === 'revoke-other-sessions'
                                                ? 'All other sessions will be invalidated while this current session remains active.'
                                                : `"${confirmation.sessionName}" will be signed out and will need to authenticate again.`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-3.5 sm:flex-row sm:justify-end dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setConfirmation(null)}
                                className="h-9 rounded-lg border border-slate-200 px-4 text-[9px] font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (confirmation.type === 'disable-2fa') {
                                        void disableTwoFactor()
                                    } else if (confirmation.type === 'remove-passkey' && confirmation.passkeyId !== undefined) {
                                        void removePasskey(confirmation.passkeyId)
                                    } else if (confirmation.type === 'revoke-session' && confirmation.sessionId) {
                                        revokeSession(confirmation.sessionId)
                                    } else if (confirmation.type === 'revoke-other-sessions') {
                                        revokeOtherSessions()
                                    }
                                }}
                                className="h-9 rounded-lg bg-red-600 px-4 text-[9px] font-bold text-white transition hover:bg-red-700"
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
