import { Head, Link, usePage } from '@inertiajs/react';
import type { PageProps } from '@inertiajs/core';
import { usePasskeyRegister } from '@laravel/passkeys/react';
import { useEffect, useState } from 'react';

interface PasskeyItem {
    id: number;
    name: string;
    authenticator: string | null;
    last_used_at: string | null;
    created_at: string | null;
}

interface TwoFactorState {
    enabled: boolean;
    enabledAt: string | null;
}

interface SecurityPageProps extends PageProps {
    [key: string]: unknown;
    twoFactor: TwoFactorState;
    passkeys: PasskeyItem[];
}

function ShieldIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
            aria-hidden="true"
        >
            <path d="M12 3 20 6v5c0 5-3.2 8.3-8 10-4.8-1.7-8-5-8-10V6l8-3Z" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    );
}

function KeyIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
            aria-hidden="true"
        >
            <circle cx="8" cy="15" r="4" />
            <path d="m11 12 8-8" />
            <path d="m16 7 2 2" />
            <path d="m18 5 2 2" />
        </svg>
    );
}

function FingerprintIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="h-5 w-5"
            aria-hidden="true"
        >
            <path d="M12 11a2 2 0 0 1 2 2c0 4-1 6-2 8" />
            <path d="M8 13a4 4 0 0 1 8 0c0 4-.7 6.5-2 8" />
            <path d="M6 13a6 6 0 0 1 12 0c0 2-.2 3.8-.7 5.3" />
            <path d="M4.5 13a7.5 7.5 0 0 1 15 0" />
            <path d="M10 21c.8-2.1 1.2-4.2 1.2-6.5" />
        </svg>
    );
}

function formatDate(value: string | null): string {
    if (!value) {
        return 'Never';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Unknown';
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
}

/**
 * Generate a display name automatically.
 *
 * This name is only metadata shown in the account security page.
 * The actual credential is created by the browser/device WebAuthn
 * authenticator.
 */
function getAutomaticPasskeyName(): string {
    const userAgent = navigator.userAgent.toLowerCase();

    const extendedNavigator = navigator as Navigator & {
        userAgentData?: {
            platform?: string;
        };
    };

    const platform = (
        extendedNavigator.userAgentData?.platform ??
        navigator.platform ??
        ''
    ).toLowerCase();

    if (
        platform.includes('win') ||
        userAgent.includes('windows')
    ) {
        return 'Windows PC';
    }

    if (
        platform.includes('mac') ||
        userAgent.includes('mac os')
    ) {
        return 'Mac';
    }

    if (
        userAgent.includes('iphone') ||
        platform.includes('iphone')
    ) {
        return 'iPhone';
    }

    if (
        userAgent.includes('ipad') ||
        platform.includes('ipad')
    ) {
        return 'iPad';
    }

    if (userAgent.includes('android')) {
        return 'Android device';
    }

    if (userAgent.includes('linux')) {
        return 'Linux PC';
    }

    return 'This device';
}

function getCsrfToken(): string {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? ''
    );
}

async function getResponseError(
    response: Response,
    fallback: string,
): Promise<Error> {
    try {
        const data: unknown = await response.json();

        if (
            typeof data === 'object' &&
            data !== null &&
            'message' in data &&
            typeof data.message === 'string'
        ) {
            return new Error(data.message);
        }
    } catch {
        // Use fallback.
    }

    return new Error(fallback);
}

export default function Security() {
    const { twoFactor, passkeys: initialPasskeys } =
        usePage<SecurityPageProps>().props;

    /*
     * Laravel's official React passkey adapter.
     *
     * register(name) starts the native WebAuthn registration
     * ceremony and handles the browser credential serialization.
     */
    const {
        register: registerPasskey,
        isLoading: passkeyRegistering,
        error: passkeyRegisterError,
        isSupported: passkeysSupported,
    } = usePasskeyRegister({
        onSuccess: () => {
            window.location.reload();
        },
    });

    const [twoFactorEnabled, setTwoFactorEnabled] = useState(
        twoFactor.enabled,
    );

    const [twoFactorProcessing, setTwoFactorProcessing] =
        useState(false);

    const [twoFactorError, setTwoFactorError] =
        useState<string | null>(null);

    const [passkeyDeleteProcessing, setPasskeyDeleteProcessing] =
        useState<number | null>(null);

    const [passkeyDeleteError, setPasskeyDeleteError] =
        useState<string | null>(null);

    const [localPasskeys, setLocalPasskeys] =
        useState<PasskeyItem[]>(initialPasskeys);

    useEffect(() => {
        setTwoFactorEnabled(twoFactor.enabled);
    }, [twoFactor.enabled]);

    useEffect(() => {
        setLocalPasskeys(initialPasskeys);
    }, [initialPasskeys]);

    /*
     * Enable email-based 2FA.
     *
     * This is intentionally separate from Laravel's native TOTP
     * implementation. Our application sends the OTP to the
     * user's verified email address.
     */
    const enableTwoFactor = async () => {
        setTwoFactorProcessing(true);
        setTwoFactorError(null);

        try {
            const response = await fetch(
                '/user/two-factor-authentication',
                {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': getCsrfToken(),
                    },
                    credentials: 'same-origin',
                },
            );

            if (!response.ok) {
                throw await getResponseError(
                    response,
                    'Unable to enable email two-factor authentication.',
                );
            }

            setTwoFactorEnabled(true);
        } catch (error) {
            console.error(error);

            setTwoFactorError(
                error instanceof Error
                    ? error.message
                    : 'Unable to enable email two-factor authentication.',
            );
        } finally {
            setTwoFactorProcessing(false);
        }
    };

    /*
     * Disable email-based 2FA.
     */
    const disableTwoFactor = async () => {
        if (
            !window.confirm(
                'Disable email two-factor authentication for this account?',
            )
        ) {
            return;
        }

        setTwoFactorProcessing(true);
        setTwoFactorError(null);

        try {
            const response = await fetch(
                '/user/two-factor-authentication',
                {
                    method: 'DELETE',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': getCsrfToken(),
                    },
                    credentials: 'same-origin',
                },
            );

            if (!response.ok) {
                throw await getResponseError(
                    response,
                    'Unable to disable email two-factor authentication.',
                );
            }

            setTwoFactorEnabled(false);
        } catch (error) {
            console.error(error);

            setTwoFactorError(
                error instanceof Error
                    ? error.message
                    : 'Unable to disable email two-factor authentication.',
            );
        } finally {
            setTwoFactorProcessing(false);
        }
    };

    /*
     * Register a passkey for the current device.
     *
     * No manual name field is required.
     *
     * Example:
     *
     * Windows PC
     *     ↓
     * Windows Hello / PIN / fingerprint / security key
     *     ↓
     * WebAuthn credential
     *     ↓
     * Laravel /user/passkeys
     *
     * The browser/device controls the actual authenticator.
     */
    const addPasskey = async () => {
        setPasskeyDeleteError(null);

        if (!passkeysSupported) {
            setPasskeyDeleteError(
                'Passkeys are not supported by this browser or device.',
            );

            return;
        }

        const name = getAutomaticPasskeyName();

        try {
            await registerPasskey(name);
        } catch (error) {
            /*
             * The Laravel adapter already exposes its error through
             * passkeyRegisterError. We log the exception for
             * development diagnostics only.
             */
            console.error(error);
        }
    };

    /*
     * Delete a registered passkey.
     */
    const removePasskey = async (id: number) => {
        if (
            !window.confirm(
                'Remove this passkey? It will no longer be able to sign in to this account.',
            )
        ) {
            return;
        }

        setPasskeyDeleteProcessing(id);
        setPasskeyDeleteError(null);

        try {
            const response = await fetch(
                `/user/passkeys/${id}`,
                {
                    method: 'DELETE',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': getCsrfToken(),
                    },
                    credentials: 'same-origin',
                },
            );

            if (!response.ok) {
                throw await getResponseError(
                    response,
                    'Unable to remove this passkey.',
                );
            }

            setLocalPasskeys((current) =>
                current.filter(
                    (passkey) => passkey.id !== id,
                ),
            );
        } catch (error) {
            console.error(error);

            setPasskeyDeleteError(
                error instanceof Error
                    ? error.message
                    : 'Unable to remove this passkey.',
            );
        } finally {
            setPasskeyDeleteProcessing(null);
        }
    };

    /*
     * IMPORTANT:
     *
     * Do NOT use:
     *
     * passkeyRegisterError instanceof Error
     *
     * The React adapter exposes `error` as the displayable
     * error value. Typed error information is available separately
     * through `errorInstance`.
     */
    const combinedPasskeyError =
        passkeyRegisterError || passkeyDeleteError;

    return (
        <>
            <Head title="Security" />

            <main className="min-h-screen bg-[#f5f7fa] px-4 py-8 text-[#172033] dark:bg-[#0b1220] dark:text-[#f3f6fc] sm:px-6 lg:px-8">
                <div className="mx-auto max-w-5xl">
                    <header className="mb-8">
                        <Link
                            href="/dashboard"
                            className="mb-4 inline-flex items-center text-sm font-medium text-[#1554c0] hover:underline dark:text-[#6ba3ff]"
                        >
                            ← Back to dashboard
                        </Link>

                        <h1 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
                            Security
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#53627a] dark:text-[#aab7cc]">
                            Manage email two-factor authentication
                            and passkeys for your Learn With Flevian
                            account.
                        </p>
                    </header>

                    <div className="space-y-6">
                        {/* EMAIL 2FA */}
                        <section className="rounded-[8px] border border-[#d8dee9] bg-white shadow-[0_2px_8px_rgba(23,32,51,0.08)] dark:border-[#2a3850] dark:bg-[#111827]">
                            <div className="border-b border-[#e1e6ee] p-6 dark:border-[#2a3850]">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1554c0]/10 text-[#1554c0] dark:bg-[#4c8dff]/10 dark:text-[#6ba3ff]">
                                        <ShieldIcon />
                                    </div>

                                    <div className="min-w-0">
                                        <h2 className="text-lg font-semibold">
                                            Email two-factor authentication
                                        </h2>

                                        <p className="mt-1 text-sm leading-6 text-[#53627a] dark:text-[#aab7cc]">
                                            Protect password sign-ins
                                            with a one-time security
                                            code sent to your verified
                                            email address. No
                                            authenticator app is required.
                                        </p>
                                    </div>

                                    <span
                                        className={`ml-auto shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                            twoFactorEnabled
                                                ? 'bg-[#e8f7ed] text-[#177245] dark:bg-[#123524] dark:text-[#72d39a]'
                                                : 'bg-[#f1f3f6] text-[#647086] dark:bg-[#202b3c] dark:text-[#9aa8bd]'
                                        }`}
                                    >
                                        {twoFactorEnabled
                                            ? 'Enabled'
                                            : 'Disabled'}
                                    </span>
                                </div>
                            </div>

                            <div className="p-6">
                                {twoFactorError && (
                                    <div className="mb-5 rounded-[6px] border border-[#d13438] bg-[#fff5f5] px-4 py-3 text-sm text-[#b42318] dark:border-[#6f3030] dark:bg-[#2a1517] dark:text-[#ff8b8b]">
                                        {twoFactorError}
                                    </div>
                                )}

                                {!twoFactorEnabled ? (
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm font-semibold">
                                                Add another layer of
                                                protection
                                            </p>

                                            <p className="mt-1 text-sm leading-6 text-[#71809a] dark:text-[#8392aa]">
                                                Password sign-ins will
                                                require a six-digit code
                                                delivered to your verified
                                                email.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={enableTwoFactor}
                                            disabled={
                                                twoFactorProcessing
                                            }
                                            className="inline-flex h-10 shrink-0 items-center justify-center rounded-[6px] bg-[#1554c0] px-4 text-sm font-semibold text-white transition hover:bg-[#1048a8] disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {twoFactorProcessing
                                                ? 'Enabling...'
                                                : 'Enable email 2FA'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm font-semibold">
                                                Email 2FA is active
                                            </p>

                                            <p className="mt-1 text-sm leading-6 text-[#71809a] dark:text-[#8392aa]">
                                                Password sign-ins require
                                                a six-digit code delivered
                                                to your verified email.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={disableTwoFactor}
                                            disabled={
                                                twoFactorProcessing
                                            }
                                            className="inline-flex h-10 shrink-0 items-center justify-center rounded-[6px] border border-[#d13438] px-4 text-sm font-semibold text-[#b42318] hover:bg-[#fff5f5] disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {twoFactorProcessing
                                                ? 'Disabling...'
                                                : 'Disable email 2FA'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* PASSKEYS */}
                        <section className="rounded-[8px] border border-[#d8dee9] bg-white shadow-[0_2px_8px_rgba(23,32,51,0.08)] dark:border-[#2a3850] dark:bg-[#111827]">
                            <div className="border-b border-[#e1e6ee] p-6 dark:border-[#2a3850]">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1554c0]/10 text-[#1554c0] dark:bg-[#4c8dff]/10 dark:text-[#6ba3ff]">
                                        <FingerprintIcon />
                                    </div>

                                    <div className="min-w-0">
                                        <h2 className="text-lg font-semibold">
                                            Passkeys
                                        </h2>

                                        <p className="mt-1 text-sm leading-6 text-[#53627a] dark:text-[#aab7cc]">
                                            Sign in without a password
                                            using Windows Hello,
                                            biometrics, your device,
                                            or a security key.
                                        </p>
                                    </div>

                                    <span className="ml-auto shrink-0 rounded-full bg-[#f1f3f6] px-2.5 py-1 text-xs font-semibold text-[#647086] dark:bg-[#202b3c] dark:text-[#9aa8bd]">
                                        {localPasskeys.length}{' '}
                                        {localPasskeys.length === 1
                                            ? 'passkey'
                                            : 'passkeys'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-5 p-6">
                                {combinedPasskeyError && (
                                    <div className="rounded-[6px] border border-[#d13438] bg-[#fff5f5] px-4 py-3 text-sm text-[#b42318] dark:border-[#6f3030] dark:bg-[#2a1517] dark:text-[#ff8b8b]">
                                        {combinedPasskeyError}
                                    </div>
                                )}

                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm font-semibold">
                                            This device
                                        </p>

                                        <p className="mt-1 text-sm leading-6 text-[#71809a] dark:text-[#8392aa]">
                                            Set up a passkey using this
                                            device&apos;s secure
                                            authenticator. Windows
                                            Hello, biometrics, device
                                            PIN, or a security key may
                                            be used depending on your
                                            device.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            void addPasskey();
                                        }}
                                        disabled={
                                            passkeyRegistering ||
                                            !passkeysSupported
                                        }
                                        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[6px] bg-[#1554c0] px-5 text-sm font-semibold text-white transition hover:bg-[#1048a8] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <KeyIcon />

                                        {passkeyRegistering
                                            ? 'Setting up...'
                                            : 'Set up this device'}
                                    </button>
                                </div>

                                {!passkeysSupported && (
                                    <p className="text-sm text-[#b42318]">
                                        Passkeys are not supported by
                                        this browser or device.
                                    </p>
                                )}

                                {localPasskeys.length === 0 ? (
                                    <div className="rounded-[6px] border border-dashed border-[#c9d2df] p-6 text-center dark:border-[#34435a]">
                                        <p className="text-sm font-medium">
                                            No passkeys registered.
                                        </p>

                                        <p className="mt-1 text-sm text-[#71809a] dark:text-[#8392aa]">
                                            Set up this device to enable
                                            passwordless sign-in.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-[#e1e6ee] rounded-[6px] border border-[#e1e6ee] dark:divide-[#2a3850] dark:border-[#2a3850]">
                                        {localPasskeys.map(
                                            (passkey) => (
                                                <div
                                                    key={passkey.id}
                                                    className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f1f3f6] text-[#53627a] dark:bg-[#202b3c] dark:text-[#aab7cc]">
                                                            <FingerprintIcon />
                                                        </div>

                                                        <div>
                                                            <p className="text-sm font-semibold">
                                                                {
                                                                    passkey.name
                                                                }
                                                            </p>

                                                            <p className="mt-1 text-xs text-[#71809a] dark:text-[#8392aa]">
                                                                {passkey.authenticator ??
                                                                    'Device authenticator'}{' '}
                                                                · Added{' '}
                                                                {formatDate(
                                                                    passkey.created_at,
                                                                )}
                                                            </p>

                                                            <p className="mt-1 text-xs text-[#71809a] dark:text-[#8392aa]">
                                                                Last used:{' '}
                                                                {formatDate(
                                                                    passkey.last_used_at,
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            void removePasskey(
                                                                passkey.id,
                                                            );
                                                        }}
                                                        disabled={
                                                            passkeyDeleteProcessing !==
                                                            null
                                                        }
                                                        className="inline-flex h-9 items-center justify-center rounded-[6px] border border-[#d13438] px-3 text-sm font-semibold text-[#b42318] hover:bg-[#fff5f5] disabled:cursor-not-allowed disabled:opacity-60"
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
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </>
    );
}