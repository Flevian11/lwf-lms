import { Head } from '@inertiajs/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import StudentLayout from '../Components/StudentLayout'
import { Icon, assetUrl, initials } from '../Components/StudentUI'
import type { DashboardStats, Student } from '../Components/student-types'
import {
    createConversation,
    deleteConversation,
    loadConversation,
    listConversations,
    renameConversation,
    safeChatError,
    sendChatMessage,
    type ChatConversation,
    type ChatMessage,
} from '../lib/chatbot'

interface Props {
    student: Student
    stats: DashboardStats
    conversations: ChatConversation[]
}

const welcomeMessage = (name: string): ChatMessage => ({
    id: 'welcome',
    role: 'assistant',
    content: `Hi ${name.split(' ')[0] || 'there'}. I’m TechGhost AI, your personal Learn With Flevian learning assistant. I can explain concepts, review your learning progress, help you plan study time, explain quiz or assignment feedback, and guide you through difficult work without completing or submitting assignments for you.`,
})

function friendlyLinkLabel(href: string, explicitLabel?: string) {
    if (explicitLabel?.trim()) return explicitLabel.trim()

    try {
        const url = new URL(href, window.location.origin)
        const path = url.pathname.replace(/\/+$/, '')
        const labels: Record<string, string> = {
            '/dashboard': 'Dashboard',
            '/chatbot': 'AI Assistant',
            '/courses': 'My Courses',
            '/assignments': 'Assignments',
            '/quizzes': 'Quizzes',
            '/achievements': 'Achievements',
            '/support': 'Support',
            '/profile': 'Profile',
            '/security': 'Security',
        }

        if (labels[path]) return labels[path]

        const last = path.split('/').filter(Boolean).pop()
        if (!last) return 'Open page'

        return decodeURIComponent(last)
            .replace(/[-_]+/g, ' ')
            .replace(/\b\w/g, (letter) => letter.toUpperCase())
    } catch {
        return explicitLabel?.trim() || 'Open link'
    }
}

function InlineLink({ href, label }: { href: string; label?: string }) {
    let internal = false

    try {
        const url = new URL(href, window.location.origin)
        internal = url.origin === window.location.origin
    } catch {
        internal = href.startsWith('/')
    }

    return (
        <a
            href={href}
            {...(internal ? {} : { target: '_blank', rel: 'noreferrer' })}
            className="inline-flex max-w-full items-center rounded-md px-1 font-semibold text-[#1554c0] underline decoration-[#1554c0]/30 underline-offset-2 transition hover:bg-[#1554c0]/5 hover:decoration-current dark:text-[#8bb8ff] dark:hover:bg-[#8bb8ff]/10"
        >
            {friendlyLinkLabel(href, label)}
        </a>
    )
}

function InlineText({ text }: { text: string }) {
    const tokens = text.split(/(\[[^\]]+\]\((?:https?:\/\/[^\s)]+|\/[^\s)]+)\)|https?:\/\/[^\s<]+|`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_)/g)

    return <>{tokens.map((token, index) => {
        if (!token) return null

        const markdownLink = token.match(/^\[([^\]]+)\]\(((?:https?:\/\/[^\s)]+|\/[^\s)]+))\)$/)
        if (markdownLink) return <InlineLink key={index} href={markdownLink[2]} label={markdownLink[1]} />

        if (/^https?:\/\//i.test(token)) {
            const cleanUrl = token.replace(/[.,!?;:]+$/, '')
            return <InlineLink key={index} href={cleanUrl} />
        }

        if ((token.startsWith('`') && token.endsWith('`'))) return <code key={index} className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] text-[#1554c0] dark:bg-slate-800 dark:text-[#8bb8ff]">{token.slice(1, -1)}</code>
        if ((token.startsWith('**') && token.endsWith('**')) || (token.startsWith('__') && token.endsWith('__'))) return <strong key={index} className="font-bold text-slate-950 dark:text-white">{token.slice(2, -2)}</strong>
        if ((token.startsWith('*') && token.endsWith('*')) || (token.startsWith('_') && token.endsWith('_'))) return <em key={index}>{token.slice(1, -1)}</em>
        return <span key={index}>{token}</span>
    })}</>
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
    const [copied, setCopied] = useState(false)
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(code)
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1500)
        } catch { /* clipboard may be unavailable */ }
    }

    return (
        <div className="my-3 overflow-hidden rounded-xl border border-slate-700/80 bg-[#090f1d] shadow-sm">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">{language || 'code'}</span>
                <button type="button" onClick={() => void copy()} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[9px] font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">
                    <Icon name="copy" className="h-3 w-3" />{copied ? 'Copied' : 'Copy'}
                </button>
            </div>
            <pre className="max-w-full overflow-x-auto px-4 py-3 font-mono text-[11px] leading-5 text-slate-200"><code>{code}</code></pre>
        </div>
    )
}

function AssistantMessage({ content }: { content: string }) {
    const lines = content.replace(/\r/g, '').split('\n')
    const blocks: ReactNode[] = []
    let index = 0

    while (index < lines.length) {
        const trimmed = lines[index].trim()
        if (!trimmed) { index += 1; continue }

        if (trimmed.startsWith('```')) {
            const language = trimmed.slice(3).trim() || undefined
            const code: string[] = []
            index += 1
            while (index < lines.length && !lines[index].trim().startsWith('```')) {
                code.push(lines[index])
                index += 1
            }
            blocks.push(<CodeBlock key={`code-${index}`} code={code.join('\n')} language={language} />)
            index += 1
            continue
        }

        const heading = trimmed.match(/^#{1,4}\s+(.+)$/)
        if (heading) {
            blocks.push(<h3 key={`heading-${index}`} className="mt-5 text-[14px] font-bold tracking-[-0.015em] text-slate-950 first:mt-0 dark:text-white"><InlineText text={heading[1]} /></h3>)
            index += 1
            continue
        }

        if (/^[-*_]{3,}$/.test(trimmed)) {
            blocks.push(<hr key={`hr-${index}`} className="my-4 border-slate-200 dark:border-slate-700" />)
            index += 1
            continue
        }

        if (/^>\s?/.test(trimmed)) {
            const quote: string[] = []
            while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
                quote.push(lines[index].trim().replace(/^>\s?/, ''))
                index += 1
            }
            blocks.push(<blockquote key={`quote-${index}`} className="my-3 border-l-2 border-[#1554c0] pl-4 text-[13px] leading-6 italic text-slate-500 dark:border-[#8bb8ff] dark:text-slate-400"><InlineText text={quote.join(' ')} /></blockquote>)
            continue
        }

        if (/^[-*•]\s+/.test(trimmed)) {
            const items: string[] = []
            while (index < lines.length && /^\s*[-*•]\s+/.test(lines[index])) {
                items.push(lines[index].replace(/^\s*[-*•]\s+/, '').trim())
                index += 1
            }
            blocks.push(<ul key={`ul-${index}`} className="my-3 space-y-2 pl-5 text-[13px] leading-6 text-slate-700 dark:text-slate-300">{items.map((item, i) => <li key={i} className="list-disc pl-1"><InlineText text={item} /></li>)}</ul>)
            continue
        }

        if (/^\d+[.)]\s+/.test(trimmed)) {
            const items: string[] = []
            while (index < lines.length && /^\s*\d+[.)]\s+/.test(lines[index])) {
                items.push(lines[index].replace(/^\s*\d+[.)]\s+/, '').trim())
                index += 1
            }
            blocks.push(<ol key={`ol-${index}`} className="my-3 space-y-2 pl-5 text-[13px] leading-6 text-slate-700 dark:text-slate-300">{items.map((item, i) => <li key={i} className="list-decimal pl-1"><InlineText text={item} /></li>)}</ol>)
            continue
        }

        if (trimmed.startsWith('|') && index + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) {
            const tableLines = [trimmed]
            index += 1
            while (index < lines.length && lines[index].trim().startsWith('|')) {
                tableLines.push(lines[index].trim())
                index += 1
            }
            const cells = tableLines.map(row => row.split('|').slice(1, -1).map(cell => cell.trim()))
            const headers = cells[0] ?? []
            const rows = cells.slice(2)
            blocks.push(
                <div key={`table-${index}`} className="my-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                    <table className="min-w-full text-left text-[11px]"><thead className="bg-slate-50 dark:bg-slate-800/80"><tr>{headers.map((cell, i) => <th key={i} className="whitespace-nowrap px-3 py-2.5 font-bold text-slate-700 dark:text-slate-200"><InlineText text={cell} /></th>)}</tr></thead><tbody>{rows.map((row, ri) => <tr key={ri} className="border-t border-slate-200 dark:border-slate-700">{row.map((cell, ci) => <td key={ci} className="px-3 py-2.5 align-top text-slate-600 dark:text-slate-300"><InlineText text={cell} /></td>)}</tr>)}</tbody></table>
                </div>,
            )
            continue
        }

        const paragraph: string[] = [trimmed]
        index += 1
        while (index < lines.length) {
            const next = lines[index].trim()
            if (!next || next.startsWith('```') || /^#{1,4}\s+/.test(next) || /^[-*•]\s+/.test(next) || /^\d+[.)]\s+/.test(next) || /^>\s?/.test(next) || next.startsWith('|') || /^[-*_]{3,}$/.test(next)) break
            paragraph.push(next)
            index += 1
        }
        blocks.push(<p key={`p-${index}`} className="text-[13px] leading-6 text-slate-700 dark:text-slate-300"><InlineText text={paragraph.join(' ')} /></p>)
    }

    return <div className="min-w-0 space-y-1">{blocks}</div>
}

function formatMessageTime(value?: string) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date)
}

function ChatBubble({ message, student, onCopy, onResend }: { message: ChatMessage; student: Student; onCopy: (message: ChatMessage) => void; onResend: (message: ChatMessage) => void }) {
    const user = message.role === 'user'
    const avatar = assetUrl(student.avatar_path)
    return (
        <article className={`group flex ${user ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[92%] gap-3 sm:max-w-[84%] ${user ? 'flex-row-reverse' : ''}`}>
                {user ? (
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#1554c0] text-[9px] font-bold text-white shadow-sm dark:bg-[#275fc5]" title={student.name}>
                        {avatar ? <img src={avatar} alt={student.name} className="h-full w-full object-cover" /> : initials(student.name)}
                    </div>
                ) : (
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1554c0]/10 text-[#1554c0] dark:bg-[#6ba3ff]/10 dark:text-[#8bb8ff]">
                        <Icon name="chatbot" className="h-4 w-4" />
                    </div>
                )}
                <div className={`min-w-0 ${user ? 'items-end' : 'items-start'}`}>
                    <div className={`mb-1 flex items-center gap-2 px-1 text-[9px] font-semibold text-slate-400 ${user ? 'justify-end' : ''}`}>
                        <span>{user ? 'You' : 'TechGhost AI'}</span>
                        {message.created_at ? <span>· {formatMessageTime(message.created_at)}</span> : null}
                    </div>
                    <div className={`rounded-2xl border px-4 py-3.5 shadow-sm ${user ? 'rounded-br-md border-[#1554c0] bg-[#1554c0] text-white' : 'rounded-tl-md border-slate-200 bg-white dark:border-slate-700 dark:bg-[#172236]'}`}>
                        {user ? <p className="whitespace-pre-wrap text-[13px] leading-6">{message.content}</p> : <AssistantMessage content={message.content} />}
                    </div>
                    {message.id !== 'welcome' ? (
                        <div className={`mt-1 flex items-center gap-1 px-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 ${user ? 'justify-end' : ''}`}>
                            <button type="button" onClick={() => onCopy(message)} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[9px] font-semibold text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200" title="Copy message"><Icon name="copy" className="h-3 w-3" />Copy</button>
                            <button type="button" onClick={() => onResend(message)} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[9px] font-semibold text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200" title={user ? 'Resend message' : 'Regenerate response'}><Icon name="refresh" className="h-3 w-3" />{user ? 'Resend' : 'Regenerate'}</button>
                        </div>
                    ) : null}
                </div>
            </div>
        </article>
    )
}

function conversationGroup(value: string | null) {
    if (!value) return 'Older'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Older'
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
    const diff = Math.round((today - day) / 86400000)
    if (diff <= 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    if (diff < 7) return 'Previous 7 days'
    return 'Older'
}

export default function Chatbot({ student, stats, conversations: initialConversations }: Props) {
    const [conversations, setConversations] = useState<ChatConversation[]>(initialConversations ?? [])
    const [activeConversationId, setActiveConversationId] = useState<number | null>(initialConversations?.[0]?.id ?? null)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [loadingConversation, setLoadingConversation] = useState(false)
    const [creatingConversation, setCreatingConversation] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [renaming, setRenaming] = useState<number | null>(null)
    const [renameValue, setRenameValue] = useState('')
    const [conversationSearch, setConversationSearch] = useState('')
    const [deleteTarget, setDeleteTarget] = useState<ChatConversation | null>(null)
    const [deletingConversation, setDeletingConversation] = useState(false)
    const [notice, setNotice] = useState<string | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

    const activeConversation = useMemo(() => conversations.find(c => c.id === activeConversationId) ?? null, [conversations, activeConversationId])
    const filteredConversations = useMemo(() => conversations.filter(c => c.title.toLowerCase().includes(conversationSearch.trim().toLowerCase())), [conversations, conversationSearch])
    const groupedConversations = useMemo(() => filteredConversations.reduce<Record<string, ChatConversation[]>>((groups, conversation) => {
        const group = conversationGroup(conversation.last_message_at)
        groups[group] ??= []
        groups[group].push(conversation)
        return groups
    }, {}), [filteredConversations])

    useEffect(() => {
        if (activeConversationId === null) { setMessages([]); return }
        let cancelled = false
        setLoadingConversation(true)
        setError(null)
        loadConversation(activeConversationId).then(data => {
            if (!cancelled) setMessages(data.messages)
        }).catch(loadError => {
            if (!cancelled) { setError(safeChatError(loadError)); setMessages([]) }
        }).finally(() => { if (!cancelled) setLoadingConversation(false) })
        return () => { cancelled = true }
    }, [activeConversationId])

    useEffect(() => {
        const node = scrollRef.current
        if (!node) return
        requestAnimationFrame(() => node.scrollTo({ top: node.scrollHeight, behavior: loading ? 'smooth' : 'auto' }))
    }, [messages, loading, activeConversationId])

    useEffect(() => {
        if (!notice) return
        const timer = window.setTimeout(() => setNotice(null), 2200)
        return () => window.clearTimeout(timer)
    }, [notice])

    const copyMessage = async (message: ChatMessage) => {
        try { await navigator.clipboard.writeText(message.content); setNotice('Message copied to clipboard.') } catch { setNotice('Copy is unavailable in this browser.') }
    }

    const shareConversation = async () => {
        if (!activeConversation) return
        const text = messages.filter(m => m.id !== 'welcome').map(m => `${m.role === 'user' ? 'You' : 'TechGhost AI'}\n${m.content}`).join('\n\n')
        if (!text) { setNotice('There is nothing to share yet.'); return }
        try {
            if (navigator.share) await navigator.share({ title: activeConversation.title, text })
            else { await navigator.clipboard.writeText(`${activeConversation.title}\n\n${text}`); setNotice('Conversation copied to clipboard.') }
        } catch (shareError) {
            if (shareError instanceof DOMException && shareError.name === 'AbortError') return
            setNotice('Conversation sharing is unavailable right now.')
        }
    }

    const startNewConversation = async () => {
        if (loading || creatingConversation) return
        setCreatingConversation(true); setError(null)
        try {
            const data = await createConversation()
            setConversations(current => [data.conversation, ...current.filter(item => item.id !== data.conversation.id)])
            setActiveConversationId(data.conversation.id)
            setMessages([]); setInput(''); setRenaming(null); setSidebarOpen(false)
        } catch (requestError) { setError(safeChatError(requestError)) }
        finally { setCreatingConversation(false) }
    }

    const sendPayload = async (conversationId: number | null, history: ChatMessage[]) => {
        const data = await sendChatMessage(conversationId, history.slice(-12).map(({ role, content }) => ({ role, content })))
        setActiveConversationId(data.conversation_id)
        setMessages(current => [...current, { id: data.assistant_message_id, role: 'assistant', content: data.message }])
        const refreshed = await listConversations()
        setConversations(refreshed.conversations)
        return data
    }

    const sendMessage = async (event?: FormEvent) => {
        event?.preventDefault()
        const content = input.trim()
        if (!content || loading || loadingConversation) return
        const userMessage: ChatMessage = { id: `local-${Date.now()}`, role: 'user', content, created_at: new Date().toISOString() }
        const next = [...messages.filter(message => message.id !== 'welcome'), userMessage]
        setMessages(next); setInput(''); setError(null); setLoading(true)
        try { await sendPayload(activeConversationId, next) }
        catch (requestError) { setError(safeChatError(requestError)); setMessages(next) }
        finally { setLoading(false) }
    }

    const resendMessage = async (message: ChatMessage) => {
        if (loading || loadingConversation || message.id === 'welcome') return
        const index = messages.findIndex(item => item.id === message.id)
        if (index < 0) return
        let history: ChatMessage[]
        if (message.role === 'user') history = messages.slice(0, index + 1)
        else {
            const previousUser = [...messages.slice(0, index)].reverse().find(item => item.role === 'user')
            if (!previousUser) return
            const previousIndex = messages.findIndex(item => item.id === previousUser.id)
            history = messages.slice(0, previousIndex + 1)
        }
        setError(null); setLoading(true)
        try { await sendPayload(activeConversationId, history) }
        catch (requestError) { setError(safeChatError(requestError)) }
        finally { setLoading(false) }
    }

    const confirmDeleteConversation = async () => {
        if (!deleteTarget || deletingConversation) return
        setDeletingConversation(true)
        try {
            await deleteConversation(deleteTarget.id)
            const remaining = conversations.filter(c => c.id !== deleteTarget.id)
            setConversations(remaining)
            if (activeConversationId === deleteTarget.id) {
                setActiveConversationId(remaining[0]?.id ?? null)
                setMessages([])
            }
            setDeleteTarget(null)
            setNotice('Conversation deleted.')
        } catch (requestError) { setError(safeChatError(requestError)) }
        finally { setDeletingConversation(false) }
    }

    const saveRename = async (id: number) => {
        const title = renameValue.trim()
        if (!title) return
        try {
            const data = await renameConversation(id, title)
            setConversations(current => current.map(item => item.id === id ? data.conversation : item))
            setRenaming(null)
        } catch (requestError) { setError(safeChatError(requestError)) }
    }

    const visibleMessages = messages.length ? messages : [welcomeMessage(student.name)]

    return (
        <StudentLayout student={student} stats={stats} title="TechGhost AI">
            <Head title="TechGhost AI" />

            <div className="w-full">
                <section className="relative overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-[#101827]">
                    <div className="flex h-[calc(100vh-7rem)] min-h-[620px] max-h-[860px]">
                        {sidebarOpen ? <button type="button" aria-label="Close conversations" onClick={() => setSidebarOpen(false)} className="absolute inset-0 z-20 bg-slate-950/35 backdrop-blur-[1px] lg:hidden" /> : null}

                        <aside className={`absolute inset-y-0 left-0 z-30 w-[min(320px,88vw)] border-r border-slate-200 bg-white shadow-2xl transition-transform duration-200 dark:border-slate-800 dark:bg-[#0d1626] lg:relative lg:z-auto lg:w-[285px] lg:translate-x-0 lg:shadow-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                            <div className="flex h-full min-h-0 flex-col">
                                <div className="shrink-0 border-b border-slate-200 p-3 dark:border-slate-800">
                                    <div className="mb-3 flex items-center justify-between">
                                        <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Your conversations</p><p className="mt-1 text-[9px] text-slate-500 dark:text-slate-400">Private to your student account.</p></div>
                                        <button type="button" onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden" aria-label="Close conversations"><Icon name="x" className="h-4 w-4" /></button>
                                    </div>
                                    <button type="button" onClick={() => void startNewConversation()} disabled={creatingConversation || loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1554c0] px-3 py-2.5 text-[10px] font-bold text-white shadow-sm transition hover:bg-[#1249a8] disabled:cursor-not-allowed disabled:opacity-60">
                                        {creatingConversation ? <><span className="h-3 w-3 animate-spin rounded-full border-2 border-white/35 border-t-white" />Creating…</> : <><Icon name="sparkles" className="h-3.5 w-3.5" />New conversation</>}
                                    </button>
                                    <div className="relative mt-3">
                                        <Icon name="search" className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                        <input value={conversationSearch} onChange={e => setConversationSearch(e.target.value)} placeholder="Search conversations" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-[10px] outline-none focus:border-[#1554c0]/40 dark:border-slate-700 dark:bg-[#111c2e] dark:text-white" />
                                    </div>
                                </div>

                                <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
                                    {filteredConversations.length ? Object.entries(groupedConversations).map(([group, items]) => (
                                        <div key={group} className="mb-4">
                                            <p className="px-2 pb-1.5 text-[8px] font-bold uppercase tracking-[0.13em] text-slate-400">{group}</p>
                                            <div className="space-y-1">
                                                {items.map(conversation => (
                                                    <div key={conversation.id} className={`group rounded-xl border transition ${activeConversationId === conversation.id ? 'border-[#1554c0]/20 bg-[#1554c0]/8 dark:border-[#6ba3ff]/20 dark:bg-[#172945]' : 'border-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-[#111c2e]'}`}>
                                                        {renaming === conversation.id ? (
                                                            <form onSubmit={e => { e.preventDefault(); void saveRename(conversation.id) }} className="p-2">
                                                                <input value={renameValue} onChange={e => setRenameValue(e.target.value)} autoFocus onBlur={() => { if (renameValue.trim()) void saveRename(conversation.id); else setRenaming(null) }} className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[10px] outline-none dark:border-slate-700 dark:bg-[#0f1728] dark:text-white" />
                                                            </form>
                                                        ) : (
                                                            <div className="flex items-center gap-1">
                                                                <button type="button" onClick={() => { setActiveConversationId(conversation.id); setSidebarOpen(false) }} className="min-w-0 flex-1 px-3 py-2.5 text-left">
                                                                    <p className="truncate text-[10px] font-bold text-slate-700 dark:text-slate-200">{conversation.title}</p>
                                                                    <p className="mt-0.5 text-[8px] text-slate-400">{conversation.message_count ?? 0} messages</p>
                                                                </button>
                                                                <div className="flex shrink-0 items-center pr-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                                                                    <button type="button" onClick={() => { setRenaming(conversation.id); setRenameValue(conversation.title) }} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white" title="Rename conversation"><Icon name="edit" className="h-3 w-3" /></button>
                                                                    <button type="button" onClick={() => setDeleteTarget(conversation)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30" title="Delete conversation"><Icon name="trash" className="h-3 w-3" /></button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )) : <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center dark:border-slate-700"><div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800"><Icon name="chatbot" className="h-4 w-4" /></div><p className="mt-3 text-[10px] font-bold text-slate-600 dark:text-slate-300">No conversations found</p><p className="mt-1 text-[9px] leading-4 text-slate-400">Start a new discussion with TechGhost AI.</p></div>}
                                </div>

                                <div className="shrink-0 border-t border-slate-200 p-3 dark:border-slate-800">
                                    <div className="rounded-xl bg-slate-50 p-3 dark:bg-[#111c2e]"><div className="flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1554c0]/10 text-[#1554c0] dark:text-[#8bb8ff]"><Icon name="shield" className="h-3.5 w-3.5" /></div><div><p className="text-[9px] font-bold text-slate-700 dark:text-slate-200">Private learning context</p><p className="text-[8px] text-slate-400">Your LMS data stays tied to your account.</p></div></div></div>
                                </div>
                            </div>
                        </aside>

                        <div className="flex min-w-0 flex-1 flex-col">
                            <header className="flex shrink-0 items-center gap-3 bg-gradient-to-r from-[#1554c0] to-[#6258f4] px-3.5 py-3.5 text-white sm:px-5">
                                <button type="button" onClick={() => setSidebarOpen(true)} className="rounded-lg bg-white/10 p-2 hover:bg-white/15 lg:hidden" aria-label="Open conversations"><Icon name="menu" className="h-4 w-4" /></button>
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/10"><Icon name="chatbot" className="h-4 w-4" /></div>
                                <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h1 className="truncate text-sm font-bold">{activeConversation?.title ?? 'New conversation'}</h1><span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[8px] font-bold text-emerald-100">Online</span></div><p className="mt-0.5 truncate text-[9px] text-blue-100">TechGhost AI · Your personal Learn With Flevian learning assistant</p></div>
                                <button type="button" onClick={() => void shareConversation()} disabled={!activeConversation || loadingConversation || !messages.some(m => m.id !== 'welcome')} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-2 text-[9px] font-bold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40" title="Share conversation"><Icon name="share" className="h-3.5 w-3.5" /><span className="hidden sm:inline">Share</span></button>
                            </header>

                            <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto bg-slate-50/60 px-3 py-5 dark:bg-[#0b1220] sm:px-6">
                                <div className="mx-auto max-w-4xl space-y-5">
                                    <div className="rounded-2xl border border-[#1554c0]/10 bg-gradient-to-br from-[#1554c0]/7 to-[#6258f4]/5 px-4 py-3.5 dark:border-[#6ba3ff]/10 dark:from-[#6ba3ff]/8 dark:to-[#8b7cff]/5"><div className="flex items-start gap-3"><div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1554c0]/10 text-[#1554c0] dark:bg-[#6ba3ff]/10 dark:text-[#8bb8ff]"><Icon name="sparkles" className="h-4 w-4" /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#1554c0] dark:text-[#8bb8ff]">Your learning companion</p><p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">Ask about your courses, progress, assignments, quizzes, feedback, study schedule or concepts you are struggling with. TechGhost AI coaches your learning; it does not submit assessed work for you.</p></div></div></div>

                                    {loadingConversation ? <div className="flex items-center justify-center py-16 text-[10px] text-slate-400"><span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-[#1554c0]" />Loading conversation…</div> : visibleMessages.map(message => <ChatBubble key={message.id} message={message} student={student} onCopy={copyMessage} onResend={resendMessage} />)}

                                    {loading ? <div className="flex items-start gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1554c0]/10 text-[#1554c0] dark:text-[#8bb8ff]"><Icon name="chatbot" className="h-4 w-4" /></div><div className="rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3.5 dark:border-slate-700 dark:bg-[#172236]"><div className="flex items-center gap-2 text-[10px] text-slate-400"><span className="h-2 w-2 animate-pulse rounded-full bg-[#1554c0]" /><span className="h-2 w-2 animate-pulse rounded-full bg-[#1554c0] [animation-delay:120ms]" /><span className="h-2 w-2 animate-pulse rounded-full bg-[#1554c0] [animation-delay:240ms]" /> Thinking through your learning context…</div></div></div> : null}
                                    {error ? <div className="flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[10px] text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200"><span className="leading-5">{error}</span><button type="button" onClick={() => setError(null)} className="shrink-0 rounded-md px-2 py-1 font-bold hover:bg-amber-100 dark:hover:bg-amber-900/30">Dismiss</button></div> : null}
                                </div>
                            </div>

                            <div className="shrink-0 border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-[#101827] sm:p-4">
                                <form onSubmit={sendMessage} className="mx-auto flex max-w-4xl items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 shadow-sm focus-within:border-[#1554c0]/40 dark:border-slate-700 dark:bg-[#111c2e]">
                                    <textarea value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendMessage() } }} disabled={loading || loadingConversation} maxLength={4000} rows={1} placeholder="Ask TechGhost AI about your learning…" className="max-h-32 min-h-10 min-w-0 flex-1 resize-none border-0 bg-transparent px-3 py-2.5 text-xs leading-5 text-slate-800 outline-none placeholder:text-slate-400 dark:text-white" />
                                    <button type="submit" disabled={loading || loadingConversation || !input.trim()} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1554c0] px-4 text-[10px] font-bold text-white transition hover:bg-[#1249a8] disabled:cursor-not-allowed disabled:opacity-50">{loading ? <><span className="h-3 w-3 animate-spin rounded-full border-2 border-white/35 border-t-white" />Sending</> : <><Icon name="arrow" className="h-3.5 w-3.5" />Send</>}</button>
                                </form>
                                <div className="mx-auto mt-2 flex max-w-4xl items-center justify-between px-1 text-[8px] text-slate-400 dark:text-slate-500"><span>Learning guidance only · never submit assignment work through AI.</span><span className="hidden sm:inline">Enter send · Shift+Enter newline</span></div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {notice ? <div className="fixed bottom-5 left-1/2 z-[70] -translate-x-1/2 rounded-xl border border-slate-700 bg-[#111827] px-4 py-2.5 text-[10px] font-semibold text-white shadow-xl">{notice}</div> : null}

            {deleteTarget ? <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-conversation-title">
                <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-[#111827]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"><Icon name="trash" className="h-5 w-5" /></div>
                    <h2 id="delete-conversation-title" className="mt-4 text-sm font-bold text-slate-950 dark:text-white">Delete this conversation?</h2>
                    <p className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">“{deleteTarget.title}” and its saved messages will be permanently removed from your student account. This cannot be undone.</p>
                    <div className="mt-5 flex justify-end gap-2"><button type="button" disabled={deletingConversation} onClick={() => setDeleteTarget(null)} className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button><button type="button" disabled={deletingConversation} onClick={() => void confirmDeleteConversation()} className="inline-flex min-w-[108px] items-center justify-center gap-2 rounded-xl bg-red-600 px-3.5 py-2.5 text-[10px] font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">{deletingConversation ? <><span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />Deleting…</> : <><Icon name="trash" className="h-3.5 w-3.5" />Delete</>}</button></div>
                </div>
            </div> : null}
        </StudentLayout>
    )
}
