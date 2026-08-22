import { router } from '@inertiajs/react'
import { Icon } from './StudentUI'

export default function StudentChatbotWidget() {
    return (
        <button
            type="button"
            onClick={() => router.visit('/chatbot')}
            className="group relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1554c0] to-[#6258f4] text-white shadow-[0_12px_30px_rgba(21,84,192,0.28)] ring-4 ring-white/80 transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(21,84,192,0.34)] focus:outline-none focus:ring-4 focus:ring-[#1554c0]/25 dark:ring-[#0b1020]/80"
            aria-label="Open TechGhost AI"
            title="Open TechGhost AI"
        >
            <Icon name="chatbot" className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400 dark:border-[#0b1020]" />
        </button>
    )
}
