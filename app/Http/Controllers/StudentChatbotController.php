<?php

namespace App\Http\Controllers;

use App\Models\StudentChatConversation;
use App\Models\User;
use App\Services\AuditLogService;
use App\Services\StudentChatbotService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class StudentChatbotController extends Controller
{
    public function page(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        $dashboard = app(\App\Services\StudentDashboardService::class)->getDashboardData($user);

        return Inertia::render('Chatbot', [
            'student' => $dashboard['student'],
            'stats' => $dashboard['stats'],
            'conversations' => $this->conversationList($user),
        ]);
    }

    public function conversations(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        return response()->json([
            'conversations' => $this->conversationList($user),
        ]);
    }

    public function storeConversation(
        Request $request,
        AuditLogService $auditLogService,
    ): JsonResponse {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:120'],
        ]);

        $conversation = StudentChatConversation::create([
            'user_id' => $user->id,
            'title' => trim((string) ($validated['title'] ?? 'New conversation')) ?: 'New conversation',
        ]);

        $auditLogService->userEvent('student_ai_conversation_created', $request, [
            'action' => 'create_chatbot_conversation',
            'metadata' => ['conversation_id' => $conversation->id],
        ]);

        return response()->json([
            'conversation' => $this->conversationPayload($conversation),
        ], 201);
    }

    public function showConversation(Request $request, int $conversation): JsonResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        $record = $this->ownedConversation($user, $conversation);

        return response()->json([
            'conversation' => $this->conversationPayload($record),
            'messages' => $record->messages()
                ->orderBy('id')
                ->limit(100)
                ->get()
                ->map(fn ($message) => [
                    'id' => $message->id,
                    'role' => $message->role,
                    'content' => $message->content,
                    'created_at' => $message->created_at?->toISOString(),
                ])
                ->values()
                ->all(),
        ]);
    }

    public function renameConversation(
        Request $request,
        int $conversation,
        AuditLogService $auditLogService,
    ): JsonResponse {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        $record = $this->ownedConversation($user, $conversation);
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:120'],
        ]);

        $record->update([
            'title' => trim($validated['title']) ?: 'New conversation',
        ]);

        $auditLogService->userEvent('student_ai_conversation_renamed', $request, [
            'action' => 'rename_chatbot_conversation',
            'metadata' => ['conversation_id' => $record->id],
        ]);

        return response()->json([
            'conversation' => $this->conversationPayload($record->fresh()),
        ]);
    }

    public function destroyConversation(
        Request $request,
        int $conversation,
        AuditLogService $auditLogService,
    ): JsonResponse {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        $record = $this->ownedConversation($user, $conversation);
        $recordId = $record->id;
        $record->delete();

        $auditLogService->userEvent('student_ai_conversation_deleted', $request, [
            'action' => 'delete_chatbot_conversation',
            'metadata' => ['conversation_id' => $recordId],
        ]);

        return response()->json(['success' => true]);
    }

    public function message(
        Request $request,
        StudentChatbotService $chatbot,
        AuditLogService $auditLogService,
    ): JsonResponse {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        $validated = $request->validate([
            'conversation_id' => ['nullable', 'integer'],
            'messages' => ['required', 'array', 'min:1', 'max:12'],
            'messages.*.role' => ['required', 'in:user,assistant'],
            'messages.*.content' => ['required', 'string', 'max:4000'],
        ]);

        $conversation = isset($validated['conversation_id']) && $validated['conversation_id'] !== null
            ? $this->ownedConversation($user, (int) $validated['conversation_id'])
            : StudentChatConversation::create([
                'user_id' => $user->id,
                'title' => $this->conversationTitle($user, $validated['messages']),
            ]);

        $messages = $validated['messages'];

        try {
            $result = $chatbot->reply($user, $messages);

            $userMessage = collect($messages)
                ->reverse()
                ->first(fn ($message) => $message['role'] === 'user');

            $userRecord = null;
            if (is_array($userMessage)) {
                $userRecord = $conversation->messages()->create([
                    'user_id' => $user->id,
                    'role' => 'user',
                    'content' => $userMessage['content'],
                ]);
            }

            $assistantMessage = $conversation->messages()->create([
                'user_id' => $user->id,
                'role' => 'assistant',
                'content' => $result['message'],
            ]);

            $conversation->update([
                'last_message_at' => now(),
                'title' => $conversation->title === 'New conversation'
                    ? $this->conversationTitle($user, $messages)
                    : $conversation->title,
            ]);

            $auditLogService->userEvent('student_ai_chat', $request, [
                'action' => 'chatbot_message',
                'metadata' => [
                        'message_count' => count($messages),
                    'conversation_id' => $conversation->id,
                ],
            ]);

            return response()->json([
                'conversation_id' => $conversation->id,
                'message' => $result['message'],
                'user_message_id' => $userRecord?->id,
                'assistant_message_id' => $assistantMessage->id,
            ]);
        } catch (Throwable $exception) {
            report($exception);

            $auditLogService->userEvent('student_ai_chat_failed', $request, [
                'action' => 'chatbot_message_failed',
                'metadata' => [
                    'conversation_id' => $conversation->id,
                    'error_class' => $exception::class,
                ],
            ]);

            return response()->json([
                'message' => $this->friendlyFailure($exception),
                'conversation_id' => $conversation->id,
            ], $this->failureStatus($exception));
        }
    }

    private function conversationList(User $user): array
    {
        return StudentChatConversation::query()
            ->where('user_id', $user->id)
            ->withCount('messages')
            ->orderByDesc('last_message_at')
            ->orderByDesc('id')
            ->limit(40)
            ->get()
            ->map(fn ($conversation) => $this->conversationPayload($conversation))
            ->values()
            ->all();
    }

    private function ownedConversation(User $user, int $id): StudentChatConversation
    {
        return StudentChatConversation::query()
            ->where('user_id', $user->id)
            ->findOrFail($id);
    }

    private function conversationPayload(StudentChatConversation $conversation): array
    {
        return [
            'id' => $conversation->id,
            'title' => $conversation->title,
            'last_message_at' => $conversation->last_message_at?->toISOString(),
            'message_count' => $conversation->messages_count ?? $conversation->messages()->count(),
        ];
    }

    private function conversationTitle(User $user, array $messages): string
    {
        $userMessage = collect($messages)->first(fn ($message) => ($message['role'] ?? null) === 'user');
        $text = trim((string) ($userMessage['content'] ?? ''));

        if ($text === '') {
            return 'New conversation';
        }

        $text = preg_replace('/https?:\/\/\S+/i', '', $text) ?: $text;
        $text = preg_replace('/[`*_#>\[\]{}]/', '', $text) ?: $text;
        $text = preg_replace('/\s+/', ' ', $text) ?: $text;
        $text = trim($text, " \t\n\r\0\x0B.,!?;:-");

        $courseTitles = $user->courseEnrollments()
            ->with('course')
            ->whereIn('status', ['active', 'completed'])
            ->latest('enrolled_at')
            ->limit(8)
            ->get()
            ->map(fn ($enrollment) => trim((string) ($enrollment->course?->title ?? '')))
            ->filter()
            ->sortByDesc(fn ($title) => mb_strlen($title))
            ->values();

        foreach ($courseTitles as $courseTitle) {
            if (mb_stripos($text, $courseTitle) !== false) {
                $remainder = trim(str_ireplace($courseTitle, '', $text));
                $topic = $this->compactTitleTopic($remainder ?: $text);
                return Str::limit(
                    $this->titleCaseTechnicalTerms($topic !== '' ? $topic . ' · ' . $courseTitle : $courseTitle),
                    48,
                    '…'
                );
            }
        }

        $patterns = [
            '/^(?:where|how) (?:do i|can i)?\s*(?:find|see|locate|open|access)\s+(.+)$/i' => fn ($m) => 'Find ' . $m[1],
            '/^(?:how)\s+(?:do i|can i|should i)\s+(.+)$/i' => fn ($m) => 'How to ' . $m[1],
            '/^what (?:is|are)\s+(.+)$/i' => fn ($m) => 'Understanding ' . $m[1],
            '/^why\s+(?:is|does|do|are)\s+(.+)$/i' => fn ($m) => 'Why ' . $m[1],
            '/^(?:explain|teach me)\s+(.+)$/i' => fn ($m) => 'Explain ' . $m[1],
            '/^(?:help me with|help with)\s+(.+)$/i' => fn ($m) => 'Help with ' . $m[1],
            '/^(?:prepare me for|study|learn)\s+(.+)$/i' => fn ($m) => 'Study ' . $m[1],
            '/^(?:review|analyse|analyze)\s+(.+)$/i' => fn ($m) => 'Review ' . $m[1],
        ];

        foreach ($patterns as $pattern => $builder) {
            if (preg_match($pattern, $text, $matches)) {
                $title = $this->compactTitleTopic($builder($matches));
                return Str::limit($this->titleCaseTechnicalTerms($title), 48, '…');
            }
        }

        $title = $this->compactTitleTopic($text);
        return Str::limit($this->titleCaseTechnicalTerms($title ?: 'New conversation'), 48, '…');
    }

    private function compactTitleTopic(string $text): string
    {
        $text = preg_replace('/\s+/', ' ', trim($text)) ?: '';
        $text = preg_replace('/^(please|can you|could you|i want to|i need to|tell me)\s+/i', '', $text) ?: $text;
        $text = preg_replace('/\b(please|thanks|thank you)\b[.!?]*$/i', '', $text) ?: $text;
        $text = trim($text, " \t\n\r\0\x0B.,!?;:-");

        $words = preg_split('/\s+/', $text) ?: [];
        $stop = [
            'the','a','an','and','or','but','for','to','of','in','on','with','my','me','i','is','are','can','please',
            'about','this','that','it','do','does','did','how','what','why','where','which','should','would','could',
        ];

        $keywords = [];
        foreach ($words as $word) {
            $clean = trim($word, ".,!?;:()\"'");
            if ($clean === '' || in_array(mb_strtolower($clean), $stop, true)) {
                continue;
            }
            $keywords[] = $clean;
            if (count($keywords) >= 6) {
                break;
            }
        }

        return implode(' ', $keywords);
    }

    private function titleCaseTechnicalTerms(string $title): string
    {
        $title = trim($title);
        $replacements = [
            'github' => 'GitHub', 'git' => 'Git', 'laravel' => 'Laravel', 'php' => 'PHP',
            'react' => 'React', 'typescript' => 'TypeScript', 'javascript' => 'JavaScript',
            'html' => 'HTML', 'css' => 'CSS', 'api' => 'API', 'sql' => 'SQL', 'ui' => 'UI',
            'ux' => 'UX', 'ai' => 'AI', 'lms' => 'LMS',
        ];
        foreach ($replacements as $from => $to) {
            $title = preg_replace('/\b' . preg_quote($from, '/') . '\b/i', $to, $title) ?? $title;
        }
        return ucfirst($title);
    }

    private function friendlyFailure(Throwable $exception): string
    {
        $message = strtolower($exception->getMessage());

        if (str_contains($message, 'knowledge base')) {
            return 'Knowledge base is currently unavailable. Please resend your message.';
        }

        if (str_contains($message, 'rate') || str_contains($message, '429')) {
            return 'TechGhost AI is busy right now. Please resend your message in a moment.';
        }

        if (str_contains($message, 'timeout') || str_contains($message, 'timed out')) {
            return 'The AI took too long to respond. Please resend your message.';
        }

        if (str_contains($message, 'not configured')) {
            return 'TechGhost AI is not configured yet. Please contact support.';
        }

        return 'The learning assistant is temporarily unavailable. Please resend your message.';
    }

    private function failureStatus(Throwable $exception): int
    {
        $message = strtolower($exception->getMessage());

        if (str_contains($message, 'rate') || str_contains($message, '429')) {
            return 429;
        }

        if (str_contains($message, 'not configured')) {
            return 503;
        }

        return 503;
    }
}
