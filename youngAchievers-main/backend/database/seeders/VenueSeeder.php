<?php

namespace Database\Seeders;

use App\Models\AdminUser;
use App\Models\Venue;
use App\Models\VenueAdmin;
use App\Models\VenueSpot;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class VenueSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the first admin user to use as the creator/updater
        $adminUser = AdminUser::first();

        if (!$adminUser) {
            // $this->command->info('No admin users found. Please seed the admin_users table first.');
            return;
        }

        // Create some venues
        $venues = [
            [
                'venue_name' => 'Tech Hub',
                'address' => '123 Innovation Street, Tech City',
                'description' => 'A modern space for tech events.',
                'peak_occupancy' => 150.00,
                'total_events' => 5,
                'revenue_generated' => 50000.00,
                'status' => 'active',
                'created_by' => $adminUser->id,
                'updated_by' => $adminUser->id,
            ],
            [
                'venue_name' => 'Art Gallery',
                'address' => '456 Creative Avenue, Art Town',
                'description' => 'A beautiful space for art exhibitions.',
                'peak_occupancy' => 100.00,
                'total_events' => 3,
                'revenue_generated' => 30000.00,
                'status' => 'active',
                'created_by' => $adminUser->id,
                'updated_by' => $adminUser->id,
            ],
            [
                'venue_name' => 'Conference Center',
                'address' => '789 Business Blvd, Business City',
                'description' => 'A professional space for conferences and meetings.',
                'peak_occupancy' => 200.00,
                'total_events' => 10,
                'revenue_generated' => 100000.00,
                'status' => 'active',
                'created_by' => $adminUser->id,
                'updated_by' => $adminUser->id,
            ],
        ];

        foreach ($venues as $venueData) {
            $venue = Venue::create($venueData);

            // Assign the admin user to the venue
            VenueAdmin::create([
                'venue_id' => $venue->venue_id,
                'user_id' => $adminUser->id,
                'assigned_by' => $adminUser->id,
            ]);

            // Create some venue spots for each venue
            $venueSpots = [
                [
                    'venue_id' => $venue->venue_id,
                    'spot_name' => 'Main Hall',
                    'capacity' => 100,
                    'area' => '25000',
                    'start_time' => '09:00',
                    'end_time' => '17:00',
                    'operative_days' => [1, 2, 3, 4, 5], 
                    'updated_by' => $adminUser->id,
                ],
                [
                    'venue_id' => $venue->venue_id,
                    'spot_name' => 'Meeting Room 1',
                    'capacity' => 20,
                    'area' => '1400',
                    'start_time' => '09:00',
                    'end_time' => '17:00',
                    'operative_days' => [1, 2, 3, 4, 5], 
                    'created_by' => $adminUser->id,
                    'updated_by' => $adminUser->id,
                ],
            ];

            foreach ($venueSpots as $spotData) {
                VenueSpot::create($spotData);
            }
        }
    }
}
