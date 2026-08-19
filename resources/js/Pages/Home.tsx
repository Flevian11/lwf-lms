export default function Home() {
    return (
        <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
            <div className="mx-auto max-w-5xl">
                <div className="rounded-3xl bg-white p-10 shadow-sm ring-1 ring-slate-200">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-600">
                        Learn With Flevian
                    </p>

                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                        Learning, built properly.
                    </h1>

                    <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                        A modern learning management platform for courses,
                        assessments, assignments, progress tracking and
                        certificates.
                    </p>
                </div>
            </div>
        </main>
    );
}