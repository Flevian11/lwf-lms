<?php

namespace Database\Seeders;

use App\Models\Quiz;
use App\Models\QuizOption;
use App\Models\QuizQuestion;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TestQuizSeeder extends Seeder
{
    public function run(): void
    {
        $courseId = 18;
        $createdBy = 10;
        $slug = 'git-github-fundamentals-secure-quiz-test';

        $quiz = Quiz::query()->updateOrCreate(
            ['slug' => $slug],
            [
                'course_id' => $courseId,
                'module_id' => null,
                'lesson_id' => null,
                'created_by' => $createdBy,
                'title' => 'Git & GitHub Fundamentals — Secure Quiz Test',
                'description' => 'A five-question timed test quiz used to verify autosave, fullscreen enforcement, violation handling, countdown expiry and server-side grading.',
                'time_limit_minutes' => 2,
                'passing_score' => 70,
                'max_attempts' => 3,
                'shuffle_questions' => false,
                'shuffle_options' => false,
                'status' => 'published',
                'available_from' => now()->subMinute(),
                'due_at' => now()->addDays(7),
            ],
        );

        DB::transaction(function () use ($quiz): void {
            QuizQuestion::query()->where('quiz_id', $quiz->id)->delete();

            $questions = [
                [
                    'question' => 'Which Git command creates a new local branch and switches to it immediately?',
                    'points' => 20,
                    'position' => 1,
                    'explanation' => 'git switch -c creates the branch and checks it out in one operation.',
                    'options' => [
                        ['text' => 'git switch -c feature-name', 'correct' => true],
                        ['text' => 'git branch --delete feature-name', 'correct' => false],
                        ['text' => 'git merge feature-name', 'correct' => false],
                        ['text' => 'git remote add feature-name', 'correct' => false],
                    ],
                ],
                [
                    'question' => 'Which command uploads a local branch and establishes its remote upstream on GitHub?',
                    'points' => 20,
                    'position' => 2,
                    'explanation' => 'git push -u origin branch-name pushes the branch and sets origin/branch-name as its upstream.',
                    'options' => [
                        ['text' => 'git push -u origin branch-name', 'correct' => true],
                        ['text' => 'git pull -u origin branch-name', 'correct' => false],
                        ['text' => 'git clone -u origin branch-name', 'correct' => false],
                        ['text' => 'git fetch -u origin branch-name', 'correct' => false],
                    ],
                ],
                [
                    'question' => 'What is the normal purpose of a GitHub pull request?',
                    'points' => 20,
                    'position' => 3,
                    'explanation' => 'A pull request proposes merging changes from one branch into another so they can be reviewed before integration.',
                    'options' => [
                        ['text' => 'Review and merge proposed branch changes', 'correct' => true],
                        ['text' => 'Delete the entire Git repository', 'correct' => false],
                        ['text' => 'Replace the local Git installation', 'correct' => false],
                        ['text' => 'Change a user password', 'correct' => false],
                    ],
                ],
                [
                    'question' => 'Which Git command records staged changes in the local repository history?',
                    'points' => 20,
                    'position' => 4,
                    'explanation' => 'git commit creates a new commit from the changes currently staged in the index.',
                    'options' => [
                        ['text' => 'git commit -m "message"', 'correct' => true],
                        ['text' => 'git status -m "message"', 'correct' => false],
                        ['text' => 'git remote -m "message"', 'correct' => false],
                        ['text' => 'git checkout -m "message"', 'correct' => false],
                    ],
                ],
                [
                    'question' => 'In a typical GitHub workflow, which branch is commonly used as the primary integration branch?',
                    'points' => 20,
                    'position' => 5,
                    'explanation' => 'main is the conventional primary branch name in modern GitHub repositories, although projects can configure another default branch.',
                    'options' => [
                        ['text' => 'main', 'correct' => true],
                        ['text' => 'tmp-only', 'correct' => false],
                        ['text' => 'deleted', 'correct' => false],
                        ['text' => 'archive-bin', 'correct' => false],
                    ],
                ],
            ];

            foreach ($questions as $questionData) {
                $question = QuizQuestion::create([
                    'quiz_id' => $quiz->id,
                    'question' => $questionData['question'],
                    'type' => 'single_choice',
                    'points' => $questionData['points'],
                    'position' => $questionData['position'],
                    'explanation' => $questionData['explanation'],
                ]);

                foreach ($questionData['options'] as $position => $option) {
                    QuizOption::create([
                        'question_id' => $question->id,
                        'option_text' => $option['text'],
                        'is_correct' => $option['correct'],
                        'position' => $position + 1,
                    ]);
                }
            }
        });

        $this->command?->info("Test quiz ready: {$quiz->id} — {$quiz->title}");
        $this->command?->info('Course: 18 (Git & GitHub for Developers), Student test user: 9 (Ramp Wanjohi).');
        $this->command?->info('Time limit: 2 minutes | Passing score: 70% | Max attempts: 3.');
    }
}
