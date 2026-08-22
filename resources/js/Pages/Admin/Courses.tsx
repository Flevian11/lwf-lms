import { Head, router } from '@inertiajs/react'
import type { ChangeEvent, FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../../Components/AdminLayout'
import { Icon, assetUrl } from '../../Components/StudentUI'

interface AdminUser {
    id: number
    name: string
    email: string
    avatar_path?: string | null
    email_two_factor_enabled?: boolean
}

interface Category {
    id: number
    name: string
    slug: string
}

interface CourseItem {
    id: number
    title: string
    slug: string
    short_description: string | null
    description: string | null
    thumbnail_path: string | null
    level: string
    status: 'draft' | 'published' | 'archived'
    access_type: 'free' | 'paid'
    price: number
    currency: string
    published_at: string | null
    updated_at: string | null
    category: Category | null
    modules_count: number
    enrollments_count: number
    assignments_count: number
    quizzes_count: number
}

interface PaginatorLink {
    url: string | null
    label: string
    active: boolean
}

interface PaginatedCourses {
    data: CourseItem[]
    current_page: number
    last_page: number
    from: number | null
    to: number | null
    total: number
    links: PaginatorLink[]
}

interface Filters {
    search: string
    status: string
    access_type: string
    category_id: number | null
}

interface Stats {
    total: number
    published: number
    drafts: number
    archived: number
    free: number
    paid: number
}

interface PageProps {
    admin: AdminUser
    courses: PaginatedCourses
    categories: Category[]
    filters: Filters
    stats: Stats
    errors?: Record<string, string>
    flash?: { success?: string }
}

type CourseForm = {
    title: string
    slug: string
    category_id: string
    short_description: string
    description: string
    level: 'beginner' | 'intermediate' | 'advanced'
    status: 'draft' | 'published' | 'archived'
    access_type: 'free' | 'paid'
    price: string
    currency: string
    thumbnail: File | null
}

const emptyForm: CourseForm = {
    title: '',
    slug: '',
    category_id: '',
    short_description: '',
    description: '',
    level: 'beginner',
    status: 'draft',
    access_type: 'free',
    price: '0',
    currency: 'KES',
    thumbnail: null,
}

function formatDate(value: string | null): string {
    if (!value) return 'Not published'
    return new Intl.DateTimeFormat('en-KE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(value))
}

function formatPrice(course: CourseItem): string {
    if (course.access_type === 'free' || course.price <= 0) return 'Free'
    return `${course.currency} ${course.price.toLocaleString('en-KE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })}`
}

function slugify(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s-]+/g, '-')
}

export default function Courses({ admin, courses, categories, filters, stats, errors = {}, flash }: PageProps) {
    const [search, setSearch] = useState(filters.search ?? '')
    const [status, setStatus] = useState(filters.status ?? 'all')
    const [accessType, setAccessType] = useState(filters.access_type ?? 'all')
    const [categoryId, setCategoryId] = useState(filters.category_id ? String(filters.category_id) : 'all')
    const [modalOpen, setModalOpen] = useState(false)
    const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null)
    const [form, setForm] = useState<CourseForm>(emptyForm)
    const [processing, setProcessing] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<CourseItem | null>(null)

    useEffect(() => {
        setSearch(filters.search ?? '')
        setStatus(filters.status ?? 'all')
        setAccessType(filters.access_type ?? 'all')
        setCategoryId(filters.category_id ? String(filters.category_id) : 'all')
    }, [filters])

    const queryParams = useMemo(() => ({
        search: search.trim() || undefined,
        status: status !== 'all' ? status : undefined,
        access_type: accessType !== 'all' ? accessType : undefined,
        category_id: categoryId !== 'all' ? categoryId : undefined,
    }), [search, status, accessType, categoryId])

    const applyFilters = () => {
        router.get('/admin/courses', queryParams, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        })
    }

    const resetFilters = () => {
        setSearch('')
        setStatus('all')
        setAccessType('all')
        setCategoryId('all')
        router.get('/admin/courses', {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        })
    }

    const openCreate = () => {
        setEditingCourse(null)
        setForm(emptyForm)
        setModalOpen(true)
    }

    const openEdit = (course: CourseItem) => {
        setEditingCourse(course)
        setForm({
            title: course.title,
            slug: course.slug,
            category_id: course.category ? String(course.category.id) : '',
            short_description: course.short_description ?? '',
            description: course.description ?? '',
            level: course.level as CourseForm['level'],
            status: course.status,
            access_type: course.access_type,
            price: String(course.price),
            currency: course.currency,
            thumbnail: null,
        })
        setModalOpen(true)
    }

    const closeModal = () => {
        if (processing) return
        setModalOpen(false)
        setEditingCourse(null)
    }

    const updateField = <K extends keyof CourseForm>(key: K, value: CourseForm[K]) => {
        setForm((current) => ({ ...current, [key]: value }))
    }

    const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const title = event.target.value
        setForm((current) => ({
            ...current,
            title,
            slug: editingCourse ? current.slug : slugify(title),
        }))
    }

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setProcessing(true)

        const payload = {
            ...form,
            price: form.access_type === 'free' ? '0' : form.price,
            _method: editingCourse ? 'put' : undefined,
        }

        const options = {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setModalOpen(false)
                setEditingCourse(null)
                setForm(emptyForm)
            },
            onFinish: () => setProcessing(false),
        }

        if (editingCourse) {
            router.post(`/admin/courses/${editingCourse.id}`, payload, options)
        } else {
            router.post('/admin/courses', payload, options)
        }
    }

    const handleDelete = () => {
        if (!deleteTarget) return
        setProcessing(true)
        router.delete(`/admin/courses/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
            onFinish: () => setProcessing(false),
        })
    }

    return (
        <AdminLayout admin={admin} title="Courses">
            <Head title="Admin Courses" />

            <div className="space-y-8">
                <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1554c0] dark:text-[#6ba3ff]">
                            Learning management
                        </p>
                        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                            Courses
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                            Create, publish, organize and maintain the learning catalogue. Modules, lessons and learning materials are managed from the course workspace.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1554c0] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(21,84,192,0.2)] transition hover:-translate-y-0.5 hover:bg-[#1249a8] hover:shadow-[0_12px_28px_rgba(21,84,192,0.26)] focus:outline-none focus:ring-2 focus:ring-[#1554c0]/30"
                    >
                        <span className="text-lg leading-none">+</span>
                        New course
                    </button>
                </section>

                {flash?.success ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                        {flash.success}
                    </div>
                ) : null}

                {errors.course ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
                        {errors.course}
                    </div>
                ) : null}

                <section className="grid grid-cols-2 gap-x-6 border-y border-slate-200/80 py-5 dark:border-slate-800 sm:grid-cols-3 lg:grid-cols-6">
                    {[
                        ['Total', stats.total],
                        ['Published', stats.published],
                        ['Drafts', stats.drafts],
                        ['Archived', stats.archived],
                        ['Free', stats.free],
                        ['Paid', stats.paid],
                    ].map(([label, value]) => (
                        <div key={label as string} className="py-2 sm:border-l sm:border-slate-200/70 sm:pl-5 first:sm:border-l-0 first:sm:pl-0 dark:border-slate-800">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">{label}</p>
                            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{value}</p>
                        </div>
                    ))}
                </section>

                <section className="border-b border-slate-200/80 pb-5 dark:border-slate-800">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="relative min-w-0 flex-1 lg:max-w-md">
                            <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') applyFilters()
                                }}
                                placeholder="Search courses..."
                                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1554c0]/50 focus:ring-2 focus:ring-[#1554c0]/10 dark:border-slate-700 dark:bg-slate-900/60 dark:text-white"
                            />
                        </div>

                        <select value={status} onChange={(event) => setStatus(event.target.value)} className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-[#1554c0]/50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
                            <option value="all">All statuses</option>
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                            <option value="archived">Archived</option>
                        </select>

                        <select value={accessType} onChange={(event) => setAccessType(event.target.value)} className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-[#1554c0]/50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
                            <option value="all">All access</option>
                            <option value="free">Free</option>
                            <option value="paid">Paid</option>
                        </select>

                        <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-[#1554c0]/50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
                            <option value="all">All categories</option>
                            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                        </select>

                        <button type="button" onClick={applyFilters} className="cursor-pointer rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1554c0] dark:bg-white dark:text-slate-900 dark:hover:bg-[#dbe9ff]">
                            Filter
                        </button>
                        <button type="button" onClick={resetFilters} className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white">
                            Reset
                        </button>
                    </div>
                </section>

                <section>
                    <div className="mb-4 flex items-end justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Catalogue</p>
                            <h2 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">Manage courses</h2>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            {courses.from ?? 0}–{courses.to ?? 0} of {courses.total}
                        </p>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/70 dark:border-slate-800 dark:bg-slate-900/30">
                        <div className="hidden grid-cols-[minmax(280px,1.7fr)_160px_110px_150px_120px] gap-4 border-b border-slate-200/80 bg-slate-50/80 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-500 lg:grid">
                            <span>Course</span><span>Category</span><span>Access</span><span>Learning data</span><span className="text-right">Actions</span>
                        </div>

                        {courses.data.length === 0 ? (
                            <div className="px-6 py-16 text-center">
                                <Icon name="book" className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                                <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">No courses found</h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Try changing your filters or create the first course.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
                                {courses.data.map((course) => {
                                    const thumbnail = assetUrl(course.thumbnail_path)
                                    return (
                                        <article key={course.id} className="group px-4 py-4 transition hover:bg-slate-50/70 sm:px-5 dark:hover:bg-slate-900/60">
                                            <div className="grid gap-4 lg:grid-cols-[minmax(280px,1.7fr)_160px_110px_150px_120px] lg:items-center">
                                                <div className="flex min-w-0 items-center gap-3.5">
                                                    {thumbnail ? (
                                                        <img src={thumbnail} alt="" className="h-14 w-20 shrink-0 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700" />
                                                    ) : (
                                                        <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#e9f2ff] to-[#f1edff] text-[#1554c0] dark:from-[#172945] dark:to-[#211d3d] dark:text-[#82b1ff]">
                                                            <Icon name="book" className="h-5 w-5" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">{course.title}</h3>
                                                            <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${course.status === 'published' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : course.status === 'draft' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>{course.status}</span>
                                                        </div>
                                                        <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{course.short_description || 'No short description provided.'}</p>
                                                        <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">/{course.slug} · Updated {formatDate(course.updated_at)}</p>
                                                    </div>
                                                </div>

                                                <div className="text-xs font-medium text-slate-600 dark:text-slate-300">{course.category?.name ?? 'Uncategorized'}</div>
                                                <div><span className="text-xs font-bold text-slate-800 dark:text-slate-200">{formatPrice(course)}</span><span className="mt-0.5 block text-[10px] capitalize text-slate-400">{course.level}</span></div>
                                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400">
                                                    <span>{course.modules_count} modules</span><span>{course.enrollments_count} learners</span><span>{course.assignments_count} assignments</span>
                                                </div>
                                                <div className="flex items-center justify-start gap-1.5 lg:justify-end">
                                                    <button type="button" onClick={() => openEdit(course)} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-600 transition hover:bg-[#edf4ff] hover:text-[#1554c0] dark:text-slate-300 dark:hover:bg-[#172945] dark:hover:text-[#8bb8ff]" title="Edit course">
                                                        <Icon name="edit" className="h-3.5 w-3.5" /> Edit
                                                    </button>
                                                    <button type="button" onClick={() => setDeleteTarget(course)} className="inline-flex cursor-pointer items-center justify-center rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400" title="Delete course">
                                                        <Icon name="trash" className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {courses.last_page > 1 ? (
                        <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
                            {courses.links.map((link, index) => (
                                <button
                                    key={`${link.label}-${index}`}
                                    type="button"
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true, replace: true })}
                                    className={`min-w-9 cursor-pointer rounded-lg px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-35 ${link.active ? 'bg-[#1554c0] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    ) : null}
                </section>
            </div>

            {modalOpen ? (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
                    <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.25)] dark:border-slate-700 dark:bg-[#101827]">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-[#101827]/95 sm:px-6">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1554c0] dark:text-[#6ba3ff]">Course management</p>
                                <h2 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">{editingCourse ? 'Edit course' : 'Create course'}</h2>
                            </div>
                            <button type="button" onClick={closeModal} className="cursor-pointer rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white" aria-label="Close">
                                <Icon name="x" className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-6">
                            <div className="grid gap-5 md:grid-cols-2">
                                <label className="md:col-span-2">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Course title</span>
                                    <input required value={form.title} onChange={handleTitleChange} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-[#1554c0]/50 focus:ring-2 focus:ring-[#1554c0]/10 dark:border-slate-700 dark:bg-slate-900/60 dark:text-white" placeholder="e.g. Web Development Fundamentals" />
                                </label>
                                <label>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Slug</span>
                                    <input value={form.slug} onChange={(event) => updateField('slug', slugify(event.target.value))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-[#1554c0]/50 focus:ring-2 focus:ring-[#1554c0]/10 dark:border-slate-700 dark:bg-slate-900/60 dark:text-white" placeholder="course-slug" />
                                </label>
                                <label>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Category</span>
                                    <select required value={form.category_id} onChange={(event) => updateField('category_id', event.target.value)} className="mt-2 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-900/60 dark:text-white">
                                        <option value="">Select category</option>
                                        {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                                    </select>
                                </label>
                                <label>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Level</span>
                                    <select value={form.level} onChange={(event) => updateField('level', event.target.value as CourseForm['level'])} className="mt-2 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-900/60 dark:text-white">
                                        <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
                                    </select>
                                </label>
                                <label>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Status</span>
                                    <select value={form.status} onChange={(event) => updateField('status', event.target.value as CourseForm['status'])} className="mt-2 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-900/60 dark:text-white">
                                        <option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
                                    </select>
                                </label>
                                <label>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Access type</span>
                                    <select value={form.access_type} onChange={(event) => updateField('access_type', event.target.value as CourseForm['access_type'])} className="mt-2 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-900/60 dark:text-white">
                                        <option value="free">Free</option><option value="paid">Paid</option>
                                    </select>
                                </label>
                                <label>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Price</span>
                                    <input type="number" min="0" step="0.01" disabled={form.access_type === 'free'} value={form.access_type === 'free' ? '0' : form.price} onChange={(event) => updateField('price', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-white dark:disabled:bg-slate-900" />
                                </label>
                                <label>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Currency</span>
                                    <input maxLength={3} value={form.currency} onChange={(event) => updateField('currency', event.target.value.toUpperCase())} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm uppercase outline-none focus:border-[#1554c0]/50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-white" />
                                </label>
                                <label className="md:col-span-2">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Short description</span>
                                    <input maxLength={500} value={form.short_description} onChange={(event) => updateField('short_description', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-[#1554c0]/50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-white" placeholder="A concise description shown in the catalogue." />
                                </label>
                                <label className="md:col-span-2">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Description</span>
                                    <textarea rows={6} value={form.description} onChange={(event) => updateField('description', event.target.value)} className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-6 outline-none focus:border-[#1554c0]/50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-white" placeholder="Describe the learning outcomes, scope and audience." />
                                </label>
                                <label className="md:col-span-2">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Course thumbnail</span>
                                    <input type="file" accept="image/*" onChange={(event) => updateField('thumbnail', event.target.files?.[0] ?? null)} className="mt-2 block w-full cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3.5 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400" />
                                    <span className="mt-1 block text-[10px] text-slate-400">JPG, PNG or WebP · max 4 MB</span>
                                </label>
                            </div>

                            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end dark:border-slate-800">
                                <button type="button" onClick={closeModal} disabled={processing} className="cursor-pointer rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white">Cancel</button>
                                <button type="submit" disabled={processing} className="cursor-pointer rounded-xl bg-[#1554c0] px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#1249a8] disabled:cursor-not-allowed disabled:opacity-60">{processing ? 'Saving...' : editingCourse ? 'Save changes' : 'Create course'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {deleteTarget ? (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.25)] dark:border-slate-700 dark:bg-[#101827]">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"><Icon name="trash" className="h-5 w-5" /></div>
                        <h2 className="mt-4 text-lg font-bold text-slate-950 dark:text-white">Delete this course?</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">You are about to delete <strong className="text-slate-800 dark:text-slate-200">{deleteTarget.title}</strong>. Courses with enrollment history cannot be deleted and should be archived instead.</p>
                        <div className="mt-6 flex justify-end gap-2">
                            <button type="button" onClick={() => setDeleteTarget(null)} disabled={processing} className="cursor-pointer rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">Cancel</button>
                            <button type="button" onClick={handleDelete} disabled={processing} className="cursor-pointer rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60">{processing ? 'Deleting...' : 'Delete course'}</button>
                        </div>
                    </div>
                </div>
            ) : null}
        </AdminLayout>
    )
}
