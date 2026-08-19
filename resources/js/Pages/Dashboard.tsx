import { Head, Link, router, usePage } from '@inertiajs/react'
import { FormEvent } from 'react'

interface DashboardUser {
    id: number
    name: string
    email: string
    avatar_path: string | null
    role: 'Admin' | 'Student' | string | null
}

interface PageProps {
    [key: string]: unknown

    user: DashboardUser
}

function avatarUrl(path: string | null): string | null {
    if (!path) {
        return null
    }

    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path
    }

    return `/storage/${path}`
}

export default function Dashboard() {
    const { user } = usePage<PageProps>().props

    const avatar = avatarUrl(user.avatar_path)

    const handleLogout = (event: FormEvent) => {
        event.preventDefault()

        router.post('/logout')
    }

    return (
        <>
            <Head title="Dashboard" />

            <div className="min-h-screen bg-slate-50 text-slate-900">
                <header className="border-b border-slate-200 bg-white">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                        <Link
                            href="/dashboard"
                            className="text-lg font-semibold tracking-tight"
                        >
                            Learn With Flevian
                        </Link>

                        <div className="flex items-center gap-4">
                            <div className="hidden text-right sm:block">
                                <p className="text-sm font-semibold">
                                    {user.name}
                                </p>

                                <p className="text-xs text-slate-500">
                                    {user.role}
                                </p>
                            </div>

                            {avatar ? (
                                <img
                                    src={avatar}
                                    alt={`${user.name}'s avatar`}
                                    className="h-10 w-10 rounded-full object-cover"
                                />
                            ) : (
                                <div
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white"
                                    aria-label={`${user.name}'s avatar`}
                                >
                                    {user.name
                                        .trim()
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>
                            )}

                            <form onSubmit={handleLogout}>
                                <button
                                    type="submit"
                                    className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
                                >
                                    Sign out
                                </button>
                            </form>
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-7xl px-6 py-10">
                    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="max-w-3xl">
                            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                                Dashboard
                            </p>

                            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                                Welcome back, {user.name}.
                            </h1>

                            <p className="mt-4 text-base leading-7 text-slate-600">
                                Your Learn With Flevian learning space is ready.
                            </p>
                        </div>
                    </section>

                    <section className="mt-8 grid gap-6 md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6">
                            <p className="text-sm font-medium text-slate-500">
                                Account
                            </p>

                            <p className="mt-2 text-lg font-semibold">
                                {user.role}
                            </p>

                            <p className="mt-1 break-all text-sm text-slate-500">
                                {user.email}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-6">
                            <p className="text-sm font-medium text-slate-500">
                                Learning
                            </p>

                            <p className="mt-2 text-lg font-semibold">
                                Ready to learn
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                Your learning journey starts here.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-6">
                            <p className="text-sm font-medium text-slate-500">
                                Progress
                            </p>

                            <p className="mt-2 text-lg font-semibold">
                                Coming soon
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                Courses, assessments and certificates will
                                appear here.
                            </p>
                        </div>
                    </section>

                    {user.role === 'Admin' && (
                        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
                            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                                Administration
                            </p>

                            <h2 className="mt-2 text-xl font-semibold">
                                LMS administration
                            </h2>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                Administrative tools will be available here.
                                This area is visible only to Admin users.
                            </p>
                        </section>
                    )}

                    {user.role === 'Student' && (
                        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
                            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                                Your learning
                            </p>

                            <h2 className="mt-2 text-xl font-semibold">
                                Continue learning
                            </h2>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                Your courses, assessments and learning progress
                                will appear here as you continue your journey.
                            </p>
                        </section>
                    )}
                </main>
            </div>
        </>
    )
}