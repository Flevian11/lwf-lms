import { Head, router, usePage } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import { usePasskeyRegister } from '@laravel/passkeys/react'
import AdminLayout from '../../Components/AdminLayout'
import { Icon, assetUrl, initials } from '../../Components/StudentUI'

interface AdminUser { id: number; name: string; email: string; avatar_path?: string | null; email_two_factor_enabled?: boolean }
interface PasskeyItem { id: number; name: string; authenticator: string | null; last_used_at: string | null; created_at: string | null }
interface SessionItem { id: string; is_current?: boolean; ip_address?: string | null; user_agent?: string | null; device_type?: string | null; device_name?: string | null; browser?: string | null; browser_version?: string | null; platform?: string | null; platform_version?: string | null; last_activity_at?: string | null; last_activity?: number | null }
interface SecurityProps { admin: AdminUser; security: { role: string; email_verified: boolean; two_factor: { enabled: boolean; enabled_at: string | null } }; passkeys: PasskeyItem[]; sessions: SessionItem[]; sessionCount: number }

function csrf() { return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '' }
function formatDate(value: string | null | undefined) { if (!value) return 'Never'; const d = new Date(value); return Number.isNaN(d.getTime()) ? 'Unknown' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d) }
function browser(s: SessionItem) { return s.browser ? `${s.browser}${s.browser_version ? ` ${s.browser_version}` : ''}` : 'Browser not detected' }
function platform(s: SessionItem) { return s.platform ? `${s.platform}${s.platform_version ? ` ${s.platform_version}` : ''}` : 'OS not detected' }
function device(s: SessionItem) { if (s.device_name) return s.device_name; const type = `${s.device_type ?? ''} ${s.user_agent ?? ''}`.toLowerCase(); return /mobile|android|iphone|phone/.test(type) ? 'Mobile device' : /tablet/.test(type) ? 'Tablet' : 'Computer' }
function browserName(ua: string) { if (/Edg\//i.test(ua)) return 'Edge'; if (/OPR\//i.test(ua)) return 'Opera'; if (/Firefox\//i.test(ua)) return 'Firefox'; if (/Chrome\//i.test(ua)) return 'Chrome'; if (/Safari\//i.test(ua) && /Version\//i.test(ua)) return 'Safari'; return 'Browser' }
function platformName(ua: string) { if (/iPhone/i.test(ua)) return 'iPhone'; if (/iPad/i.test(ua)) return 'iPad'; if (/Android/i.test(ua)) return /Mobile/i.test(ua) ? 'Android phone' : 'Android tablet'; if (/Windows/i.test(ua)) return 'Windows PC'; if (/Macintosh|Mac OS X/i.test(ua)) return 'Mac'; if (/Linux/i.test(ua)) return 'Linux PC'; return 'This device' }
async function readError(response: Response, fallback: string) { try { const data = await response.json(); if (data?.message) return String(data.message); if (data?.errors) { const first = Object.values(data.errors as Record<string, unknown>).flat()[0]; if (typeof first === 'string') return first } } catch {} return fallback }
function FingerprintIcon({ className = 'h-5 w-5' }: { className?: string }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><path d="M12 11a2 2 0 0 1 2 2c0 4-1 6-2 8" /><path d="M8 13a4 4 0 0 1 8 0c0 4-.7 6.5-2 8" /><path d="M6 13a6 6 0 0 1 12 0c0 2-.2 3.8-.7 5.3" /><path d="M4.5 13a7.5 7.5 0 0 1 15 0" /></svg> }
function DeviceIcon({ session }: { session: SessionItem }) { const mobile = /mobile|android|iphone|phone/i.test(`${session.device_type ?? ''} ${session.user_agent ?? ''}`); return <Icon name={mobile ? 'user' : 'grid'} className="h-5 w-5" /> }
const button = 'cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-[10px] font-bold transition-all duration-200 hover:-translate-y-px hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60'

export default function AdminSecurity() {
    const { admin, security, passkeys: initialPasskeys, sessions: initialSessions, sessionCount } = usePage<SecurityProps>().props
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(security.two_factor.enabled)
    const [processing2fa, setProcessing2fa] = useState(false)
    const [passkeys, setPasskeys] = useState(initialPasskeys)
    const [sessions, setSessions] = useState(initialSessions)
    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [verifySending, setVerifySending] = useState(false)
    const [confirm, setConfirm] = useState<{ type: '2fa' | 'passkey' | 'session' | 'others'; id?: number | string; name?: string } | null>(null)
    const { register, isLoading: registering, error: passkeyHookError, isSupported } = usePasskeyRegister({ onSuccess: () => window.location.reload() })

    useEffect(() => setPasskeys(initialPasskeys), [initialPasskeys])
    useEffect(() => setSessions(initialSessions), [initialSessions])

    const sendVerification = () => {
        setVerifySending(true); setError(null); setMessage(null)
        router.post('/admin/profile/verify-email', {}, { preserveScroll: true, onSuccess: () => setMessage('A verification link has been sent to your email address.'), onError: () => setError('Unable to send the verification email. Please try again.'), onFinish: () => setVerifySending(false) })
    }

    const toggle2fa = async () => {
        setProcessing2fa(true); setError(null); setMessage(null)
        try {
            const response = await fetch('/admin/security/two-factor', { method: twoFactorEnabled ? 'DELETE' : 'POST', credentials: 'same-origin', headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': csrf() } })
            if (!response.ok) throw new Error(await readError(response, 'Unable to update two-factor authentication.'))
            const data = await response.json()
            setTwoFactorEnabled(Boolean(data.enabled)); setMessage(String(data.status ?? (data.enabled ? 'Two-factor authentication enabled.' : 'Two-factor authentication disabled.')))
        } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update two-factor authentication.') }
        finally { setProcessing2fa(false); setConfirm(null) }
    }

    const addPasskey = async () => {
        setError(null); setMessage(null)
        if (!isSupported) { setError('Passkeys are not supported by this browser or device.'); return }
        try {
            const name = `${platformName(navigator.userAgent)} · ${browserName(navigator.userAgent)}`
            await register(name)
        } catch (e) { setError(e instanceof Error ? e.message : 'Unable to register passkey.') }
    }

    const removePasskey = async (id: number) => {
        setError(null)
        try {
            const response = await fetch(`/user/passkeys/${encodeURIComponent(String(id))}`, { method: 'DELETE', credentials: 'same-origin', headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': csrf() } })
            if (!response.ok) throw new Error(await readError(response, 'Unable to remove passkey.'))
            setPasskeys(items => items.filter(item => item.id !== id)); setMessage('Passkey removed.')
        } catch (e) { setError(e instanceof Error ? e.message : 'Unable to remove passkey.') }
        finally { setConfirm(null) }
    }

    const revokeSession = (id: string) => router.delete(`/security/sessions/${encodeURIComponent(id)}`, { preserveScroll: true, onSuccess: () => { setSessions(items => items.filter(item => item.id !== id)); setMessage('Session revoked.'); setConfirm(null) }, onError: () => setError('Unable to revoke this session.') })
    const revokeOthers = () => router.post('/security/sessions/revoke-others', {}, { preserveScroll: true, onSuccess: () => { setSessions(items => items.filter(item => item.is_current)); setMessage('All other administrator sessions were signed out.'); setConfirm(null) }, onError: () => setError('Unable to sign out other sessions.') })
    const otherSessions = sessions.filter(s => !s.is_current)

    return (
        <>
            <Head title="Admin Security" />
            <AdminLayout admin={admin} title="Security">
                <div className="w-full px-1">
                    <header className="border-b border-slate-200 pb-6 dark:border-slate-800">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1554c0] dark:text-[#78aaff]">Administrator protection</p>
                        <div className="mt-1 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-2xl font-bold tracking-[-0.035em] text-slate-950 dark:text-white sm:text-3xl">Security</h1><p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500 dark:text-slate-400">Control privileged authentication, verify the administrator identity, manage passkeys and review every active administrative session.</p></div><span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${security.email_verified && (twoFactorEnabled || passkeys.length) ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{security.email_verified && (twoFactorEnabled || passkeys.length) ? 'Protected' : 'Protection review recommended'}</span></div>
                    </header>

                    {message ? <div className="mt-5 border-l-2 border-emerald-500 bg-emerald-50 px-4 py-3 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{message}</div> : null}
                    {error || passkeyHookError ? <div className="mt-5 border-l-2 border-red-500 bg-red-50 px-4 py-3 text-[10px] font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-300">{error ?? passkeyHookError}</div> : null}

                    {!security.email_verified ? <section className="border-b border-slate-200 py-7 dark:border-slate-800"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex items-start gap-4"><div className="mt-0.5 text-amber-500"><Icon name="shield" className="h-5 w-5" /></div><div><p className="text-sm font-bold text-slate-900 dark:text-white">Verify your administrator email</p><p className="mt-1 max-w-2xl text-[10px] leading-5 text-slate-500 dark:text-slate-400">Email verification is required before email-based two-factor authentication can be enabled. We will send a fresh verification link to {admin.email}.</p></div></div><button type="button" onClick={sendVerification} disabled={verifySending} className={`${button} bg-[#1554c0] text-white hover:bg-[#1248a7] dark:bg-[#4c8dff] dark:text-[#07101f]`}>{verifySending ? 'Sending…' : 'Verify email now'} <Icon name="arrow" className="h-3.5 w-3.5" /></button></div></section> : null}

                    <section className="border-b border-slate-200 py-8 dark:border-slate-800">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800"><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Authentication</p><h2 className="mt-1 text-base font-bold text-slate-900 dark:text-white">Privileged sign-in controls</h2><p className="mt-1 text-[10px] leading-4 text-slate-400">Use layered authentication for the administrator account.</p></div><Icon name="shield" className="h-5 w-5 text-[#1554c0] dark:text-[#78aaff]" /></div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            <div className="flex flex-col justify-between gap-5 py-7 sm:flex-row sm:items-center"><div className="flex items-start gap-4"><div className="mt-0.5 text-[#1554c0] dark:text-[#8bb8ff]"><Icon name="shield" className="h-5 w-5" /></div><div><p className="text-sm font-bold text-slate-900 dark:text-white">Two-factor authentication</p><p className="mt-1 max-w-2xl text-[10px] leading-5 text-slate-400">{twoFactorEnabled ? `Enabled ${security.two_factor.enabled_at ? `since ${formatDate(security.two_factor.enabled_at)}` : 'for this administrator account'}.` : security.email_verified ? 'Add a second verification layer using the existing email OTP system before privileged access is completed.' : 'Verify your email first. Email 2FA cannot be enabled until the administrator identity is verified.'}</p></div></div><button type="button" disabled={processing2fa || !security.email_verified} onClick={() => twoFactorEnabled ? setConfirm({ type: '2fa' }) : void toggle2fa()} className={`${button} ${twoFactorEnabled ? 'border border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/20' : 'bg-[#1554c0] text-white hover:bg-[#1248a7] dark:bg-[#4c8dff] dark:text-[#07101f]'} sm:min-w-[145px]`}>{processing2fa ? 'Processing…' : twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}</button></div>

                            <div className="flex flex-col justify-between gap-5 py-7 sm:flex-row sm:items-center"><div className="flex items-start gap-4"><div className="mt-0.5 text-[#1554c0] dark:text-[#8bb8ff]"><FingerprintIcon /></div><div><p className="text-sm font-bold text-slate-900 dark:text-white">Passkeys</p><p className="mt-1 max-w-2xl text-[10px] leading-5 text-slate-400">Register fingerprint, face recognition, device PIN or another platform authenticator. The browser handles the credential ceremony securely.</p></div></div><button type="button" disabled={registering || !isSupported} onClick={() => void addPasskey()} className={`${button} bg-[#1554c0] text-white hover:bg-[#1248a7] dark:bg-[#4c8dff] dark:text-[#07101f] sm:min-w-[145px]`}>{registering ? 'Waiting for device…' : 'Add passkey'} <FingerprintIcon className="h-3.5 w-3.5" /></button></div>
                            {!isSupported ? <p className="pb-4 pl-9 text-[10px] text-amber-600 dark:text-amber-400">Passkeys are not supported by this browser or device.</p> : null}
                            {passkeys.length ? passkeys.map(passkey => <div key={passkey.id} className="flex flex-col justify-between gap-4 py-5 pl-9 sm:flex-row sm:items-center"><div><p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{passkey.name}</p><p className="mt-1 text-[10px] leading-4 text-slate-400">{passkey.authenticator ?? 'Platform authenticator'} · Added {formatDate(passkey.created_at)} · Last used {formatDate(passkey.last_used_at)}</p></div><button type="button" onClick={() => setConfirm({ type: 'passkey', id: passkey.id, name: passkey.name })} className={`${button} border border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/20`}>Remove</button></div>) : <div className="py-6 pl-9 text-[10px] text-slate-400">No passkeys are registered. Add one from this device to enable passwordless administrator sign-in.</div>}
                        </div>
                    </section>

                    <section className="border-b border-slate-200 py-8 dark:border-slate-800">
                        <div className="border-b border-slate-100 pb-4 dark:border-slate-800"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Administrative posture</p><h2 className="mt-1 text-base font-bold text-slate-900 dark:text-white">Identity and access state</h2></div>
                        <div className="grid gap-8 py-6 md:grid-cols-3"><div><p className="text-[10px] uppercase tracking-[0.1em] text-slate-400">Role</p><p className="mt-2 text-base font-bold text-slate-900 dark:text-white">{security.role}</p><p className="mt-1 text-[10px] leading-4 text-slate-400">Role-based middleware protects the /admin namespace.</p></div><div><p className="text-[10px] uppercase tracking-[0.1em] text-slate-400">Email verification</p><p className={`mt-2 text-base font-bold ${security.email_verified ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{security.email_verified ? 'Verified' : 'Pending'}</p><p className="mt-1 text-[10px] leading-4 text-slate-400">Verification status gates email-based administrator 2FA.</p></div><div><p className="text-[10px] uppercase tracking-[0.1em] text-slate-400">Audit access</p><a href="/admin/settings" className="cursor-pointer mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-[#1554c0] transition hover:gap-2 dark:text-[#78aaff]">Open activity <Icon name="arrow-right" className="h-3.5 w-3.5" /></a><p className="mt-1 text-[10px] leading-4 text-slate-400">Review traffic intelligence and the full audit trail from Settings.</p></div></div>
                    </section>

                    <section className="py-8">
                        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-end dark:border-slate-800"><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Sessions</p><h2 className="mt-1 text-base font-bold text-slate-900 dark:text-white">Active administrator devices</h2><p className="mt-1 text-[10px] text-slate-400">{sessionCount} active session{sessionCount === 1 ? '' : 's'} · {otherSessions.length} other device{otherSessions.length === 1 ? '' : 's'}</p></div>{otherSessions.length ? <button type="button" onClick={() => setConfirm({ type: 'others' })} className={`${button} border border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/20`}>Sign out other devices</button> : null}</div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">{sessions.length ? sessions.map(session => <div key={session.id} className="flex flex-col justify-between gap-4 py-6 sm:flex-row sm:items-center"><div className="flex items-start gap-4"><div className="mt-0.5 text-slate-500 dark:text-slate-400"><DeviceIcon session={session} /></div><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold text-slate-800 dark:text-white">{device(session)}</p>{session.is_current ? <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.08em] text-emerald-600 dark:text-emerald-400">Current</span> : null}</div><p className="mt-1 text-[10px] text-slate-400">{browser(session)} · {platform(session)}</p><p className="mt-1 text-[10px] text-slate-400">IP {session.ip_address ?? 'Unavailable'} · Last activity {formatDate(session.last_activity_at)}</p></div></div>{!session.is_current ? <button type="button" onClick={() => setConfirm({ type: 'session', id: session.id, name: device(session) })} className={`${button} border border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/20`}>Revoke</button> : null}</div>) : <p className="py-10 text-center text-xs text-slate-400">No session details available.</p>}</div>
                    </section>
                </div>
            </AdminLayout>

            {confirm ? <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[2px]" onMouseDown={e => { if (e.target === e.currentTarget) setConfirm(null) }}><div className="w-full max-w-md rounded-[22px] border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-[#111827]"><div className="flex gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300"><Icon name="shield" className="h-5 w-5" /></div><div><h2 className="text-base font-bold text-slate-900 dark:text-white">{confirm.type === '2fa' ? 'Disable two-factor authentication?' : confirm.type === 'passkey' ? 'Remove passkey?' : confirm.type === 'others' ? 'Sign out other devices?' : 'Revoke this session?'}</h2><p className="mt-2 text-[10px] leading-5 text-slate-500 dark:text-slate-400">{confirm.type === '2fa' ? 'Email two-factor authentication will no longer protect this administrator account.' : confirm.type === 'passkey' ? `"${confirm.name}" will no longer be available for administrator sign-in.` : confirm.type === 'others' ? 'All other administrator sessions will be invalidated while this current session remains active.' : `"${confirm.name}" will be signed out and must authenticate again.`}</p></div></div><div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800"><button type="button" onClick={() => setConfirm(null)} className={`${button} border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800`}>Cancel</button><button type="button" onClick={() => { if (confirm.type === '2fa') void toggle2fa(); else if (confirm.type === 'passkey' && typeof confirm.id === 'number') void removePasskey(confirm.id); else if (confirm.type === 'session' && typeof confirm.id === 'string') revokeSession(confirm.id); else if (confirm.type === 'others') revokeOthers() }} className={`${button} bg-red-600 text-white hover:bg-red-700`}>Confirm</button></div></div></div> : null}
        </>
    )
}
