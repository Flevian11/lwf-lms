import { Head, router } from '@inertiajs/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import AdminLayout from '../../Components/AdminLayout'
import {
    AdminSectionHeader,
    MiniIcon,
    Modal,
    PageHero,
    Pill,
    PremiumStat,
    inputClass,
    textareaClass,
} from '../../Components/AdminPremiumUI'

/* ------------------------------------------------------------------ types */

interface AdminUser {
    id: number
    name: string
    email: string
    avatar_path?: string | null
    email_two_factor_enabled?: boolean
}

interface CourseOption {
    id: number
    title: string
    slug: string
    status: string
}

interface MaterialItem {
    id: number
    title: string
    description: string | null
    type: 'pdf' | 'video' | 'link' | 'document' | 'presentation' | 'audio' | 'other'
    url: string | null
    file_path: string | null
    mime_type: string | null
    is_preview: boolean
    position: number
    status: string
    size: number | null
}

interface LessonItem {
    id: number
    title: string
    slug: string
    description: string | null
    content: string | null
    type: 'article' | 'video' | 'document' | 'interactive'
    position: number
    duration_minutes: number | null
    status: 'draft' | 'published'
    published_at: string | null
    materials_count: number
    assignments_count: number
    quizzes_count: number
    materials: MaterialItem[]
}

interface ModuleItem {
    id: number
    title: string
    description: string | null
    position: number
    lessons_count: number
    lessons: LessonItem[]
}

interface PaginationLink {
    url: string | null
    label: string
    active: boolean
}

interface PaginatedModules {
    data: ModuleItem[]
    current_page: number
    last_page: number
    from: number | null
    to: number | null
    total: number
    links: PaginationLink[]
}

interface PageProps {
    admin: AdminUser
    courses: CourseOption[]
    selectedCourse: CourseOption | null
    modules: PaginatedModules
    filters: { course_id: number; search: string }
    stats: { modules: number; lessons: number; published_lessons: number; draft_lessons: number }
    errors?: Record<string, string>
    flash?: { success?: string }
}

type ModuleForm = { title: string; description: string }

type LessonForm = {
    module_id: string
    title: string
    slug: string
    description: string
    content: string
    type: LessonItem['type']
    duration_minutes: string
    status: LessonItem['status']
}

type LocalIconName =
    | 'book'
    | 'search'
    | 'plus'
    | 'chevron-down'
    | 'chevron-right'
    | 'chevron-up'
    | 'edit'
    | 'trash'
    | 'x'
    | 'bold'
    | 'italic'
    | 'underline'
    | 'bullet-list'
    | 'number-list'
    | 'heading'
    | 'link'
    | 'play'
    | 'download'
    | 'eye'

const emptyModule: ModuleForm = { title: '', description: '' }

const emptyLesson: LessonForm = {
    module_id: '',
    title: '',
    slug: '',
    description: '',
    content: '',
    type: 'article',
    duration_minutes: '',
    status: 'draft',
}

/* ------------------------------------------------------------------- icon */

function LocalIcon({ name, className = 'h-4 w-4' }: { name: LocalIconName; className?: string }) {
    const common = {
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
    }

    const paths: Record<LocalIconName, ReactNode> = {
        book: <><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v17H7.5A2.5 2.5 0 0 0 5 21.5v-17Z" {...common} /><path d="M5 18.5A2.5 2.5 0 0 1 7.5 16H20" {...common} /></>,
        search: <><circle cx="10.8" cy="10.8" r="6.8" {...common} /><path d="m16 16 4.5 4.5" {...common} /></>,
        plus: <><path d="M12 5v14" {...common} /><path d="M5 12h14" {...common} /></>,
        'chevron-down': <path d="m6 9 6 6 6-6" {...common} />,
        'chevron-right': <path d="m9 6 6 6-6 6" {...common} />,
        'chevron-up': <path d="m6 15 6-6 6 6" {...common} />,
        edit: <><path d="m4 20 4.2-1 9.8-9.8a2.1 2.1 0 0 0-3-3L5.2 16 4 20Z" {...common} /><path d="m13.5 7.5 3 3" {...common} /></>,
        trash: <><path d="M4 7h16" {...common} /><path d="M9 7V4h6v3M7 7l1 13h8l1-13" {...common} /><path d="M10 11v5M14 11v5" {...common} /></>,
        x: <><path d="m6 6 12 12" {...common} /><path d="m18 6-12 12" {...common} /></>,
        bold: <><path d="M7 5h5a4 4 0 0 1 0 8H7V5Z" {...common} /><path d="M7 13h6a3 3 0 0 1 0 6H7v-6Z" {...common} /></>,
        italic: <><path d="M14 5h-4" {...common} /><path d="M14 19h-4" {...common} /><path d="m13 5-4 14" {...common} /></>,
        underline: <><path d="M7 5v5a5 5 0 0 0 10 0V5" {...common} /><path d="M5 20h14" {...common} /></>,
        'bullet-list': <><path d="M9 6h11M9 12h11M9 18h11" {...common} /><circle cx="4.5" cy="6" r=".8" fill="currentColor" stroke="none" /><circle cx="4.5" cy="12" r=".8" fill="currentColor" stroke="none" /><circle cx="4.5" cy="18" r=".8" fill="currentColor" stroke="none" /></>,
        'number-list': <><path d="M10 6h10M10 12h10M10 18h10" {...common} /><path d="M4 5h1v3M4 8h2M4 11h2l-2 3h2M4 17h2l-2 3h2" {...common} /></>,
        heading: <><path d="M5 5v14M19 5v14M5 12h14" {...common} /><path d="M5 5h3M16 5h3M5 19h3M16 19h3" {...common} /></>,
        link: <><path d="M10 13.5 8.5 15a3.2 3.2 0 0 1-4.5-4.5l3-3a3.2 3.2 0 0 1 4.5 0" {...common} /><path d="m14 10.5 1.5-1.5A3.2 3.2 0 0 1 20 13.5l-3 3a3.2 3.2 0 0 1-4.5 0" {...common} /><path d="m8.5 12.5 7-1" {...common} /></>,
        play: <path d="m9 6 10 6-10 6V6Z" {...common} />,
        download: <><path d="M12 4v12" {...common} /><path d="m7 11 5 5 5-5" {...common} /><path d="M5 20h14" {...common} /></>,
        eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" {...common} /><circle cx="12" cy="12" r="3" {...common} /></>,
    }

    return <svg viewBox="0 0 24 24" className={className} aria-hidden="true">{paths[name]}</svg>
}

/* ---------------------------------------------------------------- helpers */

function slugify(value: string): string {
    return value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-')
}

function lessonTypeTone(type: LessonItem['type']): string {
    if (type === 'video') return 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300'
    if (type === 'document') return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
    if (type === 'interactive') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
    return 'bg-blue-50 text-[#1554c0] dark:bg-blue-500/10 dark:text-[#6ba3ff]'
}

function formatBytes(bytes: number | null | undefined): string {
    if (!bytes) return ''
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unit = 0
    while (size >= 1024 && unit < units.length - 1) {
        size /= 1024
        unit++
    }
    return `${size.toFixed(size >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`
}

function materialPublicUrl(material: MaterialItem): string | null {
    if (material.url) return material.url
    if (material.file_path) return `/storage/${material.file_path}`
    return null
}

function materialPreviewKind(material: MaterialItem): 'video' | 'pdf' | 'image' | null {
    const mime = material.mime_type ?? ''
    if (mime.startsWith('video/')) return 'video'
    if (mime === 'application/pdf') return 'pdf'
    if (mime.startsWith('image/')) return 'image'
    return null
}

function humanizeFilename(value: string): string {
    const name = value
        .split(/[?#]/)[0]                 // drop query/hash
        .split(/[\\/]/).pop() ?? ''       // last path segment
        .replace(/\.[a-z0-9]{1,8}$/i, '') // drop extension

    const cleaned = name
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

    if (!cleaned) return 'Untitled material'

    return cleaned
        .split(' ')
        .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
        .join(' ')
}

function paginationPages(current: number, last: number): (number | 'ellipsis')[] {
    if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1)
    const pages: (number | 'ellipsis')[] = [1]
    if (current > 4) pages.push('ellipsis')
    for (let p = Math.max(2, current - 1); p <= Math.min(last - 1, current + 1); p++) pages.push(p)
    if (current < last - 3) pages.push('ellipsis')
    pages.push(last)
    return pages
}

/* -------------------------------------------------------------- rich text */

function RichTextEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    const editorRef = useRef<HTMLDivElement>(null)
    const [focused, setFocused] = useState(false)

    useEffect(() => {
        if (!editorRef.current) return
        if (editorRef.current.innerHTML !== value) editorRef.current.innerHTML = value || ''
    }, [value])

    const command = (name: string, commandValue?: string) => {
        editorRef.current?.focus()
        document.execCommand(name, false, commandValue)
        onChange(editorRef.current?.innerHTML ?? '')
    }

    const addLink = () => {
        const url = window.prompt('Enter the URL')
        if (!url) return
        command('createLink', url)
    }

    const setBlock = (tag: 'P' | 'H2' | 'H3') => command('formatBlock', tag)

    return (
        <div className={`overflow-hidden rounded-2xl border bg-white transition dark:bg-slate-900 ${focused ? 'border-[#1554c0] ring-2 ring-[#1554c0]/10 dark:border-[#6ba3ff]' : 'border-slate-200 dark:border-slate-700'}`}>
            <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50/90 px-2 py-2 dark:border-slate-700 dark:bg-slate-950/70">
                <span className="mr-2 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Format</span>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setBlock('P')} className="cursor-pointer rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:bg-white hover:text-[#1554c0] dark:text-slate-300 dark:hover:bg-slate-800" title="Paragraph">P</button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setBlock('H2')} className="cursor-pointer rounded-lg p-1.5 text-slate-600 transition hover:bg-white hover:text-[#1554c0] dark:text-slate-300 dark:hover:bg-slate-800" title="Heading"><LocalIcon name="heading" className="h-4 w-4" /></button>
                <span className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700" />
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => command('bold')} className="cursor-pointer rounded-lg p-1.5 text-slate-600 transition hover:bg-white hover:text-[#1554c0] dark:text-slate-300 dark:hover:bg-slate-800" title="Bold"><LocalIcon name="bold" /></button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => command('italic')} className="cursor-pointer rounded-lg p-1.5 text-slate-600 transition hover:bg-white hover:text-[#1554c0] dark:text-slate-300 dark:hover:bg-slate-800" title="Italic"><LocalIcon name="italic" /></button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => command('underline')} className="cursor-pointer rounded-lg p-1.5 text-slate-600 transition hover:bg-white hover:text-[#1554c0] dark:text-slate-300 dark:hover:bg-slate-800" title="Underline"><LocalIcon name="underline" /></button>
                <span className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700" />
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => command('insertUnorderedList')} className="cursor-pointer rounded-lg p-1.5 text-slate-600 transition hover:bg-white hover:text-[#1554c0] dark:text-slate-300 dark:hover:bg-slate-800" title="Bulleted list"><LocalIcon name="bullet-list" /></button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => command('insertOrderedList')} className="cursor-pointer rounded-lg p-1.5 text-slate-600 transition hover:bg-white hover:text-[#1554c0] dark:text-slate-300 dark:hover:bg-slate-800" title="Numbered list"><LocalIcon name="number-list" /></button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={addLink} className="cursor-pointer rounded-lg p-1.5 text-slate-600 transition hover:bg-white hover:text-[#1554c0] dark:text-slate-300 dark:hover:bg-slate-800" title="Insert link"><LocalIcon name="link" /></button>
            </div>
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onInput={(e) => onChange(e.currentTarget.innerHTML)}
                className="min-h-[260px] px-5 py-4 text-sm leading-7 text-slate-800 outline-none dark:text-slate-100 [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-bold [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mb-3 [&_ul]:list-disc"
                data-placeholder="Write the lesson content here…"
            />
            <div className="border-t border-slate-100 px-5 py-2 text-[10px] text-slate-400 dark:border-slate-800">Use headings, emphasis, lists and links to structure the learner-facing lesson.</div>
        </div>
    )
}

/* ------------------------------------------------------------------- page */

export default function ModulesLessons({ admin, courses, selectedCourse, modules, filters, stats, errors = {}, flash }: PageProps) {
    const [search, setSearch] = useState(filters.search ?? '')
    const [moduleForm, setModuleForm] = useState<ModuleForm>(emptyModule)
    const [lessonForm, setLessonForm] = useState<LessonForm>(emptyLesson)
    const [editingModule, setEditingModule] = useState<ModuleItem | null>(null)
    const [editingLesson, setEditingLesson] = useState<LessonItem | null>(null)
    const [moduleModal, setModuleModal] = useState(false)
    const [lessonModal, setLessonModal] = useState(false)
    const [expanded, setExpanded] = useState<Record<number, boolean>>({})
    const [processing, setProcessing] = useState(false)

    const [materialTitle, setMaterialTitle] = useState('')
    const [materialDescription, setMaterialDescription] = useState('')
    const [materialFile, setMaterialFile] = useState<File | null>(null)
    const [materialUrl, setMaterialUrl] = useState('')
    const [materialUploading, setMaterialUploading] = useState(false)
    const [materialError, setMaterialError] = useState<string | null>(null)
    const [previewMaterial, setPreviewMaterial] = useState<MaterialItem | null>(null)

    useEffect(() => setSearch(filters.search ?? ''), [filters.search])

    useEffect(() => {
        const timer = window.setTimeout(() => {
            const trimmed = search.trim()
            if (trimmed === (filters.search ?? '')) return
            router.get('/admin/modules-lessons', {
                course_id: selectedCourse?.id,
                search: trimmed || undefined,
                page: 1,
            }, { only: ['modules', 'filters', 'stats'], preserveState: true, preserveScroll: true, replace: true })
        }, 300)
        return () => window.clearTimeout(timer)
    }, [search, selectedCourse?.id, filters.search])

    // Keep the open lesson modal in sync with fresh props after uploads/deletes.
    useEffect(() => {
        if (!editingLesson) return
        const fresh = modules.data
            .flatMap((m) => m.lessons)
            .find((l) => l.id === editingLesson.id)
        if (!fresh) return
        if (fresh.materials.length !== editingLesson.materials.length || fresh.materials_count !== editingLesson.materials_count) {
            setEditingLesson(fresh)
        }
    }, [modules, editingLesson])

    const selectedModules = modules.data
    const pageNumbers = useMemo(() => paginationPages(modules.current_page, modules.last_page), [modules.current_page, modules.last_page])

    const navigate = (page: number) => {
        router.get('/admin/modules-lessons', {
            course_id: selectedCourse?.id,
            search: search.trim() || undefined,
            page,
        }, { only: ['modules', 'filters', 'stats'], preserveState: true, preserveScroll: true, replace: true })
    }

    const selectCourse = (courseId: string) => {
        router.get('/admin/modules-lessons', { course_id: courseId, search: search.trim() || undefined, page: 1 }, {
            only: ['modules', 'selectedCourse', 'filters', 'stats'], preserveState: true, preserveScroll: true, replace: true,
        })
    }

    const resetMaterialForm = () => {
        setMaterialTitle('')
        setMaterialDescription('')
        setMaterialFile(null)
        setMaterialUrl('')
        setMaterialError(null)
    }

    const openModuleCreate = () => { setEditingModule(null); setModuleForm(emptyModule); setModuleModal(true) }

    const openModuleEdit = (module: ModuleItem) => {
        setEditingModule(module)
        setModuleForm({ title: module.title, description: module.description ?? '' })
        setModuleModal(true)
    }

    const openLessonCreate = (moduleId: number) => {
        setEditingLesson(null)
        setLessonForm({ ...emptyLesson, module_id: String(moduleId) })
        resetMaterialForm()
        setLessonModal(true)
    }

    const openLessonEdit = (lesson: LessonItem, moduleId: number) => {
        setEditingLesson(lesson)
        setLessonForm({
            module_id: String(moduleId),
            title: lesson.title,
            slug: lesson.slug,
            description: lesson.description ?? '',
            content: lesson.content ?? '',
            type: lesson.type,
            duration_minutes: lesson.duration_minutes ? String(lesson.duration_minutes) : '',
            status: lesson.status,
        })
        resetMaterialForm()
        setLessonModal(true)
    }

    const submitModule = (event: FormEvent) => {
        event.preventDefault()
        setProcessing(true)
        const options = { onFinish: () => setProcessing(false), onSuccess: () => setModuleModal(false) }
        if (editingModule) router.put(`/admin/modules-lessons/modules/${editingModule.id}`, moduleForm, options)
        else router.post('/admin/modules-lessons/modules', { ...moduleForm, course_id: selectedCourse?.id }, options)
    }

    const submitLesson = (event: FormEvent) => {
        event.preventDefault()
        setProcessing(true)
        const payload = { ...lessonForm, duration_minutes: lessonForm.duration_minutes || null }
        const options = { onFinish: () => setProcessing(false), onSuccess: () => setLessonModal(false) }
        if (editingLesson) router.put(`/admin/modules-lessons/lessons/${editingLesson.id}`, payload, options)
        else router.post('/admin/modules-lessons/lessons', payload, options)
    }

    const destroy = (url: string, message: string) => {
        if (!window.confirm(message)) return
        router.delete(url, { preserveScroll: true })
    }

    const move = (url: string, direction: 'up' | 'down') => {
        router.post(url, { direction }, { preserveScroll: true })
    }

    // No FormEvent — the uploader is no longer inside a <form>.
       // No FormEvent — the uploader is no longer inside a <form>.
    // Title auto-derives from the filename/URL when left blank.
    const uploadMaterial = () => {
        if (!editingLesson) return
        setMaterialError(null)

        const file = materialFile
        const url = materialUrl.trim()

        if (!file && !url) {
            setMaterialError('Attach a file or provide a URL.')
            return
        }

        const derivedSource = file?.name ?? url
        const title = materialTitle.trim() || humanizeFilename(derivedSource)

        const formData = new FormData()
        formData.append('title', title)
        if (materialDescription.trim()) formData.append('description', materialDescription.trim())
        if (file) formData.append('file', file)
        else formData.append('url', url)

        setMaterialUploading(true)
        router.post(
            `/admin/modules-lessons/lessons/${editingLesson.id}/materials`,
            formData,
            {
                preserveScroll: true,
                preserveState: true,
                forceFormData: true,
                onFinish: () => setMaterialUploading(false),
                onSuccess: () => resetMaterialForm(),
                onError: (errs) => {
                    const first = Object.values(errs)[0]
                    setMaterialError(typeof first === 'string' ? first : 'Upload failed. Check the file and try again.')
                },
            },
        )
    }

    const deleteMaterial = (materialId: number) => {
        if (!window.confirm('Delete this material? The uploaded file will be removed permanently.')) return
        router.delete(`/admin/modules-lessons/materials/${materialId}`, {
            preserveScroll: true,
            preserveState: true,
        })
    }

    return (
        <AdminLayout admin={admin} title="Modules & Lessons">
            <Head title="Modules & Lessons · Admin" />

            <div className="space-y-6">
                <PageHero
                    eyebrow="Curriculum management"
                    title="Modules & lessons"
                    description="Build the learning structure behind every course. Organise topics, lessons, ordering, rich content, attachments and publication state. Upload videos, PDFs, documents or external links, and preview or remove them at any time."
                    icon="book"
                    action={
                        <button
                            type="button"
                            onClick={openModuleCreate}
                            disabled={!selectedCourse}
                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <MiniIcon name="plus" className="h-4 w-4" /> New module
                        </button>
                    }
                />

                {flash?.success && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                        {flash.success}
                    </div>
                )}
                {errors.module && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                        {errors.module}
                    </div>
                )}

                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <PremiumStat label="Modules" value={stats.modules} detail="In this course" icon="book" accent="blue" />
                    <PremiumStat label="Lessons" value={stats.lessons} detail="Across all modules" icon="assignment" accent="violet" />
                    <PremiumStat label="Published" value={stats.published_lessons} detail="Visible to students" icon="check" accent="emerald" />
                    <PremiumStat label="Drafts" value={stats.draft_lessons} detail="Not yet released" icon="edit" accent="amber" />
                </section>

                <section className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-[0_8px_28px_rgba(23,32,51,0.035)] dark:border-slate-800 dark:bg-[#101827]/75">
                    <div className="grid gap-4 lg:grid-cols-[0.8fr_1.7fr] lg:items-end">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Course</label>
                            <select
                                value={selectedCourse?.id ?? ''}
                                onChange={(e) => selectCourse(e.target.value)}
                                className={inputClass('mt-2 cursor-pointer')}
                            >
                                {courses.map((course) => (
                                    <option key={course.id} value={course.id}>
                                        {course.title} · {course.status}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Search curriculum</label>
                            <div className="relative mt-2">
                                <LocalIcon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search modules, lesson titles, slugs or descriptions…"
                                    className={inputClass('pl-10 pr-10')}
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                                        aria-label="Clear search"
                                    >
                                        <LocalIcon name="x" className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    {search && <p className="mt-3 text-[10px] font-semibold text-[#1554c0] dark:text-[#6ba3ff]">Searching live…</p>}
                </section>

                {selectedCourse ? (
                    <section>
                        <AdminSectionHeader
                            eyebrow="Curriculum"
                            title={selectedCourse.title}
                            description={modules.total > 0 ? `Showing ${modules.from}–${modules.to} of ${modules.total} modules` : undefined}
                        />

                        {selectedModules.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 py-16 text-center dark:border-slate-700 dark:bg-slate-900/40">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#1554c0] dark:bg-blue-500/10 dark:text-[#6ba3ff]">
                                    <LocalIcon name="book" className="h-5 w-5" />
                                </div>
                                <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                                    {search ? 'No matching curriculum' : 'No modules yet'}
                                </h3>
                                <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
                                    {search ? 'Try another search term or clear the search.' : 'Create the first module to start building this course.'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4 xl:grid-cols-2">
                                {selectedModules.map((module) => {
                                    const isOpen = expanded[module.id] ?? true
                                    return (
                                        <article
                                            key={module.id}
                                            className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_26px_rgba(23,32,51,0.035)] transition hover:border-slate-300 dark:border-slate-800 dark:bg-[#101827] dark:hover:border-slate-700"
                                        >
                                            <div className="p-4 sm:p-5">
                                                <div className="flex items-start gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpanded((current) => ({ ...current, [module.id]: !isOpen }))}
                                                        className="mt-0.5 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-blue-50 text-[#1554c0] transition hover:bg-blue-100 dark:bg-blue-500/10 dark:text-[#6ba3ff] dark:hover:bg-blue-500/20"
                                                        aria-label={isOpen ? 'Collapse module' : 'Expand module'}
                                                    >
                                                        <LocalIcon name={isOpen ? 'chevron-down' : 'chevron-right'} className="h-4 w-4" />
                                                    </button>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                                                                Module {module.position}
                                                            </span>
                                                            <Pill tone="slate">{module.lessons_count} lessons</Pill>
                                                        </div>
                                                        <h3 className="mt-1 text-base font-bold text-slate-950 dark:text-white">{module.title}</h3>
                                                        {module.description && (
                                                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                                                {module.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="mt-4 flex items-center justify-end gap-1 border-t border-slate-100 pt-3 dark:border-slate-800">
                                                    <button type="button" onClick={() => move(`/admin/modules-lessons/modules/${module.id}/move`, 'up')} className="cursor-pointer rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white" title="Move up">
                                                        <LocalIcon name="chevron-up" />
                                                    </button>
                                                    <button type="button" onClick={() => move(`/admin/modules-lessons/modules/${module.id}/move`, 'down')} className="cursor-pointer rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white" title="Move down">
                                                        <LocalIcon name="chevron-down" />
                                                    </button>
                                                    <button type="button" onClick={() => openModuleEdit(module)} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold text-[#1554c0] transition hover:bg-blue-50 dark:text-[#6ba3ff] dark:hover:bg-blue-500/10">
                                                        <LocalIcon name="edit" className="h-3.5 w-3.5" /> Edit
                                                    </button>
                                                    <button type="button" onClick={() => destroy(`/admin/modules-lessons/modules/${module.id}`, 'Delete this module and all of its lessons? This cannot be undone.')} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10">
                                                        <LocalIcon name="trash" className="h-3.5 w-3.5" /> Delete
                                                    </button>
                                                </div>
                                            </div>

                                            {isOpen && (
                                                <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/25">
                                                    <div className="mb-2 flex items-center justify-between gap-3">
                                                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Lessons</p>
                                                        <button type="button" onClick={() => openLessonCreate(module.id)} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-[#1554c0] transition hover:bg-blue-50 dark:text-[#6ba3ff] dark:hover:bg-blue-500/10">
                                                            <LocalIcon name="plus" className="h-3.5 w-3.5" /> Add lesson
                                                        </button>
                                                    </div>
                                                    {module.lessons.length === 0 ? (
                                                        <p className="py-4 text-xs text-slate-400">No lessons in this module.</p>
                                                    ) : (
                                                        <div className="divide-y divide-slate-200/70 dark:divide-slate-800">
                                                            {module.lessons.map((lesson) => (
                                                                <div key={lesson.id} className="group py-3">
                                                                    <div className="flex items-start gap-2.5">
                                                                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white text-[10px] font-bold text-slate-400 shadow-sm dark:bg-slate-900">
                                                                            {lesson.position}
                                                                        </span>
                                                                        <div className="min-w-0 flex-1">
                                                                            <div className="flex flex-wrap items-center gap-1.5">
                                                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{lesson.title}</h4>
                                                                                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${lessonTypeTone(lesson.type)}`}>
                                                                                    {lesson.type}
                                                                                </span>
                                                                                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${lesson.status === 'published' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'}`}>
                                                                                    {lesson.status}
                                                                                </span>
                                                                            </div>
                                                                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400">
                                                                                <span>{lesson.duration_minutes ? `${lesson.duration_minutes} min` : 'No duration'}</span>
                                                                                <span>{lesson.materials_count} materials</span>
                                                                                <span>{lesson.assignments_count} assignments</span>
                                                                                <span>{lesson.quizzes_count} quizzes</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex shrink-0 items-center gap-0.5">
                                                                            <button type="button" onClick={() => move(`/admin/modules-lessons/lessons/${lesson.id}/move`, 'up')} className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white" title="Move up">
                                                                                <LocalIcon name="chevron-up" className="h-3.5 w-3.5" />
                                                                            </button>
                                                                            <button type="button" onClick={() => move(`/admin/modules-lessons/lessons/${lesson.id}/move`, 'down')} className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white" title="Move down">
                                                                                <LocalIcon name="chevron-down" className="h-3.5 w-3.5" />
                                                                            </button>
                                                                            <button type="button" onClick={() => openLessonEdit(lesson, module.id)} className="cursor-pointer rounded-lg p-1.5 text-[#1554c0] transition hover:bg-white dark:text-[#6ba3ff] dark:hover:bg-slate-800" title="Edit lesson">
                                                                                <LocalIcon name="edit" className="h-3.5 w-3.5" />
                                                                            </button>
                                                                            <button type="button" onClick={() => destroy(`/admin/modules-lessons/lessons/${lesson.id}`, 'Delete this lesson? Any related learning history may also be removed. Continue?')} className="cursor-pointer rounded-lg p-1.5 text-red-400 transition hover:bg-white hover:text-red-600 dark:hover:bg-slate-800" title="Delete lesson">
                                                                                <LocalIcon name="trash" className="h-3.5 w-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </article>
                                    )
                                })}
                            </div>
                        )}

                        {modules.last_page > 1 && (
                            <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                                <p className="text-xs text-slate-400">Page {modules.current_page} of {modules.last_page}</p>
                                <div className="flex items-center gap-1">
                                    {modules.current_page > 1 && (
                                        <button type="button" onClick={() => navigate(modules.current_page - 1)} className="cursor-pointer rounded-lg px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800">
                                            Previous
                                        </button>
                                    )}
                                    {pageNumbers.map((page, index) =>
                                        page === 'ellipsis' ? (
                                            <span key={`e-${index}`} className="px-2 text-xs text-slate-400">…</span>
                                        ) : (
                                            <button
                                                key={page}
                                                type="button"
                                                onClick={() => navigate(page)}
                                                className={`h-9 min-w-9 cursor-pointer rounded-lg px-2.5 text-xs font-bold transition ${modules.current_page === page ? 'bg-[#1554c0] text-white' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                                            >
                                                {page}
                                            </button>
                                        ),
                                    )}
                                    {modules.current_page < modules.last_page && (
                                        <button type="button" onClick={() => navigate(modules.current_page + 1)} className="cursor-pointer rounded-lg px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800">
                                            Next
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>
                ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">No courses available</h2>
                        <p className="mt-1 text-sm text-slate-500">Create a course first, then build its curriculum here.</p>
                    </div>
                )}
            </div>

            {/* Module modal */}
            {moduleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
                    <form onSubmit={submitModule} className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-[#101827]">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1554c0] dark:text-[#6ba3ff]">Curriculum</p>
                                <h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">
                                    {editingModule ? 'Edit module' : 'Create module'}
                                </h2>
                            </div>
                            <button type="button" onClick={() => setModuleModal(false)} className="cursor-pointer rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800">
                                <LocalIcon name="x" />
                            </button>
                        </div>
                        <div className="mt-6 space-y-4">
                            <label className="block">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Module title</span>
                                <input
                                    required
                                    value={moduleForm.title}
                                    onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                                    className={inputClass('mt-1.5')}
                                />
                            </label>
                            <label className="block">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Description</span>
                                <textarea
                                    rows={4}
                                    value={moduleForm.description}
                                    onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                                    className={textareaClass('mt-1.5 resize-none')}
                                />
                            </label>
                        </div>
                        <div className="mt-6 flex justify-end gap-2">
                            <button type="button" onClick={() => setModuleModal(false)} className="cursor-pointer rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                                Cancel
                            </button>
                            <button disabled={processing} className="cursor-pointer rounded-xl bg-[#1554c0] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#10479f] disabled:cursor-not-allowed disabled:opacity-50">
                                {processing ? 'Saving…' : editingModule ? 'Save changes' : 'Create module'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Lesson modal */}
            {lessonModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
                    <form onSubmit={submitLesson} className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-[#101827]">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1554c0] dark:text-[#6ba3ff]">Lesson editor</p>
                                <h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">
                                    {editingLesson ? 'Edit lesson' : 'Create lesson'}
                                </h2>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Build the learner-facing content, attachments and publication state.
                                </p>
                            </div>
                            <button type="button" onClick={() => setLessonModal(false)} className="cursor-pointer rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800">
                                <LocalIcon name="x" />
                            </button>
                        </div>

                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            <label className="sm:col-span-2">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Lesson title</span>
                                <input
                                    required
                                    value={lessonForm.title}
                                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value, slug: lessonForm.slug || slugify(e.target.value) })}
                                    className={inputClass('mt-1.5')}
                                />
                            </label>
                            <label>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Slug</span>
                                <input
                                    value={lessonForm.slug}
                                    onChange={(e) => setLessonForm({ ...lessonForm, slug: slugify(e.target.value) })}
                                    className={inputClass('mt-1.5')}
                                />
                            </label>
                            <label>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Type</span>
                                <select
                                    value={lessonForm.type}
                                    onChange={(e) => setLessonForm({ ...lessonForm, type: e.target.value as LessonForm['type'] })}
                                    className={inputClass('mt-1.5 cursor-pointer')}
                                >
                                    <option value="article">Article</option>
                                    <option value="video">Video</option>
                                    <option value="document">Document</option>
                                    <option value="interactive">Interactive</option>
                                </select>
                            </label>
                            <label>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Duration (minutes)</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={lessonForm.duration_minutes}
                                    onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: e.target.value })}
                                    className={inputClass('mt-1.5')}
                                />
                            </label>
                            <label>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Status</span>
                                <select
                                    value={lessonForm.status}
                                    onChange={(e) => setLessonForm({ ...lessonForm, status: e.target.value as LessonForm['status'] })}
                                    className={inputClass('mt-1.5 cursor-pointer')}
                                >
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                </select>
                            </label>
                            <label className="sm:col-span-2">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Description</span>
                                <textarea
                                    rows={3}
                                    value={lessonForm.description}
                                    onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                                    className={textareaClass('mt-1.5 resize-none')}
                                />
                            </label>
                            <div className="sm:col-span-2">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Lesson content</span>
                                    <span className="text-[10px] font-medium text-slate-400">
                                        {lessonForm.type === 'article' || lessonForm.type === 'interactive' ? 'Rich text editor' : 'Plain content / embed data'}
                                    </span>
                                </div>
                                {lessonForm.type === 'article' || lessonForm.type === 'interactive' ? (
                                    <RichTextEditor
                                        value={lessonForm.content}
                                        onChange={(content) => setLessonForm((current) => ({ ...current, content }))}
                                    />
                                ) : (
                                    <textarea
                                        rows={10}
                                        value={lessonForm.content}
                                        onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                                        className="w-full resize-y rounded-2xl border border-slate-200 px-4 py-4 font-mono text-sm leading-6 outline-none focus:border-[#1554c0] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                        placeholder={lessonForm.type === 'video' ? 'Optional notes or embed details…' : 'Enter document or interactive content…'}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                            <button type="button" onClick={() => setLessonModal(false)} className="cursor-pointer rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800">
                                Cancel
                            </button>
                            <button disabled={processing} className="cursor-pointer rounded-xl bg-[#1554c0] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#10479f] disabled:cursor-not-allowed disabled:opacity-50">
                                {processing ? 'Saving…' : editingLesson ? 'Save changes' : 'Create lesson'}
                            </button>
                        </div>

                        {editingLesson && (
                            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-5 dark:border-slate-800 dark:bg-slate-950/30">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1554c0] dark:text-[#6ba3ff]">Attachments</p>
                                        <h3 className="mt-1 text-sm font-bold text-slate-900 dark:text-white">Videos, documents and links</h3>
                                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                            Upload files up to 200 MB. Videos, PDFs and images can be previewed inline.
                                        </p>
                                    </div>
                                    <Pill tone="slate">
                                        {editingLesson.materials.length} file{editingLesson.materials.length === 1 ? '' : 's'}
                                    </Pill>
                                </div>

                                {editingLesson.materials.length > 0 ? (
                                    <ul className="mt-4 divide-y divide-slate-200/70 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-[#0f1729]">
                                        {editingLesson.materials.map((material) => {
                                            const src = materialPublicUrl(material)
                                            const canPreview = materialPreviewKind(material) !== null
                                            return (
                                                <li key={material.id} className="flex items-center gap-3 px-3.5 py-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#6ba3ff]">
                                                        <LocalIcon
                                                            name={material.type === 'video' ? 'play' : material.type === 'link' ? 'link' : 'book'}
                                                            className="h-4 w-4"
                                                        />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{material.title}</p>
                                                        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                                                            <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                                {material.type}
                                                            </span>
                                                            {material.size ? <span>· {formatBytes(material.size)}</span> : null}
                                                            {material.is_preview ? <span>· Preview enabled</span> : null}
                                                        </p>
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-1">
                                                        {src && canPreview && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setPreviewMaterial(material)}
                                                                className="cursor-pointer rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-[#1554c0] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-[#6ba3ff]"
                                                                title="Preview"
                                                            >
                                                                <LocalIcon name="eye" className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                        {src && (
                                                            <a
                                                                href={src}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-[#1554c0] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-[#6ba3ff]"
                                                                title="Download"
                                                            >
                                                                <LocalIcon name="download" className="h-3.5 w-3.5" />
                                                            </a>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteMaterial(material.id)}
                                                            className="cursor-pointer rounded-lg p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                                                            title="Delete"
                                                        >
                                                            <LocalIcon name="trash" className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                ) : (
                                    <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-xs text-slate-400 dark:border-slate-700 dark:bg-slate-900/40">
                                        No attachments yet. Upload the first file below.
                                    </p>
                                )}

                                {/* NOT a <form> — must not nest inside the lesson <form>.
                                    The outer form is only for saving the lesson; the upload
                                    panel uses a plain div with a button that triggers the POST. */}
                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    <label className="sm:col-span-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Title</span>
                                        <input
                                            value={materialTitle}
                                            onChange={(e) => setMaterialTitle(e.target.value)}
                                            placeholder="Leave blank to auto-generate from the file name"
                                            className={inputClass('mt-1.5')}
                                        />
                                    </label>
                                    <label className="sm:col-span-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Description (optional)</span>
                                        <input
                                            value={materialDescription}
                                            onChange={(e) => setMaterialDescription(e.target.value)}
                                            placeholder="Short summary for learners"
                                            className={inputClass('mt-1.5')}
                                        />
                                    </label>
                                    <label>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">File</span>
                                        <input
                                            type="file"
                                            onChange={(e) => {
                                                setMaterialFile(e.target.files?.[0] ?? null)
                                                if (e.target.files?.[0]) setMaterialUrl('')
                                            }}
                                            className="mt-1.5 block w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#1554c0] file:px-3 file:py-1.5 file:text-[11px] file:font-bold file:text-white hover:file:bg-[#10479f] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                        />
                                    </label>
                                    <label>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Or link URL</span>
                                        <input
                                            value={materialUrl}
                                            onChange={(e) => {
                                                setMaterialUrl(e.target.value)
                                                if (e.target.value) setMaterialFile(null)
                                            }}
                                            placeholder="https://…"
                                            className={inputClass('mt-1.5')}
                                            disabled={!!materialFile}
                                        />
                                    </label>
                                    {materialError && (
                                        <p className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                                            {materialError}
                                        </p>
                                    )}
                                    <div className="sm:col-span-2 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={uploadMaterial}
                                            disabled={materialUploading}
                                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#1554c0] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#10479f] disabled:cursor-wait disabled:opacity-60"
                                        >
                                            <MiniIcon name="plus" className="h-3.5 w-3.5" />
                                            {materialUploading ? 'Uploading…' : 'Upload attachment'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            )}

            {/* Preview modal */}
            {previewMaterial && (() => {
                const kind = materialPreviewKind(previewMaterial)
                const src = materialPublicUrl(previewMaterial)
                return (
                    <Modal
                        title={previewMaterial.title}
                        eyebrow="Preview"
                        onClose={() => setPreviewMaterial(null)}
                        wide
                    >
                        {!src ? (
                            <p className="text-sm text-slate-500">This material has no previewable source.</p>
                        ) : kind === 'video' ? (
                            <video src={src} controls className="w-full rounded-xl bg-black" />
                        ) : kind === 'pdf' ? (
                            <iframe
                                src={src}
                                className="h-[70vh] w-full rounded-xl border border-slate-200 dark:border-slate-700"
                                title={previewMaterial.title}
                            />
                        ) : kind === 'image' ? (
                            <img
                                src={src}
                                alt={previewMaterial.title}
                                className="mx-auto max-h-[70vh] rounded-xl"
                            />
                        ) : (
                            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                    No inline preview available
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Download the file to view it on your device.
                                </p>
                                <a
                                    href={src}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#1554c0] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#10479f]"
                                >
                                    <LocalIcon name="download" className="h-3.5 w-3.5" /> Download
                                </a>
                            </div>
                        )}
                        <div className="mt-4 flex justify-end gap-2">
                            {src && (
                                <a
                                    href={src}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    Open in new tab
                                </a>
                            )}
                            <button
                                type="button"
                                onClick={() => setPreviewMaterial(null)}
                                className="rounded-lg bg-slate-900 px-4 py-2 text-[11px] font-bold text-white dark:bg-white dark:text-slate-900"
                            >
                                Close
                            </button>
                        </div>
                    </Modal>
                )
            })()}
        </AdminLayout>
    )
}