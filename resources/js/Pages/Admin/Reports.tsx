import { Head, Link, router } from '@inertiajs/react'
import AdminLayout from '../../Components/AdminLayout'
import { Avatar, MiniIcon } from '../../Components/AdminPremiumUI'
import { assetUrl } from '../../Components/StudentUI'

type CourseRow = {
    course: string
    thumbnail_path?: string | null
    total: number
    completed: number
    accessible: number
    active_access: number
    pending_access: number
    completion_percent: number
    access_percent: number
}

type TrendPoint = {
    date: string
    label: string
    enrollments: number
    completions: number
    quiz_attempts: number
}

type Props = {
    admin: any
    period: { days: number }
    audit: any
    learning: any
}

const pct = (value: number, total: number) => total ? Math.round((value / total) * 100) : 0

function Donut({ authenticated, guest, center, label }: { authenticated: number; guest: number; center: string; label: string }) {
    const total = Math.max(authenticated + guest, 1)
    const radius = 42
    const circumference = 2 * Math.PI * radius
    const authLength = (authenticated / total) * circumference
    const guestLength = (guest / total) * circumference

    return <div className="relative h-[132px] w-[132px] shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r={radius} fill="none" className="stroke-slate-200 dark:stroke-[#1b2940]" strokeWidth="10" />
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#1554c0" strokeWidth="10" strokeDasharray={`${authLength} ${circumference}`} strokeLinecap="round" />
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#a577ff" strokeWidth="10" strokeDasharray={`${guestLength} ${circumference}`} strokeDashoffset={-authLength} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[24px] font-black tracking-tight text-slate-950 dark:text-white">{center}</span>
            <span className="mt-1 max-w-[72px] text-center text-[8px] font-black uppercase leading-[1.15] tracking-[.13em] text-slate-500 dark:text-slate-400">{label}</span>
        </div>
    </div>
}

function PerformanceDonut({ percent }: { percent: number }) {
    const radius = 42
    const circumference = 2 * Math.PI * radius
    const length = (percent / 100) * circumference
    return <div className="relative h-[132px] w-[132px] shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r={radius} fill="none" className="stroke-slate-200 dark:stroke-[#1b2940]" strokeWidth="10" />
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#a577ff" strokeWidth="10" strokeDasharray={`${length} ${circumference}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[21px] font-black tracking-tight text-slate-950 dark:text-white">{percent}%</span>
            <span className="mt-1 max-w-[62px] text-center text-[7px] font-black uppercase leading-[1.15] tracking-[.12em] text-slate-500 dark:text-slate-400">overall completion</span>
        </div>
    </div>
}

function LineChart({ data }: { data: TrendPoint[] }) {
    const width = 620
    const height = 180
    const left = 34
    const right = 10
    const top = 12
    const bottom = 28
    const innerW = width - left - right
    const innerH = height - top - bottom
    const maxValue = Math.max(10, ...data.flatMap(point => [point.enrollments, point.completions, point.quiz_attempts]))
    const x = (index: number) => left + (data.length <= 1 ? innerW / 2 : (index / (data.length - 1)) * innerW)
    const y = (value: number) => top + innerH - (value / maxValue) * innerH
    const points = (key: keyof Pick<TrendPoint, 'enrollments' | 'completions' | 'quiz_attempts'>) => data.map((point, index) => `${x(index)},${y(point[key])}`).join(' ')
    const tickIndexes = data.length ? [0, Math.floor((data.length - 1) * .25), Math.floor((data.length - 1) * .5), Math.floor((data.length - 1) * .75), data.length - 1].filter((value, index, array) => array.indexOf(value) === index) : []

    return <div className="mt-3 w-full overflow-hidden">
        <div className="mb-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[9px] font-semibold text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-[#a577ff]" />Enrollments</span>
            <span className="inline-flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-[#19c37d]" />Completions</span>
            <span className="inline-flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-[#246bdb]" />Quiz Attempts</span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[190px] w-full">
            {[0, 2, 4, 6, 8, 10].map(tick => {
                const value = Math.min(tick, maxValue)
                return <g key={tick}>
                    <line x1={left} x2={width - right} y1={y(value)} y2={y(value)} className="stroke-slate-200 dark:stroke-[#17243a]" strokeWidth="1" />
                    <text x={left - 8} y={y(value) + 3} textAnchor="end" className="fill-slate-400 dark:fill-slate-500" fontSize="8">{value}</text>
                </g>
            })}
            {data.length > 0 && <>
                <polyline points={points('enrollments')} fill="none" stroke="#a577ff" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                <polyline points={points('completions')} fill="none" stroke="#19c37d" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                <polyline points={points('quiz_attempts')} fill="none" stroke="#246bdb" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            </>}
            {tickIndexes.map(index => <text key={index} x={x(index)} y={height - 7} textAnchor="middle" className="fill-slate-400 dark:fill-slate-500" fontSize="8">{data[index]?.label}</text>)}
        </svg>
    </div>
}

function StatCard({ icon, label, value, detail, tone = 'blue' }: { icon: string; label: string; value: string | number; detail: string; tone?: 'blue' | 'green' | 'orange' | 'purple' | 'pink' }) {
    const tones = {
        blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        orange: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        purple: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
        pink: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400',
    }
    return <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-3 shadow-[0_12px_28px_rgba(23,32,51,.05)] dark:border-[#17243a] dark:bg-[#10192a] dark:shadow-[0_12px_28px_rgba(0,0,0,.12)]">
        <div className="flex items-start gap-2.5">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}><MiniIcon name={icon} className="h-4 w-4" /></div>
            <div className="min-w-0">
                <p className="text-[7px] font-black uppercase tracking-[.12em] text-slate-400 dark:text-slate-500">{label}</p>
                <p className="mt-1 text-[19px] font-black leading-none tracking-tight text-slate-950 dark:text-white">{value}</p>
                <p className="mt-1 text-[8px] font-semibold text-emerald-600 dark:text-emerald-400">{detail}</p>
            </div>
        </div>
    </div>
}

const panel = 'rounded-xl border border-slate-200/80 bg-white shadow-[0_14px_36px_rgba(23,32,51,.05)] dark:border-[#17243a] dark:bg-[#10192a] dark:shadow-[0_14px_36px_rgba(0,0,0,.12)]'
const subPanel = 'rounded-lg border border-slate-200/80 bg-slate-50/80 dark:border-[#1b2940] dark:bg-[#101827]'

export default function Reports({ admin, period, audit, learning }: Props) {
    const loadPeriod = (days: number) => router.get(`/admin/reports?days=${days}`, {}, { preserveState: true, preserveScroll: true, replace: true })
    const totalTraffic = Number(audit.summary.total_page_views ?? 0)
    const authenticated = Number(audit.summary.authenticated_page_views ?? 0)
    const guest = Number(audit.summary.guest_page_views ?? 0)
    const passedRate = pct(learning.quizzes.passed, learning.quizzes.attempts)
    const activity = learning.activity_trend ?? []
    const recent = learning.recent_activity ?? audit.recent_activity ?? []
    const completionRate = pct(learning.enrollments.completed, learning.enrollments.total)
    const leaderboard = learning.achievement_leaderboard ?? []
    const assignmentPerformance = learning.assignment_performance ?? []
    const quizPerformance = learning.quiz_performance ?? []

    return <>
        <Head title="Reports · Administration" />
        <AdminLayout admin={admin} title="Reports">
            <div className="min-h-full bg-transparent px-1 py-1 text-slate-900 dark:text-white">
                <div className="space-y-4 pb-10">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#1554c0] dark:text-blue-400">Academic insights</p>
                            <h1 className="mt-1 text-[25px] font-black leading-none tracking-tight text-slate-950 dark:text-white">Reports</h1>
                            <p className="mt-2 text-[9px] text-slate-500 dark:text-slate-400">Comprehensive analytics and performance insights across the Learn With Flevian platform.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <select value={period.days} onChange={event => loadPeriod(Number(event.target.value))} className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-[9px] font-semibold text-slate-600 outline-none dark:border-[#22304a] dark:bg-[#10192a] dark:text-slate-300">
                                {[7, 30, 90].map(days => <option key={days} value={days}>{days} days</option>)}
                            </select>
                            <a href={`/admin/reports/export?days=${period.days}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#5833c7] px-3 text-[9px] font-black text-white shadow-[0_8px_22px_rgba(88,51,199,.3)] hover:bg-[#6840dc]"><MiniIcon name="download" className="h-3.5 w-3.5" />Export PDF</a>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 xl:grid-cols-6">
                        <StatCard icon="users" label="Total learners" value={learning.inventory.students} detail={`+${learning.period?.students_added ?? 0} this period`} tone="purple" />
                        <StatCard icon="book" label="Enrollments" value={learning.enrollments.total} detail={`+${learning.period?.enrollments_added ?? 0} this period`} tone="blue" />
                        <StatCard icon="check" label="Completions" value={learning.enrollments.completed} detail={`+${learning.period?.completions_added ?? 0} this period`} tone="green" />
                        <StatCard icon="assignment" label="Assignments" value={learning.assignments.total} detail={`${learning.assignments.pending} pending marking`} tone="orange" />
                        <StatCard icon="chart" label="Quiz attempts" value={learning.quizzes.attempts} detail={`${learning.quizzes.passed} passed (${passedRate}%)`} tone="purple" />
                        <StatCard icon="trophy" label="Achievements" value={learning.achievements.awarded} detail={`${learning.achievements.points} points awarded`} tone="pink" />
                    </div>

                    <section className={panel + ' overflow-hidden'}>
                        <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2.5 dark:border-[#17243a]">
                            <div><h2 className="text-[11px] font-black text-slate-900 dark:text-white">Course enrollment & completion</h2><p className="mt-0.5 text-[8px] text-slate-500 dark:text-slate-500">Courses with the highest enrollment and completion activity.</p></div>
                            <Link href="/admin/courses" className="rounded-md border border-[#1554c0]/20 bg-blue-500/5 px-2.5 py-1.5 text-[8px] font-bold text-[#1554c0] hover:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-400">View all courses</Link>
                        </div>
                        <div className="overflow-x-auto">
                            <div className="min-w-[780px]">
                                <div className="grid grid-cols-[2fr_1.15fr_1.15fr_1.15fr_1.15fr] gap-4 bg-slate-50 px-3 py-2 text-[7px] font-black uppercase tracking-[.09em] text-slate-500 dark:bg-[#142137] dark:text-slate-500">
                                    <span>Course</span><span>Enrolled</span><span>Completed</span><span>Access granted</span><span>Completion rate</span>
                                </div>
                                {learning.course_breakdown.map((item: CourseRow) => <div key={item.course} className="grid grid-cols-[2fr_1.15fr_1.15fr_1.15fr_1.15fr] items-center gap-4 border-t border-slate-100 px-3 py-2.5 dark:border-[#17243a]">
                                    <div className="flex min-w-0 items-center gap-2">
                                        {assetUrl(item.thumbnail_path) ? <img src={assetUrl(item.thumbnail_path) ?? ''} alt="" className="h-7 w-10 shrink-0 rounded-md object-cover ring-1 ring-slate-200 dark:ring-slate-700" /> : <div className="flex h-7 w-10 shrink-0 items-center justify-center rounded-md bg-blue-50 text-[8px] font-black text-[#1554c0] dark:bg-[#172945] dark:text-blue-400"><MiniIcon name="book" className="h-3.5 w-3.5" /></div>}
                                        <span className="truncate text-[9px] font-bold text-slate-800 dark:text-slate-200">{item.course}</span>
                                    </div>
                                    <MetricBar value={item.total} percent={100} tone="purple" />
                                    <MetricBar value={item.completed} percent={item.completion_percent} tone="green" />
                                    <MetricBar value={item.accessible} percent={item.access_percent} tone="blue" />
                                    <MetricBar value={`${item.completion_percent}%`} percent={item.completion_percent} tone="purple" />
                                </div>)}
                                {!learning.course_breakdown.length && <div className="px-3 py-10 text-center text-[9px] text-slate-500">No course enrollment data available.</div>}
                            </div>
                        </div>
                    </section>

                    <div className="grid gap-3 xl:grid-cols-[1.05fr_1fr_.78fr]">
                        <section className={panel + ' overflow-hidden'}>
                            <div className="border-b border-slate-200 px-3 py-2.5 dark:border-[#17243a]"><h2 className="text-[11px] font-black text-slate-900 dark:text-white">Platform performance</h2><p className="mt-0.5 text-[8px] text-slate-500">Current overview of learning activities.</p></div>
                            <div className="grid gap-3 p-3 sm:grid-cols-[130px_1fr]">
                                <div className="flex items-center justify-center"><PerformanceDonut percent={completionRate} /></div>
                                <div className="grid grid-cols-2 gap-2">
                                    <MiniMetric label="Assignments" value={learning.assignments.submissions} detail={`${learning.assignments.pending} awaiting marking`} />
                                    <MiniMetric label="Quiz attempts" value={learning.quizzes.attempts} detail={`${learning.quizzes.passed} passed`} />
                                    <div className={`col-span-2 ${subPanel} px-3 py-2`}><p className="text-[7px] font-black uppercase tracking-[.1em] text-slate-500">Submitted quizzes</p><div className="mt-1 flex items-center justify-between"><span className="text-[9px] text-slate-500 dark:text-slate-400">{learning.quizzes.submitted} of {learning.quizzes.attempts} attempts submitted</span><b className="text-[9px] text-blue-600 dark:text-blue-400">{quizSubmissionRate(learning.quizzes.submitted, learning.quizzes.attempts)}%</b></div><div className="mt-2 h-1.5 rounded-full bg-slate-200 dark:bg-[#1b2940]"><div className="h-full rounded-full bg-[#246bdb]" style={{ width: `${pct(learning.quizzes.submitted, learning.quizzes.attempts)}%` }} /></div></div>
                                </div>
                            </div>
                        </section>

                        <section className={panel + ' overflow-hidden'}>
                            <div className="border-b border-slate-200 px-3 py-2.5 dark:border-[#17243a]"><h2 className="text-[11px] font-black text-slate-900 dark:text-white">Activity trend</h2><p className="mt-0.5 text-[8px] text-slate-500">Last {period.days} days overview</p></div>
                            <div className="px-2 pb-1"><LineChart data={activity} /></div>
                        </section>

                        <section className={panel + ' overflow-hidden'}>
                            <div className="border-b border-slate-200 px-3 py-2.5 dark:border-[#17243a]"><h2 className="text-[11px] font-black text-slate-900 dark:text-white">Traffic overview</h2><p className="mt-0.5 text-[8px] text-slate-500">Last {period.days} days</p></div>
                            <div className="flex justify-center px-3 py-3"><Donut authenticated={authenticated} guest={guest} center={totalTraffic.toLocaleString()} label="page views" /></div>
                            <div className="grid grid-cols-2 gap-2 px-3 pb-3"><TrafficStat label="Authenticated" value={authenticated} percent={pct(authenticated, totalTraffic)} tone="blue" /><TrafficStat label="Guest" value={guest} percent={pct(guest, totalTraffic)} tone="purple" /></div>
                        </section>
                    </div>

                    <div className="grid gap-3 xl:grid-cols-3">
                        <section className={panel + ' overflow-hidden'}>
                            <div className="border-b border-slate-200 px-3 py-2.5 dark:border-[#17243a]"><p className="text-[7px] font-black uppercase tracking-[.12em] text-violet-500 dark:text-violet-400">Recognition</p><h2 className="mt-0.5 text-[11px] font-black text-slate-900 dark:text-white">Achievement leaderboard</h2><p className="mt-0.5 text-[8px] text-slate-500">Highest award points recorded.</p></div>
                            <div className="divide-y divide-slate-100 dark:divide-[#17243a]">
                                {leaderboard.map((student: any, index: number) => <div key={student.user_id} className="flex items-center gap-2.5 px-3 py-2.5"><span className="w-4 text-center text-[9px] font-black text-slate-400">{index + 1}</span><Avatar name={student.name} path={student.avatar_path} size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-[9px] font-bold text-slate-800 dark:text-slate-200">{student.name}</p><p className="text-[7px] text-slate-500">{student.awards} achievement{student.awards === 1 ? '' : 's'}</p></div><div className="text-right"><p className="text-[10px] font-black text-violet-600 dark:text-violet-400">{student.points} pts</p></div></div>)}
                                {!leaderboard.length && <div className="px-3 py-8 text-center text-[9px] text-slate-500">No achievement awards recorded yet.</div>}
                            </div>
                        </section>

                        <section className={panel + ' overflow-hidden'}>
                            <div className="border-b border-slate-200 px-3 py-2.5 dark:border-[#17243a]"><p className="text-[7px] font-black uppercase tracking-[.12em] text-amber-600 dark:text-amber-400">Assessment</p><h2 className="mt-0.5 text-[11px] font-black text-slate-900 dark:text-white">Assignment performance</h2><p className="mt-0.5 text-[8px] text-slate-500">Top graded submission averages.</p></div>
                            <div className="divide-y divide-slate-100 dark:divide-[#17243a]">
                                {assignmentPerformance.map((student: any) => <div key={student.user_id} className="flex items-center gap-2.5 px-3 py-2.5"><Avatar name={student.name} path={student.avatar_path} size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-[9px] font-bold text-slate-800 dark:text-slate-200">{student.name}</p><p className="text-[7px] text-slate-500">{student.graded} graded submission{student.graded === 1 ? '' : 's'}</p></div><div className="w-20"><div className="flex justify-between text-[7px] font-bold"><span className="text-slate-400">Avg</span><span className="text-amber-600 dark:text-amber-400">{student.average_percent}%</span></div><div className="mt-1 h-1 rounded-full bg-slate-200 dark:bg-[#1b2940]"><div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.min(100, Math.max(0, student.average_percent))}%` }} /></div></div></div>)}
                                {!assignmentPerformance.length && <div className="px-3 py-8 text-center text-[9px] text-slate-500">No graded assignment submissions yet.</div>}
                            </div>
                        </section>

                        <section className={panel + ' overflow-hidden'}>
                            <div className="border-b border-slate-200 px-3 py-2.5 dark:border-[#17243a]"><p className="text-[7px] font-black uppercase tracking-[.12em] text-blue-600 dark:text-blue-400">Assessment</p><h2 className="mt-0.5 text-[11px] font-black text-slate-900 dark:text-white">Quiz performance</h2><p className="mt-0.5 text-[8px] text-slate-500">Top graded quiz averages.</p></div>
                            <div className="divide-y divide-slate-100 dark:divide-[#17243a]">
                                {quizPerformance.map((student: any) => <div key={student.user_id} className="flex items-center gap-2.5 px-3 py-2.5"><Avatar name={student.name} path={student.avatar_path} size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-[9px] font-bold text-slate-800 dark:text-slate-200">{student.name}</p><p className="text-[7px] text-slate-500">{student.attempts} attempt{student.attempts === 1 ? '' : 's'} · {student.passed} passed</p></div><div className="w-20"><div className="flex justify-between text-[7px] font-bold"><span className="text-slate-400">Avg</span><span className="text-blue-600 dark:text-blue-400">{student.average_percent}%</span></div><div className="mt-1 h-1 rounded-full bg-slate-200 dark:bg-[#1b2940]"><div className="h-full rounded-full bg-[#246bdb]" style={{ width: `${Math.min(100, Math.max(0, student.average_percent))}%` }} /></div></div></div>)}
                                {!quizPerformance.length && <div className="px-3 py-8 text-center text-[9px] text-slate-500">No graded quiz attempts yet.</div>}
                            </div>
                        </section>
                    </div>

                    <section className={panel + ' overflow-hidden'}>
                        <div className="border-b border-slate-200 px-3 py-2.5 dark:border-[#17243a]"><p className="text-[7px] font-black uppercase tracking-[.12em] text-[#1554c0] dark:text-blue-400">System coverage</p><h2 className="mt-0.5 text-[11px] font-black text-slate-900 dark:text-white">Platform health snapshot</h2><p className="mt-0.5 text-[8px] text-slate-500">Live catalogue, access, engagement and finance indicators.</p></div>
                        <div className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-4">
                            <CoverageCard label="Catalogue" value={`${learning.inventory.courses} courses`} detail={`${learning.inventory.published_courses} published · ${learning.inventory.modules} modules · ${learning.inventory.lessons} lessons`} />
                            <CoverageCard label="Access" value={`${learning.enrollments.with_access} granted`} detail={`${learning.enrollments.pending_access} pending · ${learning.enrollments.cancelled} cancelled`} />
                            <CoverageCard label="Engagement" value={`${learning.engagement.average_lesson_progress}% avg progress`} detail={`${learning.engagement.learning_activities} learning activities · ${learning.engagement.lesson_progress_records} progress records`} />
                            <CoverageCard label="Finance" value={`${learning.finance.successful_payments} successful`} detail={`${learning.finance.currency} ${Number(learning.finance.successful_amount).toLocaleString()} collected`} />
                        </div>
                    </section>

                    <section className={panel + ' overflow-hidden'}>
                        <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2.5 dark:border-[#17243a]">
                            <div><h2 className="text-[11px] font-black text-slate-900 dark:text-white">Recent activity</h2><p className="mt-0.5 text-[8px] text-slate-500">Latest platform events</p></div>
                            <a href={`/admin/settings?days=${period.days}`} className="rounded-md border border-[#1554c0]/20 bg-blue-500/5 px-2.5 py-1.5 text-[8px] font-bold text-[#1554c0] hover:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-400">View all activity</a>
                        </div>
                        <div className="overflow-x-auto">
                            <div className="min-w-[700px]">
                                <div className="grid grid-cols-[.8fr_2fr_1.25fr_2fr_1.25fr] gap-4 bg-slate-50 px-3 py-2 text-[7px] font-black uppercase tracking-[.09em] text-slate-500 dark:bg-[#142137]">
                                    <span>Type</span><span>Description</span><span>User</span><span>Course / Item</span><span>Date</span>
                                </div>
                                {recent.slice(0, 8).map((item: any) => <div key={item.id} className="grid grid-cols-[.8fr_2fr_1.25fr_2fr_1.25fr] gap-4 border-t border-slate-100 px-3 py-2 text-[8px] text-slate-500 dark:border-[#17243a] dark:text-slate-400"><span><EventBadge event={item.event_type} /></span><span className="truncate text-slate-700 dark:text-slate-300">{item.action || item.event_type?.replaceAll('_', ' ') || 'Platform activity'}</span><span className="truncate">{item.user || 'Guest'}</span><span className="truncate">{item.resource_type ? `${item.resource_type}${item.resource_id ? ` #${item.resource_id}` : ''}` : item.route_name || '—'}</span><span>{item.occurred_at || '—'}</span></div>)}
                                {!recent.length && <div className="px-3 py-8 text-center text-[9px] text-slate-500">No recent activity recorded.</div>}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </AdminLayout>
    </>
}

function MetricBar({ value, percent, tone }: { value: number | string; percent: number; tone: 'purple' | 'green' | 'blue' }) {
    const color = tone === 'green' ? 'bg-[#19c37d]' : tone === 'blue' ? 'bg-[#246bdb]' : 'bg-[#a577ff]'
    return <div><div className="text-[8px] text-slate-700 dark:text-slate-300">{value}</div><div className="mt-1 h-1.5 rounded-full bg-slate-200 dark:bg-[#1b2940]"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} /></div></div>
}

function MiniMetric({ label, value, detail }: { label: string; value: number; detail: string }) {
    return <div className={subPanel + ' px-3 py-2'}><p className="text-[7px] font-black uppercase tracking-[.1em] text-slate-500">{label}</p><p className="mt-1 text-[17px] font-black text-slate-950 dark:text-white">{value}</p><p className="mt-0.5 text-[8px] text-slate-500">{detail}</p></div>
}

function CoverageCard({ label, value, detail }: { label: string; value: string; detail: string }) {
    return <div className={subPanel + ' px-3 py-2.5'}><p className="text-[7px] font-black uppercase tracking-[.1em] text-slate-500">{label}</p><p className="mt-1 text-[13px] font-black text-slate-950 dark:text-white">{value}</p><p className="mt-1 text-[8px] leading-4 text-slate-500">{detail}</p></div>
}

function TrafficStat({ label, value, percent, tone }: { label: string; value: number; percent: number; tone: 'blue' | 'purple' }) {
    return <div className={`rounded-lg px-3 py-2 ${tone === 'blue' ? 'bg-blue-50 dark:bg-[#172c4b]' : 'bg-violet-50 dark:bg-[#211d43]'}`}><p className="text-[8px] text-slate-500 dark:text-slate-400">{label}</p><div className="mt-1 flex items-end justify-between gap-2"><b className={`text-[14px] font-black ${tone === 'blue' ? 'text-blue-600 dark:text-blue-400' : 'text-violet-600 dark:text-violet-400'}`}>{value}</b><span className="text-[8px] text-slate-500">{percent}%</span></div></div>
}

function EventBadge({ event }: { event?: string }) {
    const value = (event || 'activity').replaceAll('_', ' ').toUpperCase()
    const tone = event?.includes('quiz') ? 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400' : event?.includes('assignment') ? 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' : event?.includes('enroll') ? 'bg-violet-500/10 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-500/15 dark:text-slate-400'
    return <span className={`inline-flex rounded px-1.5 py-0.5 text-[6px] font-black tracking-[.08em] ${tone}`}>{value}</span>
}

function quizSubmissionRate(submitted: number, attempts: number) {
    return attempts ? Math.round((submitted / attempts) * 100) : 0
}
