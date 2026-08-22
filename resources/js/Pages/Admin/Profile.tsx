import { Head, router, useForm, usePage } from '@inertiajs/react'
import { ChangeEvent, FormEvent, useRef, useState } from 'react'
import AdminLayout from '../../Components/AdminLayout'
import { Icon, assetUrl, initials } from '../../Components/StudentUI'

interface AdminUser { id: number; name: string; email: string; avatar_path?: string | null; email_two_factor_enabled?: boolean }
interface ProfileData {
    name: string; email: string; avatar_path: string | null; timezone: string; locale: string
    role: string | null; email_verified_at: string | null; created_at: string | null
}
interface ProfileProps { admin: AdminUser; profile: ProfileData }

function date(value: string | null) {
    if (!value) return 'Not available'
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? 'Not available' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d)
}

const button = 'cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-[10px] font-bold transition-all duration-200 hover:-translate-y-px active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60'

export default function AdminProfile() {
    const { admin, profile } = usePage<ProfileProps>().props
    const avatarInput = useRef<HTMLInputElement | null>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(assetUrl(profile.avatar_path))
    const [verifySending, setVerifySending] = useState(false)
    const [verifyMessage, setVerifyMessage] = useState<string | null>(null)
    const form = useForm<{ name: string; email: string; timezone: string; locale: string; avatar: File | null }>({
        name: profile.name, email: profile.email, timezone: profile.timezone || 'Africa/Nairobi', locale: profile.locale || 'en', avatar: null,
    })

    const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null
        if (!file) return
        form.setData('avatar', file)
        setAvatarPreview(URL.createObjectURL(file))
    }

    const submit = (event: FormEvent) => {
        event.preventDefault()
        form.post('/admin/profile', { forceFormData: true, preserveScroll: true, onSuccess: () => form.setData('avatar', null) })
    }

    const sendVerification = () => {
        setVerifySending(true); setVerifyMessage(null)
        router.post('/admin/profile/verify-email', {}, {
            preserveScroll: true,
            onSuccess: () => setVerifyMessage('A verification link has been sent to your email address.'),
            onError: () => setVerifyMessage('Unable to send the verification email. Please try again.'),
            onFinish: () => setVerifySending(false),
        })
    }

    return (
        <>
            <Head title="Admin Profile" />
            <AdminLayout admin={admin} title="Profile">
                <div className="w-full px-1">
                    <header className="border-b border-slate-200 pb-6 dark:border-slate-800">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1554c0] dark:text-[#78aaff]">Administrator identity</p>
                        <div className="mt-1 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                            <div><h1 className="text-2xl font-bold tracking-[-0.035em] text-slate-950 dark:text-white sm:text-3xl">Profile</h1><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 dark:text-slate-400">Manage the identity, contact details, preferences and account metadata used across the administrative workspace.</p></div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{profile.role ?? 'Admin'}</span>
                        </div>
                    </header>

                    {form.recentlySuccessful ? <div className="mt-5 border-l-2 border-emerald-500 bg-emerald-50 px-4 py-3 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">Profile updated successfully.</div> : null}
                    {verifyMessage ? <div className="mt-5 border-l-2 border-[#1554c0] bg-[#edf4ff] px-4 py-3 text-[10px] font-semibold text-[#1554c0] dark:bg-[#172945] dark:text-[#9bc1ff]">{verifyMessage}</div> : null}

                    <section className="border-b border-slate-200 py-8 dark:border-slate-800">
                        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Profile photo</p>
                                <div className="mt-4 flex items-center gap-4">
                                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[22px] bg-[#edf4ff] text-lg font-bold text-[#1554c0] dark:bg-[#172945] dark:text-[#8bb8ff]">{avatarPreview ? <img src={avatarPreview} alt="Administrator" className="h-full w-full object-cover" /> : initials(profile.name)}</div>
                                    <div><p className="text-sm font-bold text-slate-900 dark:text-white">{profile.name}</p><p className="mt-1 text-[10px] text-slate-400">Administrator account</p><input ref={avatarInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} /><button type="button" onClick={() => avatarInput.current?.click()} className={`${button} mt-3 border border-slate-200 text-slate-600 hover:border-[#1554c0]/40 hover:bg-[#edf4ff] hover:text-[#1554c0] dark:border-slate-700 dark:text-slate-300 dark:hover:bg-[#172945]`}><Icon name="upload" className="h-3.5 w-3.5" /> Change photo</button></div>
                                </div>
                                <p className="mt-3 text-[9px] leading-4 text-slate-400">JPG, PNG or WebP · maximum 5 MB. The same avatar is used in administrative activity records.</p>
                            </div>

                            <form onSubmit={submit} className="space-y-6">
                                <div className="grid gap-x-7 gap-y-5 sm:grid-cols-2">
                                    <label><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.11em] text-slate-400">Full name</span><input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className="w-full border-0 border-b border-slate-200 bg-transparent px-0 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#1554c0] dark:border-slate-700 dark:text-white" />{form.errors.name ? <span className="mt-1 block text-[9px] text-red-600">{form.errors.name}</span> : null}</label>
                                    <label><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.11em] text-slate-400">Email address</span><input type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} className="w-full border-0 border-b border-slate-200 bg-transparent px-0 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#1554c0] dark:border-slate-700 dark:text-white" />{form.errors.email ? <span className="mt-1 block text-[9px] text-red-600">{form.errors.email}</span> : null}</label>
                                    <label><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.11em] text-slate-400">Timezone</span><select value={form.data.timezone} onChange={(e) => form.setData('timezone', e.target.value)} className="w-full border-0 border-b border-slate-200 bg-transparent px-0 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#1554c0] dark:border-slate-700 dark:bg-transparent dark:text-white"><option value="Africa/Nairobi">Africa/Nairobi (EAT)</option><option value="UTC">UTC</option><option value="Europe/London">Europe/London</option><option value="America/New_York">America/New_York</option></select></label>
                                    <label><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.11em] text-slate-400">Language</span><select value={form.data.locale} onChange={(e) => form.setData('locale', e.target.value)} className="w-full border-0 border-b border-slate-200 bg-transparent px-0 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#1554c0] dark:border-slate-700 dark:bg-transparent dark:text-white"><option value="en">English</option><option value="sw">Kiswahili</option></select></label>
                                </div>
                                <div className="flex flex-col justify-between gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center dark:border-slate-800"><p className="text-[10px] leading-4 text-slate-400">Changing the email address resets its verification state and sends a fresh verification link.</p><button type="submit" disabled={form.processing} className={`${button} bg-[#1554c0] text-white shadow-sm hover:bg-[#1248a7] hover:shadow-md dark:bg-[#4c8dff] dark:text-[#07101f]`}>{form.processing ? 'Saving…' : 'Save profile changes'} <Icon name="check" className="h-3.5 w-3.5" /></button></div>
                            </form>
                        </div>
                    </section>

                    <section className="border-b border-slate-200 py-8 dark:border-slate-800">
                        <div className="flex items-end justify-between border-b border-slate-100 pb-4 dark:border-slate-800"><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Verification & access</p><h2 className="mt-1 text-base font-bold text-slate-900 dark:text-white">Account status</h2></div><Icon name="shield" className="h-4 w-4 text-[#1554c0] dark:text-[#78aaff]" /></div>
                        <div className="grid gap-7 py-6 md:grid-cols-3">
                            <div><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Email verification</p><p className={`mt-2 text-base font-bold ${profile.email_verified_at ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{profile.email_verified_at ? 'Verified' : 'Verification required'}</p><p className="mt-1 text-[10px] leading-4 text-slate-400">{profile.email_verified_at ? `Verified ${date(profile.email_verified_at)}.` : 'A verified email is required before administrator 2FA can be enabled.'}</p>{!profile.email_verified_at ? <button type="button" onClick={sendVerification} disabled={verifySending} className={`${button} mt-3 bg-[#1554c0] text-white shadow-sm hover:bg-[#1248a7] hover:shadow-md dark:bg-[#4c8dff] dark:text-[#07101f]`}>{verifySending ? 'Sending…' : 'Verify email now'} <Icon name="arrow" className="h-3.5 w-3.5" /></button> : null}</div>
                            <div><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Administrative role</p><p className="mt-2 text-base font-bold text-slate-900 dark:text-white">{profile.role ?? 'Admin'}</p><p className="mt-1 text-[10px] leading-4 text-slate-400">Role-based middleware protects the administrative namespace and its operations.</p></div>
                            <div><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Account created</p><p className="mt-2 text-base font-bold text-slate-900 dark:text-white">{date(profile.created_at)}</p><p className="mt-1 text-[10px] leading-4 text-slate-400">Original administrator account creation timestamp.</p></div>
                        </div>
                    </section>

                    <section className="py-8">
                        <div className="flex items-end justify-between border-b border-slate-100 pb-4 dark:border-slate-800"><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Security posture</p><h2 className="mt-1 text-base font-bold text-slate-900 dark:text-white">Privileged account controls</h2></div><a href="/admin/security" className="cursor-pointer inline-flex items-center gap-1.5 text-[10px] font-bold text-[#1554c0] transition hover:gap-2 dark:text-[#78aaff]">Open security <Icon name="arrow-right" className="h-3.5 w-3.5" /></a></div>
                        <div className="grid gap-7 py-6 md:grid-cols-3">
                            <div><p className="text-[10px] uppercase tracking-[0.1em] text-slate-400">Email 2FA</p><p className="mt-2 text-base font-bold text-slate-900 dark:text-white">{admin.email_two_factor_enabled ? 'Enabled' : 'Not enabled'}</p><p className="mt-1 text-[10px] text-slate-400">Additional verification for privileged sign-in.</p></div>
                            <div><p className="text-[10px] uppercase tracking-[0.1em] text-slate-400">Passkeys</p><p className="mt-2 text-base font-bold text-slate-900 dark:text-white">Manage in Security</p><p className="mt-1 text-[10px] text-slate-400">Register device authenticators for passwordless access.</p></div>
                            <div><p className="text-[10px] uppercase tracking-[0.1em] text-slate-400">Sessions</p><p className="mt-2 text-base font-bold text-slate-900 dark:text-white">Review active devices</p><p className="mt-1 text-[10px] text-slate-400">Revoke individual or other administrator sessions.</p></div>
                        </div>
                    </section>
                </div>
            </AdminLayout>
        </>
    )
}
