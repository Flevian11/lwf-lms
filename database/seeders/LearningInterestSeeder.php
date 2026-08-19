<?php

namespace Database\Seeders;

use App\Models\LearningInterest;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class LearningInterestSeeder extends Seeder
{
    public function run(): void
    {
        $interests = [
            'Web Development',
            'Programming',
            'Software Engineering',
            'Technology',
            'Business',
            'Data & Analytics',
            'Digital Skills',
            'Career Development',
        ];

        foreach ($interests as $name) {
            LearningInterest::updateOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name]
            );
        }
    }
}