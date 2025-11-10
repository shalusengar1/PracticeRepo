<?php

namespace Database\Seeders;

use App\Models\Partner;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class PartnerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $partners = [
            [
                'name' => 'John Doe',
                'specialization' => 'Chess Instructor',
                'status' => 'Active',
                'pay_type' => 'Fixed',
                'pay_amount' => 50000,
                'payment_terms' => 'Quarterly',
                'email' => 'john.doe@example.com',
                'password' => Hash::make('password'),
                'mobile' => '123-456-7890',
                'created_by' => 1,
                'updated_by' => 1,
            ],
            [
                'name' => 'Jane Smith',
                'specialization' => 'Math Tutor',
                'status' => 'Active',
                'pay_type' => 'Revenue Share',
                'pay_percentage' => 20,
                'payment_terms' => 'Monthly',
                'email' => 'jane.smith@example.com',
                'password' => Hash::make('securepass'),
                'mobile' => '987-654-3210',
                'created_by' => 1,
                'updated_by' => 1,
            ],
            [
                'name' => 'David Lee',
                'specialization' => 'Coding Instructor',
                'status' => 'InActive',
                'pay_type' => 'Fixed',
                'pay_amount' => 60000,
                'email' => 'david.lee@example.com',
                'password' => Hash::make('codepass'),
                'mobile' => '555-123-4567',
                'created_by' => 1,
                'updated_by' => 1,
            ],
        ];

        foreach ($partners as $partnerData) {
            Partner::create($partnerData);
        }
    }
}