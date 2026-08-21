import { Head } from '@inertiajs/react'
import { useState } from 'react'
import StudentLayout from '../Components/StudentLayout'
import { Card, EmptyState, Icon, SectionHeader } from '../Components/StudentUI'
import type { DashboardStats, Student } from '../Components/student-types'

interface AchievementItem {
    id: number
    name: string
    description: string
    icon: string | null
    points: number
    earned_at: string | null
}

interface CourseItem {
    id: number
    course_id: number
    title: string | null
    slug: string | null
    completed_at: string | null
    certificate_url: string
}

interface AssignmentResult {
    id: number
    title: string
    course: string | null
    score: number | null
    max_points: number
    percentage: number | null
    graded_at: string | null
    transcript_url: string | null
}

interface QuizResult {
    id: number
    title: string
    course: string | null
    score: number | null
    max_score: number | null
    percentage: number | null
    passed_at: string | null
}

interface Props {
    student: Student
    stats: DashboardStats
    earned_achievements: AchievementItem[]
    completed_courses: CourseItem[]
    assignment_results: AssignmentResult[]
    quiz_results: QuizResult[]
    transcript_url: string
}

function date(value: string | null): string {
    if (!value) return '—'

    return new Date(value).toLocaleDateString('en-KE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

function getFilenameFromResponse(response: Response, fallback: string): string {
    const disposition = response.headers.get('content-disposition')

    if (!disposition) {
        return fallback
    }

    const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i)

    if (utfMatch?.[1]) {
        try {
            return decodeURIComponent(utfMatch[1])
        } catch {
            return utfMatch[1]
        }
    }

    const normalMatch = disposition.match(/filename="?([^"]+)"?/i)

    return normalMatch?.[1] || fallback
}

async function downloadPdf(
    url: string,
    fallbackFilename: string,
): Promise<void> {
    const response = await fetch(url, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/pdf',
        },
    })

    if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`)
    }

    const blob = await response.blob()

    if (!blob.size) {
        throw new Error('The downloaded PDF was empty.')
    }

    const filename = getFilenameFromResponse(response, fallbackFilename)
    const objectUrl = URL.createObjectURL(blob)

    try {
        const anchor = document.createElement('a')
        anchor.href = objectUrl
        anchor.download = filename
        anchor.style.display = 'none'

        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
    } finally {
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    }
}

function DownloadSpinner() {
    return (
        <span
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
        />
    )
}

function AchievementCard({ item }: { item: AchievementItem }) {
    const icon =
        item.icon === 'assignment'
            ? 'assignment'
            : item.icon === 'quiz'
              ? 'quiz'
              : 'trophy'

    return (
        <Card className="p-4">
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#8bb8ff]">
                    <Icon name={icon} className="h-4.5 w-4.5" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="text-xs font-bold leading-5 text-slate-900 dark:text-white">
                            {item.name}
                        </h3>

                        <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-1 text-[9px] font-bold text-amber-700 dark:text-amber-300">
                            +{item.points} pts
                        </span>
                    </div>

                    <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
                        {item.description}
                    </p>

                    <p className="mt-2 text-[8px] font-bold uppercase tracking-[0.1em] text-slate-400">
                        Earned {date(item.earned_at)}
                    </p>
                </div>
            </div>
        </Card>
    )
}

export default function Achievements({
    student,
    stats: dashboardStats,
    earned_achievements = [],
    completed_courses = [],
    assignment_results = [],
    quiz_results = [],
    transcript_url,
}: Props) {
    const [transcriptLoading, setTranscriptLoading] = useState(false)
    const [certificateLoading, setCertificateLoading] = useState<number | null>(null)

    const totalPoints = Number(dashboardStats.points?.total ?? 0)
    const courseCount = completed_courses.length
    const assignmentCount = assignment_results.length
    const quizCount = quiz_results.length

    const handleTranscriptDownload = async () => {
        if (transcriptLoading) return

        setTranscriptLoading(true)

        try {
            await downloadPdf(
                transcript_url,
                'learn-with-flevian-academic-transcript.pdf',
            )
        } catch (error) {
            console.error('Transcript download failed:', error)

            window.alert(
                'The transcript could not be downloaded. Please try again.',
            )
        } finally {
            setTranscriptLoading(false)
        }
    }

    const handleCertificateDownload = async (
        course: CourseItem,
    ) => {
        if (certificateLoading !== null) return

        setCertificateLoading(course.id)

        try {
            await downloadPdf(
                course.certificate_url,
                `${(course.title ?? 'Learn With Flevian Certificate')
                    .replace(/[^a-z0-9]+/gi, '-')
                    .replace(/^-+|-+$/g, '')
                    .toLowerCase()}-certificate.pdf`,
            )
        } catch (error) {
            console.error('Certificate download failed:', error)

            window.alert(
                'The certificate could not be downloaded. Please try again.',
            )
        } finally {
            setCertificateLoading(null)
        }
    }

    return (
        <StudentLayout
            student={student}
            stats={dashboardStats}
            title="Achievements"
        >
            <Head title="Achievements" />

            <div className="w-full px-4 py-4 sm:px-5 lg:px-6">
                {/* Header */}
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#1554c0] dark:text-[#6ba3ff]">
                            Your record
                        </p>

                        <h1 className="mt-0.5 text-2xl font-bold tracking-[-0.03em] text-slate-950 dark:text-white">
                            Achievements & certificates
                        </h1>

                        <p className="mt-0.5 max-w-2xl text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                            Everything you have earned from your courses,
                            assignments, quizzes and learning milestones.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleTranscriptDownload}
                        disabled={transcriptLoading}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#1554c0] px-3.5 py-2 text-[10px] font-bold text-white shadow-sm transition hover:bg-[#1249a8] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {transcriptLoading ? (
                            <>
                                <DownloadSpinner />
                                Preparing PDF...
                            </>
                        ) : (
                            <>
                                <Icon
                                    name="arrow"
                                    className="h-3.5 w-3.5 rotate-90"
                                />
                                Download detailed transcript
                            </>
                        )}
                    </button>
                </div>

                {/* Summary */}
                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        [
                            'trophy',
                            'Achievements',
                            earned_achievements.length,
                            'earned',
                        ],
                        [
                            'book',
                            'Courses completed',
                            courseCount,
                            'certificates available',
                        ],
                        [
                            'assignment',
                            'Assignments graded',
                            assignmentCount,
                            'official results',
                        ],
                        [
                            'quiz',
                            'Quizzes passed',
                            quizCount,
                            `${totalPoints} total points`,
                        ],
                    ].map(([icon, label, value, detail]) => (
                        <Card key={label} className="p-3.5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#8bb8ff]">
                                    <Icon
                                        name={icon as any}
                                        className="h-4 w-4"
                                    />
                                </div>

                                <div className="min-w-0">
                                    <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-slate-400">
                                        {label}
                                    </p>

                                    <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">
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
                    {/* Left */}
                    <div className="min-w-0 space-y-4">
                        {/* Achievements */}
                        <section>
                            <SectionHeader
                                title="Earned achievements"
                                description="Milestones already recorded on your student account."
                            />

                            {earned_achievements.length ? (
                                <div className="grid gap-2.5 sm:grid-cols-2">
                                    {earned_achievements.map((item) => (
                                        <AchievementCard
                                            key={item.id}
                                            item={item}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon="trophy"
                                    title="No achievements yet"
                                    description="Complete your first learning activities and your achievements will appear here automatically."
                                />
                            )}
                        </section>

                        {/* Course completions */}
                        <section>
                            <SectionHeader
                                title="Course completions"
                                description="Certificates become available automatically when an administrator marks a course completed."
                            />

                            {completed_courses.length ? (
                                <div className="space-y-2.5">
                                    {completed_courses.map((course) => (
                                        <Card
                                            key={course.id}
                                            className="overflow-hidden p-0"
                                        >
                                            <div className="flex items-center gap-3 p-3.5">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#8bb8ff]">
                                                    <Icon
                                                        name="check"
                                                        className="h-4 w-4"
                                                    />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                                                        {course.title ??
                                                            'Completed course'}
                                                    </h3>

                                                    <p className="mt-0.5 text-[9px] text-slate-500 dark:text-slate-400">
                                                        Completed{' '}
                                                        {date(
                                                            course.completed_at,
                                                        )}
                                                    </p>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleCertificateDownload(
                                                            course,
                                                        )
                                                    }
                                                    disabled={
                                                        certificateLoading !==
                                                        null
                                                    }
                                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#1554c0] px-3 py-2 text-[9px] font-bold text-white transition hover:bg-[#1249a8] disabled:cursor-not-allowed disabled:opacity-70"
                                                >
                                                    {certificateLoading ===
                                                    course.id ? (
                                                        <>
                                                            <DownloadSpinner />
                                                            Preparing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Icon
                                                                name="arrow"
                                                                className="h-3 w-3 rotate-90"
                                                            />
                                                            Certificate
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon="book"
                                    title="No completed courses yet"
                                    description="When an administrator records a course as completed, its certificate will appear here automatically."
                                />
                            )}
                        </section>

                        {/* Quiz results */}
                        <section>
                            <SectionHeader
                                title="Quiz results"
                                description="Only server-graded passed quizzes are included here."
                            />

                            {quiz_results.length ? (
                                <div className="space-y-2">
                                    {quiz_results.map((quiz) => (
                                        <Card
                                            key={quiz.id}
                                            className="p-3.5"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                    <Icon
                                                        name="quiz"
                                                        className="h-3.5 w-3.5"
                                                    />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[11px] font-bold text-slate-900 dark:text-white">
                                                        {quiz.title}
                                                    </p>

                                                    <p className="mt-0.5 text-[9px] text-slate-400">
                                                        {quiz.course ??
                                                            'Course'}{' '}
                                                        · Passed{' '}
                                                        {date(
                                                            quiz.passed_at,
                                                        )}
                                                    </p>
                                                </div>

                                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                    {quiz.percentage !== null
                                                        ? `${quiz.percentage}%`
                                                        : 'Passed'}
                                                </span>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon="quiz"
                                    title="No passed quizzes yet"
                                    description="Passed, server-graded quizzes will be listed here."
                                />
                            )}
                        </section>

                        {/* Assignment results */}
                        <section>
                            <SectionHeader
                                title="Assignment results"
                                description="Graded assignment results recorded by the LMS."
                            />

                            {assignment_results.length ? (
                                <div className="space-y-2">
                                    {assignment_results.map((item) => (
                                        <Card
                                            key={item.id}
                                            className="p-3.5"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#8bb8ff]">
                                                    <Icon
                                                        name="assignment"
                                                        className="h-3.5 w-3.5"
                                                    />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[11px] font-bold text-slate-900 dark:text-white">
                                                        {item.title}
                                                    </p>

                                                    <p className="mt-0.5 text-[9px] text-slate-400">
                                                        {item.course ??
                                                            'Course'}{' '}
                                                        · Graded{' '}
                                                        {date(
                                                            item.graded_at,
                                                        )}
                                                    </p>
                                                </div>

                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                                                        {item.score ?? '—'} /{' '}
                                                        {item.max_points}
                                                    </p>

                                                    <p className="text-[8px] text-slate-400">
                                                        {item.percentage !==
                                                        null
                                                            ? `${item.percentage}%`
                                                            : 'Result'}
                                                    </p>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon="assignment"
                                    title="No graded assignments yet"
                                    description="Once an assigned submission is graded, its official result will appear here."
                                />
                            )}
                        </section>
                    </div>

                    {/* Right */}
                    <aside className="min-w-0 space-y-3">
                        {/* Certificates */}
                        <Card className="p-4">
                            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                Certificates
                            </p>

                            <h2 className="mt-0.5 text-base font-bold tracking-[-0.02em] text-slate-900 dark:text-white">
                                Your completed courses
                            </h2>

                            <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
                                Certificates use the official completion date
                                recorded on your enrollment.
                            </p>

                            <div className="mt-3 rounded-xl bg-gradient-to-r from-[#edf4ff] to-[#f7f4ff] p-3 dark:from-[#121e33] dark:to-[#18152f]">
                                <div className="flex items-center gap-3">
                                    <Icon
                                        name="trophy"
                                        className="h-5 w-5 text-[#1554c0] dark:text-[#8bb8ff]"
                                    />

                                    <div>
                                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                                            {courseCount} certificate
                                            {courseCount === 1 ? '' : 's'}
                                        </p>

                                        <p className="text-[9px] text-slate-400">
                                            Available to download
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <p className="mt-3 text-[9px] leading-4 text-slate-400">
                                Certificates are generated from the LMS record
                                and are available only for officially completed
                                courses.
                            </p>
                        </Card>

                        {/* Transcript */}
                        <Card className="p-4">
                            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                Official record
                            </p>

                            <h2 className="mt-0.5 text-base font-bold tracking-[-0.02em] text-slate-900 dark:text-white">
                                Detailed transcript
                            </h2>

                            <div className="mt-3 space-y-1.5">
                                {[
                                    ['Courses', courseCount],
                                    ['Assignments', assignmentCount],
                                    ['Passed quizzes', quizCount],
                                    [
                                        'Achievements',
                                        earned_achievements.length,
                                    ],
                                    ['Points', totalPoints],
                                ].map(([label, value]) => (
                                    <div
                                        key={label}
                                        className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/70"
                                    >
                                        <span className="text-[9px] text-slate-500 dark:text-slate-400">
                                            {label}
                                        </span>

                                        <span className="text-[10px] font-bold text-slate-900 dark:text-white">
                                            {value}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={handleTranscriptDownload}
                                disabled={transcriptLoading}
                                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-[9px] font-bold text-slate-700 transition hover:border-[#1554c0] hover:text-[#1554c0] disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:text-slate-200 dark:hover:border-[#6ba3ff] dark:hover:text-[#8bb8ff]"
                            >
                                {transcriptLoading ? (
                                    <>
                                        <DownloadSpinner />
                                        Preparing PDF...
                                    </>
                                ) : (
                                    <>
                                        <Icon
                                            name="arrow"
                                            className="h-3.5 w-3.5 rotate-90"
                                        />
                                        Download transcript
                                    </>
                                )}
                            </button>
                        </Card>

                        {/* How it works */}
                        <Card className="p-4">
                            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                How it works
                            </p>

                            <div className="mt-3 space-y-2.5">
                                {[
                                    [
                                        'trophy',
                                        'Achievements',
                                        'Earned milestones are pulled from your official achievement records.',
                                    ],
                                    [
                                        'check',
                                        'Course completion',
                                        'Administrators control the official completed status of a course.',
                                    ],
                                    [
                                        'quiz',
                                        'Quiz results',
                                        'Only server-graded passed attempts are shown as passed.',
                                    ],
                                ].map(([icon, title, description]) => (
                                    <div
                                        key={title}
                                        className="flex gap-2.5"
                                    >
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#8bb8ff]">
                                            <Icon
                                                name={icon as any}
                                                className="h-3.5 w-3.5"
                                            />
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
                    </aside>
                </div>
            </div>
        </StudentLayout>
    )
}