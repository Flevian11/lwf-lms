<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class SystemRoleSeeder extends Seeder
{
    /**
     * Seed the application's system roles.
     */
    public function run(): void
    {
        Role::findOrCreate('Admin', 'web');
        Role::findOrCreate('Student', 'web');
    }
}