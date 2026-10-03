import { useEffect, useMemo, useState } from 'react'
import { Head, Link } from '@inertiajs/react'

import StudentLayout from '../Components/StudentLayout'
import {
    Card,
    Icon,
    assetUrl,
} from '../Components/StudentUI'

import type {
    DashboardStats,
    Student,
} from '../Components/student-types'

/*
|--------------------------------------------------------------------------
| Materials
|--------------------------------------------------------------------------
*/

interface CourseMaterial {
    id: number
    title: string
    description: string | null
    type: string
    url: string | null
    file_path: string | null
    mime_type: string | null
    is_preview: boolean
    position: number
    metadata?: unknown
}

interface LearningLesson {
    id: number
    title: string
    slug: string
    description: string | null
    content: string | null
    type: string
    position: number
    is_preview: boolean
    duration_minutes: number | null
    completed: boolean
    materials: CourseMaterial[]
}

interface LearningModule {
    id: number
    title: string
    description: string | null
    position: number
    is_preview: boolean
    lessons: LearningLesson[]
}

interface LearningCourse {
    id: number
    title: string
    slug: string
    short_description: string | null
    description: string | null
    thumbnail_path: string | null
    level: string | null
    category: string | null
    access_type: string | null
    price: string | number | null
    currency: string | null
    access_level: 'free' | 'full' | 'preview'
    access_granted: boolean
    enrolled: boolean
    total_modules: number
    total_lessons: number
    preview_available: boolean
    modules: LearningModule[]
}

interface CourseLearnPageProps {
    student: Student
    stats: DashboardStats
    course: LearningCourse
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function clampProgress(completed: number, total: number): number {
    if (!total) return 0
    return Math.max(0, Math.min(100, Math.round((completed / total) * 100)))
}

function materialIcon(type: string) {
    const normalized = type.toLowerCase()
    if (normalized.includes('video')) return 'play' as const
    if (normalized.includes('pdf') || normalized.includes('document')) return 'book' as const
    if (normalized.includes('link') || normalized.includes('url')) return 'arrow' as const
    return 'more' as const
}

function formatDuration(minutes: number | null): string {
    if (!minutes) return ''
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const remaining = minutes % 60
    return remaining ? `${hours}h ${remaining}m` : `${hours}h`
}

function youtubeEmbedUrl(value: string | null | undefined): string | null {
    if (!value) return null
    try {
        const url = new URL(value)
        if (url.hostname === 'youtu.be' || url.hostname === 'www.youtu.be') {
            const id = url.pathname.replace(/^\/+/, '')
            return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
        }
        if (
            url.hostname === 'youtube.com' ||
            url.hostname === 'www.youtube.com' ||
            url.hostname === 'm.youtube.com'
        ) {
            if (url.pathname === '/watch') {
                const id = url.searchParams.get('v')
                return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
            }
            if (url.pathname.startsWith('/shorts/')) {
                const id = url.pathname.split('/').filter(Boolean)[1]
                return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
            }
            if (url.pathname.startsWith('/embed/')) return value
        }
    } catch {
        return null
    }
    return null
}

function directVideoUrl(value: string | null | undefined): string | null {
    if (!value) return null
    return /^https?:\/\/.+\.(mp4|webm|ogg)(\?.*)?$/i.test(value) ? value : null
}

function videoSource(
    value: string | null | undefined,
): { kind: 'youtube' | 'file'; url: string } | null {
    const youtube = youtubeEmbedUrl(value)
    if (youtube) return { kind: 'youtube', url: youtube }
    const direct = directVideoUrl(value)
    if (direct) return { kind: 'file', url: direct }
    return null
}

/*
|--------------------------------------------------------------------------
| Material helpers
|--------------------------------------------------------------------------
*/

function materialHref(material: CourseMaterial): string | null {
    if (material.file_path) {
        const resolved = assetUrl(material.file_path)
        if (resolved) return resolved
    }
    if (material.url) return material.url
    return null
}

function materialCanDownload(material: CourseMaterial): boolean {
    // Only local storage files can be force-downloaded. External URLs and
    // remote YouTube links are opened in a new tab instead.
    return !!material.file_path
}

interface MaterialTreeNode {
    id: number
    title: string
    lessons: Array<{
        id: number
        title: string
        materials: CourseMaterial[]
    }>
}

/*
|--------------------------------------------------------------------------
| Materials panel
|--------------------------------------------------------------------------
*/

function MaterialsPanel({
    tree,
    selectedLessonId,
    onSelectLesson,
    variant = 'sidebar',
}: {
    tree: MaterialTreeNode[]
    selectedLessonId: number | null
    onSelectLesson: (id: number) => void
    variant?: 'sidebar' | 'drawer'
}) {
    const total = tree.reduce(
        (sum, m) => sum + m.lessons.reduce((s, l) => s + l.materials.length, 0),
        0,
    )

    return (
        <div
            className={
                variant === 'sidebar'
                    ? 'flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900'
                    : 'flex h-full min-h-0 flex-1 flex-col'
            }
        >
            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-950 dark:text-white">
                            Course materials
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                            {total} {total === 1 ? 'file' : 'files'} ·{' '}
                            {tree.length} {tree.length === 1 ? 'topic' : 'topics'}
                        </p>
                    </div>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#6ba3ff]">
                        <Icon name="book" className="h-4 w-4" />
                    </span>
                </div>
            </div>

            <div
                className={
                    variant === 'sidebar'
                        ? 'max-h-[calc(100vh-195px)] overflow-y-auto p-2'
                        : 'flex-1 overflow-y-auto p-3'
                }
            >
                {tree.map((module) => (
                    <div key={module.id} className="mb-3 last:mb-0">
                        <p className="px-2.5 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                            {module.title}
                        </p>
                        <div className="space-y-2">
                            {module.lessons.map((lesson) => {
                                const active = lesson.id === selectedLessonId
                                return (
                                    <div
                                        key={lesson.id}
                                        className={`overflow-hidden rounded-xl border transition ${
                                            active
                                                ? 'border-[#1554c0]/40 bg-[#f4f8ff] dark:border-[#6ba3ff]/40 dark:bg-[#172945]/70'
                                                : 'border-slate-100 dark:border-slate-800'
                                        }`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => onSelectLesson(lesson.id)}
                                            className="flex w-full items-center gap-2 px-2.5 py-2 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                        >
                                            <span
                                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                                                    active
                                                        ? 'bg-white text-[#1554c0] shadow-sm dark:bg-slate-800 dark:text-[#6ba3ff]'
                                                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                                                }`}
                                            >
                                                <Icon name="play" className="h-3 w-3" />
                                            </span>
                                            <span
                                                className={`min-w-0 flex-1 truncate text-[11px] font-semibold ${
                                                    active
                                                        ? 'text-[#1554c0] dark:text-[#6ba3ff]'
                                                        : 'text-slate-700 dark:text-slate-200'
                                                }`}
                                            >
                                                {lesson.title}
                                            </span>
                                            <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                {lesson.materials.length}
                                            </span>
                                        </button>

                                        <div className="space-y-1 border-t border-slate-100 p-1.5 dark:border-slate-800">
                                            {lesson.materials.map((material) => {
                                                const href = materialHref(material)
                                                const canDownload = materialCanDownload(material)
                                                return (
                                                    <div
                                                        key={material.id}
                                                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                                    >
                                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-[#1554c0] ring-1 ring-slate-100 dark:bg-slate-900 dark:text-[#6ba3ff] dark:ring-slate-800">
                                                            <Icon
                                                                name={materialIcon(material.type)}
                                                                className="h-3 w-3"
                                                            />
                                                        </span>
                                                        <span className="min-w-0 flex-1">
                                                            <span className="block truncate text-[10px] font-medium text-slate-700 dark:text-slate-300">
                                                                {material.title}
                                                            </span>
                                                            <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                                                {material.type}
                                                            </span>
                                                        </span>

                                                        {href ? (
                                                            <span className="flex shrink-0 items-center gap-0.5">
                                                                <a
                                                                    href={href}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="rounded-md p-1 text-slate-400 transition hover:bg-white hover:text-[#1554c0] dark:hover:bg-slate-900 dark:hover:text-[#6ba3ff]"
                                                                    title="View"
                                                                >
                                                                    <Icon name="eye" className="h-3 w-3" />
                                                                </a>
                                                                {canDownload ? (
                                                                    <a
                                                                        href={href}
                                                                        download
                                                                        className="rounded-md p-1 text-slate-400 transition hover:bg-white hover:text-[#1554c0] dark:hover:bg-slate-900 dark:hover:text-[#6ba3ff]"
                                                                        title="Download"
                                                                    >
                                                                        <Icon
                                                                            name="download"
                                                                            className="h-3 w-3"
                                                                        />
                                                                    </a>
                                                                ) : null}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

export default function CourseLearn({
    student,
    stats,
    course,
}: CourseLearnPageProps) {
    const modules = course.modules ?? []

    const lessons = useMemo(
        () =>
            modules.flatMap((module) =>
                module.lessons.map((lesson) => ({
                    ...lesson,
                    moduleId: module.id,
                    moduleTitle: module.title,
                })),
            ),
        [modules],
    )

    const initialLesson =
        lessons.find((lesson) => !lesson.completed) ?? lessons[0] ?? null

    const [selectedLessonId, setSelectedLessonId] = useState<number | null>(
        initialLesson?.id ?? null,
    )

    const [curriculumOpen, setCurriculumOpen] = useState(false)
    const [materialsOpen, setMaterialsOpen] = useState(false)

    const [expandedModuleIds, setExpandedModuleIds] = useState<Set<number>>(
        () =>
            initialLesson
                ? new Set(
                      modules
                          .filter((module) =>
                              module.lessons.some(
                                  (lesson) => lesson.id === initialLesson.id,
                              ),
                          )
                          .map((module) => module.id),
                  )
                : new Set(),
    )

    useEffect(() => {
        if (
            selectedLessonId !== null &&
            lessons.some((lesson) => lesson.id === selectedLessonId)
        ) {
            return
        }
        setSelectedLessonId(initialLesson?.id ?? null)
    }, [lessons, selectedLessonId, initialLesson?.id])

    const selectedLesson =
        lessons.find((lesson) => lesson.id === selectedLessonId) ?? null

    useEffect(() => {
        if (!selectedLesson) return
        setExpandedModuleIds((current) => {
            if (current.has(selectedLesson.moduleId)) return current
            return new Set([...current, selectedLesson.moduleId])
        })
    }, [selectedLesson?.moduleId])

    const completedLessons = lessons.filter((lesson) => lesson.completed).length
    const progress = clampProgress(
        completedLessons,
        course.total_lessons || lessons.length,
    )

    /*
    |--------------------------------------------------------------------------
    | Materials index (grouped by module → lesson)
    |--------------------------------------------------------------------------
    */

    const materialTree = useMemo<MaterialTreeNode[]>(
        () =>
            modules
                .map((module) => ({
                    id: module.id,
                    title: module.title,
                    lessons: module.lessons
                        .map((lesson) => ({
                            id: lesson.id,
                            title: lesson.title,
                            materials: lesson.materials ?? [],
                        }))
                        .filter((lesson) => lesson.materials.length > 0),
                }))
                .filter((module) => module.lessons.length > 0),
        [modules],
    )

    const totalMaterials = materialTree.reduce(
        (sum, m) => sum + m.lessons.reduce((s, l) => s + l.materials.length, 0),
        0,
    )

    const selectLesson = (lessonId: number) => {
        const lesson = lessons.find((item) => item.id === lessonId)
        setSelectedLessonId(lessonId)
        if (lesson) {
            setExpandedModuleIds((current) =>
                new Set([...current, lesson.moduleId]),
            )
        }
        setCurriculumOpen(false)
        setMaterialsOpen(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <StudentLayout
            student={student}
            stats={stats}
            title={course.title}
            searchCourses={[]}
        >
            <Head title={course.title} />

            <div className="space-y-6">
                {/* ========================================================
                    TOP COURSE BAR
                ======================================================== */}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <Link
                            href="/courses"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1554c0] transition hover:text-[#1048a8] dark:text-[#6ba3ff]"
                        >
                            <Icon name="arrow" className="h-3.5 w-3.5 rotate-180" />
                            Back to courses
                        </Link>

                        <h1 className="mt-2 truncate text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                            {course.title}
                        </h1>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                            {course.category && <span>{course.category}</span>}
                            {course.level && (
                                <>
                                    <span>•</span>
                                    <span>{course.level}</span>
                                </>
                            )}
                            <span>•</span>
                            <span>{course.total_lessons} lessons</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:hidden">
                        <button
                            type="button"
                            onClick={() => setCurriculumOpen(true)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            <Icon name="book" className="h-4 w-4" />
                            Contents
                        </button>
                        {totalMaterials > 0 && (
                            <button
                                type="button"
                                onClick={() => setMaterialsOpen(true)}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                <Icon name="download" className="h-4 w-4" />
                                Materials
                            </button>
                        )}
                    </div>
                </div>

                {/* ========================================================
                    COURSE PROGRESS
                ======================================================== */}

                <Card className="p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#1554c0] dark:text-[#6ba3ff]">
                                Your progress
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                                {completedLessons} of {course.total_lessons} lessons completed
                            </p>
                        </div>
                        <p className="text-2xl font-bold text-[#1554c0] dark:text-[#6ba3ff]">
                            {progress}%
                        </p>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-[#1554c0] to-[#6a5cff] transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </Card>

                {/* ========================================================
                    LEARNING WORKSPACE — 3 columns at xl+
                ======================================================== */}

                <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_300px]">
                    {/* CURRICULUM (left) */}

                    <aside className="hidden lg:block">
                        <div className="sticky top-[105px] max-h-[calc(100vh-125px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                                <p className="text-sm font-bold text-slate-950 dark:text-white">
                                    Course contents
                                </p>
                                <p className="mt-1 text-[10px] text-slate-400">
                                    {course.total_modules} topics
                                    <span className="mx-1">•</span>
                                    {course.total_lessons} lessons
                                </p>
                            </div>

                            <div className="max-h-[calc(100vh-195px)] overflow-y-auto p-2">
                                {modules.map((module, moduleIndex) => {
                                    const expanded = expandedModuleIds.has(module.id)
                                    const moduleActive = module.lessons.some(
                                        (lesson) => lesson.id === selectedLessonId,
                                    )

                                    return (
                                        <div
                                            key={module.id}
                                            className="mb-1 last:mb-0"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (moduleActive) {
                                                        setExpandedModuleIds(
                                                            (current) =>
                                                                new Set([
                                                                    ...current,
                                                                    module.id,
                                                                ]),
                                                        )
                                                        return
                                                    }
                                                    setExpandedModuleIds((current) => {
                                                        const next = new Set(current)
                                                        if (next.has(module.id)) {
                                                            next.delete(module.id)
                                                        } else {
                                                            next.add(module.id)
                                                        }
                                                        return next
                                                    })
                                                }}
                                                aria-expanded={expanded}
                                                className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition ${
                                                    moduleActive
                                                        ? 'bg-[#f4f7fc] dark:bg-slate-800/80'
                                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                                                }`}
                                            >
                                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#edf4ff] text-[10px] font-bold text-[#1554c0] dark:bg-[#172945] dark:text-[#6ba3ff]">
                                                    {moduleIndex + 1}
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span
                                                        className={`block truncate text-xs font-bold ${
                                                            moduleActive
                                                                ? 'text-slate-950 dark:text-white'
                                                                : 'text-slate-800 dark:text-slate-200'
                                                        }`}
                                                    >
                                                        {module.title}
                                                    </span>
                                                    <span className="mt-0.5 block text-[10px] text-slate-400">
                                                        {module.lessons.length}{' '}
                                                        {module.lessons.length === 1
                                                            ? 'lesson'
                                                            : 'lessons'}
                                                    </span>
                                                </span>
                                                <Icon
                                                    name="chevron"
                                                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                                                        expanded ? 'rotate-90' : ''
                                                    }`}
                                                />
                                            </button>

                                            {expanded && (
                                                <div className="ml-4 mt-1 border-l border-slate-200 pl-2 dark:border-slate-700">
                                                    {module.description && (
                                                        <p className="px-3 py-2 text-[10px] leading-4 text-slate-400">
                                                            {module.description}
                                                        </p>
                                                    )}
                                                    <div className="space-y-1">
                                                        {module.lessons.map((lesson) => {
                                                            const active =
                                                                lesson.id === selectedLessonId
                                                            return (
                                                                <button
                                                                    key={lesson.id}
                                                                    type="button"
                                                                    onClick={() =>
                                                                        selectLesson(lesson.id)
                                                                    }
                                                                    aria-current={
                                                                        active ? 'page' : undefined
                                                                    }
                                                                    className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition ${
                                                                        active
                                                                            ? 'bg-[#edf4ff] text-[#1554c0] shadow-sm dark:bg-[#172945] dark:text-[#6ba3ff]'
                                                                            : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                                                                    }`}
                                                                >
                                                                    <span
                                                                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                                                                            lesson.completed
                                                                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                                                : active
                                                                                  ? 'bg-white text-[#1554c0] shadow-sm dark:bg-slate-800 dark:text-[#6ba3ff]'
                                                                                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                                                                        }`}
                                                                    >
                                                                        {lesson.completed ? (
                                                                            <Icon
                                                                                name="check"
                                                                                className="h-3 w-3"
                                                                            />
                                                                        ) : (
                                                                            <Icon
                                                                                name="play"
                                                                                className="h-3 w-3"
                                                                            />
                                                                        )}
                                                                    </span>
                                                                    <span className="min-w-0 flex-1">
                                                                        <span
                                                                            className={`block truncate text-[11px] font-semibold ${
                                                                                active
                                                                                    ? 'text-[#1554c0] dark:text-[#6ba3ff]'
                                                                                    : ''
                                                                            }`}
                                                                        >
                                                                            {lesson.title}
                                                                        </span>
                                                                        {lesson.duration_minutes && (
                                                                            <span className="mt-0.5 block text-[9px] text-slate-400">
                                                                                {formatDuration(
                                                                                    lesson.duration_minutes,
                                                                                )}
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </aside>

                    {/* LESSON VIEWER (center) */}

                    <main className="min-w-0">
                        {selectedLesson ? (
                            <div className="space-y-5">
                                <Card className="overflow-hidden p-0">
                                    <div className="bg-gradient-to-br from-[#10213f] via-[#17366a] to-[#1554c0] px-6 py-7 text-white sm:px-8">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-blue-100">
                                                {selectedLesson.type}
                                            </span>
                                            {selectedLesson.completed && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-200">
                                                    <Icon name="check" className="h-3 w-3" />
                                                    Completed
                                                </span>
                                            )}
                                        </div>

                                        <h2 className="mt-4 max-w-3xl text-2xl font-bold tracking-tight sm:text-3xl">
                                            {selectedLesson.title}
                                        </h2>

                                        {selectedLesson.description && (
                                            <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-100/80">
                                                {selectedLesson.description}
                                            </p>
                                        )}

                                        {selectedLesson.duration_minutes && (
                                            <div className="mt-5 flex items-center gap-2 text-[10px] font-medium text-blue-100/70">
                                                <Icon name="clock" className="h-3.5 w-3.5" />
                                                {formatDuration(
                                                    selectedLesson.duration_minutes,
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-6 sm:p-8">
                                        {selectedLesson.type === 'video' ? (
                                            (() => {
                                                const source = videoSource(
                                                    selectedLesson.content,
                                                )
                                                if (source?.kind === 'youtube') {
                                                    return (
                                                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm dark:border-slate-700">
                                                            <div className="aspect-video w-full">
                                                                <iframe
                                                                    src={source.url}
                                                                    title={selectedLesson.title}
                                                                    className="h-full w-full"
                                                                    loading="lazy"
                                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                                    allowFullScreen
                                                                />
                                                            </div>
                                                        </div>
                                                    )
                                                }
                                                if (source?.kind === 'file') {
                                                    return (
                                                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-sm dark:border-slate-700">
                                                            <video
                                                                className="block w-full"
                                                                controls
                                                                preload="metadata"
                                                                src={source.url}
                                                            >
                                                                Your browser does not support
                                                                embedded video.
                                                            </video>
                                                        </div>
                                                    )
                                                }
                                                return (
                                                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 dark:border-slate-700 dark:bg-slate-900">
                                                        <div className="flex items-start gap-4">
                                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#6ba3ff]">
                                                                <Icon name="play" className="h-5 w-5" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                                                    Video lesson
                                                                </h3>
                                                                <p className="mt-1 text-xs leading-5 text-slate-400">
                                                                    The video source is not
                                                                    available in an embeddable
                                                                    format.
                                                                </p>
                                                                {selectedLesson.content && (
                                                                    <a
                                                                        href={selectedLesson.content}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#1554c0] px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-[#1048a8]"
                                                                    >
                                                                        Open video
                                                                        <Icon
                                                                            name="arrow"
                                                                            className="h-3 w-3"
                                                                        />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })()
                                        ) : selectedLesson.content ? (
                                            <article
                                                className="prose prose-slate max-w-none text-sm leading-7 dark:prose-invert"
                                                dangerouslySetInnerHTML={{
                                                    __html: selectedLesson.content,
                                                }}
                                            />
                                        ) : (
                                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
                                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#6ba3ff]">
                                                    <Icon name="book" className="h-5 w-5" />
                                                </div>
                                                <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
                                                    Lesson content
                                                </h3>
                                                <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400">
                                                    This lesson does not have text content
                                                    yet. Check the learning materials
                                                    below.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                {/* INLINE LESSON MATERIALS */}

                                {selectedLesson.materials.length > 0 && (
                                    <Card className="p-5 sm:p-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#1554c0] dark:text-[#6ba3ff]">
                                                    Lesson resources
                                                </p>
                                                <h3 className="mt-1 text-base font-bold text-slate-950 dark:text-white">
                                                    Materials
                                                </h3>
                                            </div>
                                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                {selectedLesson.materials.length}
                                            </span>
                                        </div>

                                        <div className="mt-4 space-y-2">
                                            {selectedLesson.materials.map((material) => {
                                                const href = materialHref(material)
                                                const canDownload =
                                                    materialCanDownload(material)
                                                const materialVideo =
                                                    material.type === 'video'
                                                        ? videoSource(href)
                                                        : null
                                                const actionLabel =
                                                    material.type === 'pdf'
                                                        ? 'Open PDF'
                                                        : material.type === 'link'
                                                          ? 'Open link'
                                                          : 'Open'

                                                return (
                                                    <div
                                                        key={material.id}
                                                        className="overflow-hidden rounded-xl border border-slate-100 transition hover:border-[#c9d8ef] dark:border-slate-800 dark:hover:border-slate-700"
                                                    >
                                                        {materialVideo && (
                                                            <div className="bg-slate-950">
                                                                {materialVideo.kind ===
                                                                'youtube' ? (
                                                                    <div className="aspect-video w-full">
                                                                        <iframe
                                                                            src={materialVideo.url}
                                                                            title={material.title}
                                                                            className="h-full w-full"
                                                                            loading="lazy"
                                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                                            allowFullScreen
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <video
                                                                        className="block w-full"
                                                                        controls
                                                                        preload="metadata"
                                                                        src={materialVideo.url}
                                                                    />
                                                                )}
                                                            </div>
                                                        )}

                                                        <div className="flex items-center gap-3 p-3">
                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#6ba3ff]">
                                                                <Icon
                                                                    name={materialIcon(
                                                                        material.type,
                                                                    )}
                                                                    className="h-4 w-4"
                                                                />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                                                                    {material.title}
                                                                </p>
                                                                {material.description && (
                                                                    <p className="mt-0.5 truncate text-[10px] text-slate-400">
                                                                        {material.description}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {href ? (
                                                                <div className="flex shrink-0 items-center gap-1">
                                                                    <a
                                                                        href={href}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-[10px] font-semibold text-slate-600 transition hover:bg-[#1554c0] hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-[#4c8dff] dark:hover:text-[#07101f]"
                                                                    >
                                                                        {actionLabel}
                                                                        <Icon
                                                                            name="arrow"
                                                                            className="h-3 w-3"
                                                                        />
                                                                    </a>
                                                                    {canDownload && (
                                                                        <a
                                                                            href={href}
                                                                            download
                                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-[10px] font-semibold text-slate-600 transition hover:bg-[#1554c0] hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-[#4c8dff] dark:hover:text-[#07101f]"
                                                                            title="Download"
                                                                        >
                                                                            <Icon
                                                                                name="download"
                                                                                className="h-3 w-3"
                                                                            />
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-[10px] text-slate-400">
                                                                    Unavailable
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </Card>
                                )}

                                {/* LESSON NAVIGATION */}

                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-[10px] text-slate-400">
                                            Lesson{' '}
                                            {lessons.findIndex(
                                                (lesson) =>
                                                    lesson.id === selectedLesson.id,
                                            ) + 1}{' '}
                                            of {lessons.length}
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        {(() => {
                                            const currentIndex = lessons.findIndex(
                                                (lesson) =>
                                                    lesson.id === selectedLesson.id,
                                            )
                                            const previous =
                                                currentIndex > 0
                                                    ? lessons[currentIndex - 1]
                                                    : null
                                            const next =
                                                currentIndex < lessons.length - 1
                                                    ? lessons[currentIndex + 1]
                                                    : null

                                            return (
                                                <>
                                                    <button
                                                        type="button"
                                                        disabled={!previous}
                                                        onClick={() => {
                                                            if (previous)
                                                                selectLesson(previous.id)
                                                        }}
                                                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                                                    >
                                                        Previous
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={!next}
                                                        onClick={() => {
                                                            if (next) selectLesson(next.id)
                                                        }}
                                                        className="inline-flex items-center gap-2 rounded-xl bg-[#1554c0] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1048a8] disabled:cursor-not-allowed disabled:opacity-40"
                                                    >
                                                        Next lesson
                                                        <Icon
                                                            name="arrow"
                                                            className="h-3.5 w-3.5"
                                                        />
                                                    </button>
                                                </>
                                            )
                                        })()}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Card className="p-10 text-center">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#6ba3ff]">
                                    <Icon name="book" className="h-6 w-6" />
                                </div>
                                <h2 className="mt-4 text-lg font-bold text-slate-950 dark:text-white">
                                    No lesson available
                                </h2>
                                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                                    There are currently no accessible lessons in this
                                    course.
                                </p>
                            </Card>
                        )}
                    </main>

                    {/* MATERIALS SIDEBAR (right, xl+) */}

                    {totalMaterials > 0 && (
                        <aside className="hidden xl:block">
                            <div className="sticky top-[105px]">
                                <MaterialsPanel
                                    tree={materialTree}
                                    selectedLessonId={selectedLessonId}
                                    onSelectLesson={selectLesson}
                                />
                            </div>
                        </aside>
                    )}
                </div>
            </div>

            {/* ================================================================
                MOBILE CURRICULUM DRAWER
            ================================================================ */}

            {curriculumOpen && (
                <div
                    className="fixed inset-0 z-[90] bg-slate-950/50 backdrop-blur-sm lg:hidden"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setCurriculumOpen(false)
                        }
                    }}
                >
                    <div
                        className="absolute inset-y-0 right-0 flex w-[min(360px,92vw)] flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
                        onMouseDown={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                            <div>
                                <p className="text-sm font-bold text-slate-950 dark:text-white">
                                    Course contents
                                </p>
                                <p className="mt-0.5 text-[10px] text-slate-400">
                                    Select a lesson
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCurriculumOpen(false)}
                                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                aria-label="Close course contents"
                            >
                                <Icon name="x" className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3">
                            {modules.map((module, moduleIndex) => {
                                const expanded = expandedModuleIds.has(module.id)
                                const moduleActive = module.lessons.some(
                                    (lesson) => lesson.id === selectedLessonId,
                                )
                                return (
                                    <div
                                        key={module.id}
                                        className="mb-1 last:mb-0"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (moduleActive) {
                                                    setExpandedModuleIds(
                                                        (current) =>
                                                            new Set([
                                                                ...current,
                                                                module.id,
                                                            ]),
                                                    )
                                                    return
                                                }
                                                setExpandedModuleIds((current) => {
                                                    const next = new Set(current)
                                                    if (next.has(module.id)) {
                                                        next.delete(module.id)
                                                    } else {
                                                        next.add(module.id)
                                                    }
                                                    return next
                                                })
                                            }}
                                            aria-expanded={expanded}
                                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left ${
                                                moduleActive
                                                    ? 'bg-[#f4f7fc] dark:bg-slate-800/80'
                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }`}
                                        >
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#edf4ff] text-[10px] font-bold text-[#1554c0] dark:bg-[#172945] dark:text-[#6ba3ff]">
                                                {moduleIndex + 1}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-xs font-bold text-slate-800 dark:text-slate-200">
                                                    {module.title}
                                                </span>
                                                <span className="mt-0.5 block text-[10px] text-slate-400">
                                                    {module.lessons.length}{' '}
                                                    {module.lessons.length === 1
                                                        ? 'lesson'
                                                        : 'lessons'}
                                                </span>
                                            </span>
                                            <Icon
                                                name="chevron"
                                                className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                                                    expanded ? 'rotate-90' : ''
                                                }`}
                                            />
                                        </button>

                                        {expanded && (
                                            <div className="ml-4 mt-1 border-l border-slate-200 pl-2 dark:border-slate-700">
                                                {module.description && (
                                                    <p className="px-3 py-2 text-[10px] leading-4 text-slate-400">
                                                        {module.description}
                                                    </p>
                                                )}
                                                <div className="space-y-1">
                                                    {module.lessons.map((lesson) => {
                                                        const active =
                                                            lesson.id === selectedLessonId
                                                        return (
                                                            <button
                                                                key={lesson.id}
                                                                type="button"
                                                                onClick={() =>
                                                                    selectLesson(lesson.id)
                                                                }
                                                                aria-current={
                                                                    active
                                                                        ? 'page'
                                                                        : undefined
                                                                }
                                                                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left ${
                                                                    active
                                                                        ? 'bg-[#edf4ff] text-[#1554c0] shadow-sm dark:bg-[#172945] dark:text-[#6ba3ff]'
                                                                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                                                                }`}
                                                            >
                                                                <span
                                                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                                                                        lesson.completed
                                                                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                                            : active
                                                                              ? 'bg-white text-[#1554c0] shadow-sm dark:bg-slate-800 dark:text-[#6ba3ff]'
                                                                              : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                                                                    }`}
                                                                >
                                                                    {lesson.completed ? (
                                                                        <Icon
                                                                            name="check"
                                                                            className="h-3.5 w-3.5"
                                                                        />
                                                                    ) : (
                                                                        <Icon
                                                                            name="play"
                                                                            className="h-3.5 w-3.5"
                                                                        />
                                                                    )}
                                                                </span>
                                                                <span className="min-w-0 flex-1">
                                                                    <span className="block truncate text-xs font-semibold">
                                                                        {lesson.title}
                                                                    </span>
                                                                    {lesson.duration_minutes && (
                                                                        <span className="mt-0.5 block text-[9px] text-slate-400">
                                                                            {formatDuration(
                                                                                lesson.duration_minutes,
                                                                            )}
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ================================================================
                MOBILE MATERIALS DRAWER
            ================================================================ */}

            {materialsOpen && totalMaterials > 0 && (
                <div
                    className="fixed inset-0 z-[90] bg-slate-950/50 backdrop-blur-sm xl:hidden"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setMaterialsOpen(false)
                        }
                    }}
                >
                    <div
                        className="absolute inset-y-0 right-0 flex w-[min(360px,92vw)] flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
                        onMouseDown={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                            <div>
                                <p className="text-sm font-bold text-slate-950 dark:text-white">
                                    Course materials
                                </p>
                                <p className="mt-0.5 text-[10px] text-slate-400">
                                    Grouped by topic
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setMaterialsOpen(false)}
                                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                aria-label="Close materials"
                            >
                                <Icon name="x" className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="flex min-h-0 flex-1 flex-col">
                            <MaterialsPanel
                                tree={materialTree}
                                selectedLessonId={selectedLessonId}
                                onSelectLesson={selectLesson}
                                variant="drawer"
                            />
                        </div>
                    </div>
                </div>
            )}
        </StudentLayout>
    )
}