export type ChatRole = 'user' | 'assistant'

export interface ChatConversation {
    id: number
    title: string
    last_message_at: string | null
    message_count?: number
}

export interface ChatMessage {
    id: number | string
    role: ChatRole
    content: string
    created_at?: string
}

function csrfToken(): string {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? ''
}

export function friendlyChatError(status: number): string {
    if (status === 401 || status === 419) {
        return 'Your session needs to be refreshed. Please reload the page and resend your message.'
    }

    if (status === 422) {
        return 'I could not understand that request. Please resend your message.'
    }

    if (status === 429) {
        return 'TechGhost AI is busy right now. Please resend your message in a moment.'
    }

    if (status >= 500) {
        return 'Knowledge base is currently unavailable. Please resend your message.'
    }

    return 'I could not process that request right now. Please resend your message.'
}

export function safeChatError(error: unknown): string {
    if (!(error instanceof Error) || !error.message) {
        return 'Knowledge base is currently unavailable. Please resend your message.'
    }

    if (/internal server error|exception|sqlstate|stack trace|undefined constant|fatal error|syntax error/i.test(error.message)) {
        return 'Knowledge base is currently unavailable. Please resend your message.'
    }

    return error.message
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(url, {
        credentials: 'same-origin',
        ...options,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': csrfToken(),
            ...(options.headers ?? {}),
        },
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
        throw new Error(
            typeof data?.message === 'string' && !/internal server error|exception|sqlstate|stack trace/i.test(data.message)
                ? data.message
                : friendlyChatError(response.status),
        )
    }

    return data as T
}

export function listConversations() {
    return request<{ conversations: ChatConversation[] }>('/chatbot/conversations')
}

export function createConversation(title = 'New conversation') {
    return request<{ conversation: ChatConversation }>('/chatbot/conversations', {
        method: 'POST',
        body: JSON.stringify({ title }),
    })
}

export function loadConversation(id: number) {
    return request<{ conversation: ChatConversation; messages: ChatMessage[] }>(`/chatbot/conversations/${id}`)
}

export function renameConversation(id: number, title: string) {
    return request<{ conversation: ChatConversation }>(`/chatbot/conversations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
    })
}

export function deleteConversation(id: number) {
    return request<{ success: boolean }>(`/chatbot/conversations/${id}`, {
        method: 'DELETE',
    })
}

export function sendChatMessage(conversationId: number | null, messages: Array<{ role: ChatRole; content: string }>) {
    return request<{ conversation_id: number; message: string; user_message_id: number; assistant_message_id: number }>('/chatbot/message', {
        method: 'POST',
        body: JSON.stringify({ conversation_id: conversationId, messages }),
    })
}
