<?php

namespace Database\Seeders;

use App\Models\Venue;
use App\Models\VenueHoliday;
use Illuminate\Database\Seeder;

class VenueHolidaySeeder extends Seeder
{
    public function run(): void
    {
        $venues = Venue::all();
        $adminUserId = 1; // Assuming the first admin user has ID 1

        foreach ($venues as $venue) {
            // Example: Christmas Day (recurring)
            VenueHoliday::create([
                'venue_id' => $venue->venue_id,
                'name' => 'Christmas Day',
                'holiday_type' => 'recurring',
                'recurring_day' => 0, // Sunday (December 25th)
                'created_by' => $adminUserId,
            ]);

            // Example: New Year's Day (specific)
            VenueHoliday::create([
                'venue_id' => $venue->venue_id,
                'name' => "New Year's Day",
                'holiday_type' => 'specific',
                'date' => '2025-01-01',
                'created_by' => $adminUserId,
            ]);

            // Example: Summer Break (specific range)
            VenueHoliday::create([
                'venue_id' => $venue->venue_id,
                'name' => 'Summer Break',
                'holiday_type' => 'specific',
                'start_date' => '2025-07-01',
                'end_date' => '2025-07-15',
                'created_by' => $adminUserId,
            ]);
        }
    }
}
