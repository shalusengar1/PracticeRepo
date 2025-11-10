<?php

namespace Database\Seeders;

use App\Models\Program;
use Illuminate\Database\Seeder;

class ProgramSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $programs = [
            [
                'name' => 'Chess for Beginners',
                'description' => 'An introductory program to learn the basics of chess.',
            ],
            [
                'name' => 'Advanced Math Tutoring',
                'description' => 'Tutoring sessions for advanced math concepts.',
            ],
            [
                'name' => 'Coding Fundamentals',
                'description' => 'A program covering the fundamentals of programming.',
            ],
        ];

        foreach ($programs as $programData) {
            Program::create($programData);
        }
    }
}
