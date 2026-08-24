import { Head } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
import StudentLayout from '../Components/StudentLayout'
import { Card, EmptyState, Icon, SectionHeader } from '../Components/StudentUI'
import type { DashboardStats, Student } from '../Components/student-types'

interface PaymentCourse {
    id: number
    title: string
    slug: string
    thumbnail_path: string | null
    category: string | null
    level: string | null
    price: string | number
    paid_amount: string | number
    due_amount: string | number
    currency: string
    pending_payment_id?: number | null
    pending_status?: string | null
}

interface PaymentItem {
    id: number
    course_id: number
    course: { id: number; title: string; slug: string } | null
    amount: string
    currency: string
    status: 'pending' | 'processing' | 'successful' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded'
    phone: string | null
    receipt_number: string | null
    transaction_reference: string | null
    result_description: string | null
    requested_at: string | null
    completed_at: string | null
    failed_at: string | null
}

interface Props {
    student: Student
    stats: DashboardStats
    courses: PaymentCourse[]
    payments: PaymentItem[]
}

function formatMoney(amount: string | number, currency = 'KES'): string {
    const value = Number(amount)
    if (Number.isNaN(value)) return `${currency} ${amount}`
    return `${currency} ${value.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function formatDate(value: string | null): string {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return new Intl.DateTimeFormat('en-KE', {
        day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
    }).format(date)
}

function maskPhone(phone: string | null): string {
    if (!phone) return '—'
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 7) return phone
    return `${digits.slice(0, 5)}••••${digits.slice(-2)}`
}

function statusLabel(status: PaymentItem['status']): string {
    return status === 'processing' ? 'Awaiting M-Pesa confirmation' : status.charAt(0).toUpperCase() + status.slice(1)
}

function statusClass(status: PaymentItem['status']): string {
    if (status === 'successful') return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    if (status === 'failed' || status === 'cancelled') return 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
    return 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
}

async function jsonRequest(url: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(url, {
        credentials: 'same-origin',
        ...options,
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(options.headers || {}),
        },
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
        const errors = data?.errors
        const firstError = errors && typeof errors === 'object'
            ? Object.values(errors as Record<string, string[]>).flat()[0]
            : null
        throw new Error(firstError || data?.message || 'The payment request could not be completed.')
    }

    return data
}

export default function Payments({ student, stats, courses, payments: initialPayments }: Props) {
    const [payments, setPayments] = useState(initialPayments)
    const [selectedCourse, setSelectedCourse] = useState<PaymentCourse | null>(null)
    const [phone, setPhone] = useState('')
    const [amount, setAmount] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
    const [activePaymentId, setActivePaymentId] = useState<number | null>(null)
    const [receipt, setReceipt] = useState<PaymentItem | null>(null)

    const selectedPending = useMemo(() => {
        if (!selectedCourse) return null
        return payments.find((payment) =>
            payment.course_id === selectedCourse.id && ['pending', 'processing'].includes(payment.status),
        ) || null
    }, [payments, selectedCourse])

    useEffect(() => {
        if (!activePaymentId) return

        let cancelled = false
        let attempts = 0

        const poll = async () => {
            if (cancelled) return
            if (attempts >= 30) {
                setActivePaymentId(null)
                setMessage({ type: 'error', text: 'We have not received M-Pesa confirmation yet. You can close this prompt and try again later.' })
                return
            }
            attempts += 1

            try {
                const data = await jsonRequest(`/payments/${activePaymentId}/status`)
                const updated: PaymentItem = data.payment

                if (cancelled) return

                setPayments((current) => current.map((item) => item.id === updated.id ? updated : item))

                if (updated.status === 'successful') {
                    setMessage({ type: 'success', text: 'Payment confirmed. Your course access is now active.' })
                    setReceipt(updated)
                    setActivePaymentId(null)
                    setSelectedCourse(null)
                    return
                }

                if (['failed', 'cancelled'].includes(updated.status)) {
                    setMessage({ type: 'error', text: updated.result_description || 'The M-Pesa payment was not completed.' })
                    setActivePaymentId(null)
                    return
                }

                window.setTimeout(poll, 3000)
            } catch (error) {
                if (!cancelled) {
                    window.setTimeout(poll, 5000)
                }
            }
        }

        poll()

        return () => {
            cancelled = true
        }
    }, [activePaymentId])

    const openPayment = (course: PaymentCourse) => {
        setSelectedCourse(course)
        setPhone('')
        setAmount(String(course.due_amount))
        setActivePaymentId(null)
        setSubmitting(false)
        setMessage(null)
    }

    const outstandingAmount = selectedCourse ? Number(selectedCourse.due_amount) : 0
    const enteredAmount = Number(amount)
    const amountIsValid = Number.isFinite(enteredAmount)
        && enteredAmount >= 1
        && enteredAmount <= outstandingAmount

    const handleAmountChange = (value: string) => {
        if (value === '' || /^\d*(\.\d{0,2})?$/.test(value)) {
            const numeric = value === '' ? 0 : Number(value)

            if (Number.isFinite(numeric) && numeric > outstandingAmount) {
                setAmount(String(outstandingAmount))
                setMessage({
                    type: 'error',
                    text: `Maximum payment is ${formatMoney(outstandingAmount, selectedCourse?.currency)}. This is your remaining course balance.`,
                })
                return
            }

            setAmount(value)
            if (message?.type === 'error') setMessage(null)
        }
    }

    const submitPayment = async () => {
        if (!selectedCourse) return

        const digits = phone.replace(/\D/g, '')
        const validPhone = /^(0(7\d{8}|1\d{8})|254(7\d{8}|1\d{8}))$/.test(digits)

        if (!validPhone) {
            setMessage({ type: 'error', text: 'Enter a valid Kenyan M-Pesa number, for example 0712 345 678.' })
            return
        }

        if (!amountIsValid) {
            setMessage({
                type: 'error',
                text: `Enter an amount from KES 1 up to ${formatMoney(outstandingAmount, selectedCourse.currency)}.`,
            })
            return
        }

        if (selectedPending) {
            setMessage({ type: 'info', text: 'An M-Pesa prompt is already awaiting confirmation for this course.' })
            return
        }

        setSubmitting(true)
        setActivePaymentId(null)
        setMessage({ type: 'info', text: 'Verifying your details and sending the M-Pesa prompt…' })

        try {
            const data = await jsonRequest('/payments/stk-push', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    course_id: selectedCourse.id,
                    phone,
                    amount: enteredAmount,
                }),
            })

            const payment: PaymentItem = data.payment
            setPayments((current) => [payment, ...current.filter((item) => item.id !== payment.id)])
            setActivePaymentId(payment.id)
            setMessage({ type: 'success', text: data.message || 'M-Pesa prompt sent. Check your phone.' })
        } catch (error) {
            // A failed STK request must always unlock the form so the student
            // can correct the details and immediately retry.
            setActivePaymentId(null)
            setMessage({
                type: 'error',
                text: error instanceof Error ? error.message : 'We could not send the M-Pesa prompt. Please verify your details and try again.',
            })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <StudentLayout student={student} stats={stats} title="Payments">
            <Head title="Payments" />

            <div className="space-y-7">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1554c0] dark:text-[#6ba3ff]">Student payments</p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Course payments</h1>
                        <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 dark:text-slate-400">Pay securely with M-Pesa and keep a clear record of every course payment and receipt.</p>
                    </div>
                    <div className="rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2 text-[11px] font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
                        M-Pesa STK Push
                    </div>
                </div>

                {message ? (
                    <div className={`rounded-2xl border px-4 py-3 text-xs font-medium ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300' : message.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300' : 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300'}`}>
                        {message.text}
                    </div>
                ) : null}

                <section>
                    <SectionHeader title="Courses awaiting payment" description="Paid courses you are enrolled in with an outstanding balance." />
                    {courses.length === 0 ? (
                        <EmptyState icon="check" title="You're all caught up" description="There are no unpaid paid courses waiting for you right now." />
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {courses.map((course) => (
                                <Card key={course.id} className="overflow-hidden">
                                    <div className="p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf4ff] text-[#1554c0] dark:bg-[#172945] dark:text-[#8bb8ff]">
                                                <Icon name="book" className="h-5 w-5" />
                                            </div>
                                            <span className="rounded-full bg-[#1554c0]/[0.08] px-2.5 py-1 text-[10px] font-bold text-[#1554c0] dark:text-[#8bb8ff]">
                                                Due {formatMoney(course.due_amount, course.currency)}
                                            </span>
                                        </div>
                                        <h3 className="mt-4 text-sm font-bold leading-5 text-slate-950 dark:text-white">{course.title}</h3>
                                        <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{course.category || 'Course'}{course.level ? ` · ${course.level}` : ''}</p>
                                        {course.pending_status ? (
                                            <div className="mt-4 rounded-xl bg-amber-500/10 px-3 py-2 text-[10px] font-semibold text-amber-700 dark:text-amber-300">Payment awaiting confirmation</div>
                                        ) : null}
                                        <button
                                            type="button"
                                            onClick={() => openPayment(course)}
                                            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1554c0] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1249a8] disabled:opacity-60"
                                        >
                                            <span>{course.pending_status ? 'Continue payment' : 'Pay with M-Pesa'}</span>
                                            <Icon name="arrow" className="h-4 w-4" />
                                        </button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </section>

                <section>
                    <SectionHeader title="Payment history" description="Your latest M-Pesa payment activity and receipts." />
                    {payments.length === 0 ? (
                        <EmptyState icon="clock" title="No payments yet" description="Successful, pending and failed course payment attempts will appear here." />
                    ) : (
                        <Card className="overflow-hidden">
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {payments.map((payment) => (
                                    <div key={payment.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{payment.course?.title || 'Course payment'}</p>
                                            <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{formatDate(payment.requested_at)} · {maskPhone(payment.phone)}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-slate-900 dark:text-white">{formatMoney(payment.amount, payment.currency)}</p>
                                                <span className={`mt-1 inline-flex rounded-full px-2 py-1 text-[9px] font-bold ${statusClass(payment.status)}`}>{statusLabel(payment.status)}</span>
                                            </div>
                                            {payment.status === 'successful' ? (
                                                <button type="button" onClick={() => setReceipt(payment)} className="rounded-xl border border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                                                    Receipt
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </section>
            </div>

            {selectedCourse ? (
                <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:items-center">
                    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-[#111827]">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#1554c0] dark:text-[#6ba3ff]">M-Pesa payment</p>
                                <h2 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">{selectedCourse.title}</h2>
                            </div>
                            <button type="button" onClick={() => setSelectedCourse(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><Icon name="x" className="h-5 w-5" /></button>
                        </div>

                        <div className="mt-5 rounded-2xl bg-[#f7f9fd] p-4 dark:bg-[#0c1422]">
                            <div className="space-y-2 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 dark:text-slate-400">Course price</span>
                                    <strong className="text-slate-900 dark:text-white">{formatMoney(selectedCourse.price, selectedCourse.currency)}</strong>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 dark:text-slate-400">Already paid</span>
                                    <strong className="text-slate-900 dark:text-white">{formatMoney(selectedCourse.paid_amount, selectedCourse.currency)}</strong>
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-200 pt-2 dark:border-slate-700">
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">Outstanding</span>
                                    <strong className="text-[#1554c0] dark:text-[#8bb8ff]">{formatMoney(selectedCourse.due_amount, selectedCourse.currency)}</strong>
                                </div>
                            </div>
                            <p className="mt-3 text-[10px] leading-4 text-slate-500 dark:text-slate-400">You may pay in instalments. Enter any amount from KES 1 up to the outstanding balance.
                            </p>
                        </div>

                        <label className="mt-5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                            M-Pesa phone number
                            <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="0712 345 678" inputMode="tel" autoComplete="tel" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none ring-[#1554c0]/20 focus:border-[#1554c0] focus:ring-4 dark:border-slate-700 dark:bg-[#0c1422] dark:text-white" />
                        </label>

                        <label className="mt-4 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                            Amount (KES)
                            <input
                                value={amount}
                                onChange={(event) => handleAmountChange(event.target.value)}
                                inputMode="decimal"
                                min="1"
                                max={outstandingAmount}
                                step="0.01"
                                aria-invalid={amount !== '' && !amountIsValid}
                                className={`mt-2 w-full rounded-xl border bg-white px-3 py-3 text-sm font-semibold outline-none ring-[#1554c0]/20 focus:border-[#1554c0] focus:ring-4 dark:bg-[#0c1422] dark:text-white ${amount !== '' && !amountIsValid ? 'border-rose-400 dark:border-rose-700' : 'border-slate-200 dark:border-slate-700'}`}
                            />
                            <p className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400">Maximum: {formatMoney(selectedCourse.due_amount, selectedCourse.currency)}</p>
                        </label>

                        {selectedPending ? (
                            <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-2.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300"><Icon name="clock" className="h-4 w-4" />A payment is already awaiting confirmation.</div>
                        ) : null}

                        <button type="button" disabled={submitting || !!activePaymentId || !!selectedPending} onClick={submitPayment} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1554c0] px-4 py-3 text-xs font-bold text-white shadow-sm hover:bg-[#1249a8] disabled:cursor-not-allowed disabled:opacity-60">
                            {submitting || activePaymentId ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Icon name="check" className="h-4 w-4" />}
                            <span>{activePaymentId ? 'Waiting for M-Pesa confirmation…' : selectedPending ? 'M-Pesa prompt pending…' : submitting ? 'Sending STK Push…' : 'Send M-Pesa Prompt'}</span>
                        </button>
                    </div>
                </div>
            ) : null}

            {receipt ? (
                <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:items-center">
                    <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#111827]">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"><Icon name="check" className="h-6 w-6" /></div>
                        <div className="mt-4 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-300">Payment successful</p>
                            <h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">Payment receipt</h2>
                        </div>
                        <div className="mt-5 space-y-3 rounded-2xl bg-[#f7f9fd] p-4 text-xs dark:bg-[#0c1422]">
                            <div className="flex justify-between gap-4"><span className="text-slate-500">Course</span><strong className="text-right text-slate-900 dark:text-white">{receipt.course?.title}</strong></div>
                            <div className="flex justify-between gap-4"><span className="text-slate-500">Amount</span><strong className="text-slate-900 dark:text-white">{formatMoney(receipt.amount, receipt.currency)}</strong></div>
                            <div className="flex justify-between gap-4"><span className="text-slate-500">M-Pesa receipt</span><strong className="text-slate-900 dark:text-white">{receipt.receipt_number || '—'}</strong></div>
                            <div className="flex justify-between gap-4"><span className="text-slate-500">Paid</span><strong className="text-right text-slate-900 dark:text-white">{formatDate(receipt.completed_at)}</strong></div>
                        </div>
                        <button type="button" onClick={() => setReceipt(null)} className="mt-5 w-full rounded-xl bg-[#1554c0] px-4 py-3 text-xs font-bold text-white hover:bg-[#1249a8]">Done</button>
                    </div>
                </div>
            ) : null}
        </StudentLayout>
    )
}
