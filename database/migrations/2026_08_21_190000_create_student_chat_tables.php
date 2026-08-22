<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_chat_conversations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('title', 120)->default('New conversation');
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'last_message_at'], 'student_chat_conversation_user_recent_index');
        });

        Schema::create('student_chat_messages', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('conversation_id')->constrained('student_chat_conversations')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('role', 20);
            $table->longText('content');
            $table->string('model', 180)->nullable();
            $table->timestamps();

            $table->index(['conversation_id', 'created_at'], 'student_chat_message_conversation_time_index');
            $table->index(['user_id', 'created_at'], 'student_chat_message_user_time_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_chat_messages');
        Schema::dropIfExists('student_chat_conversations');
    }
};
