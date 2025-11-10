<?php

namespace Database\Seeders;

use App\Models\Batch;
use Illuminate\Database\Seeder;

class BatchSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Assuming you have some programs, venues, spots, and partners already seeded
        $batches = [
            [
                'program_id' => 1, // Replace with an actual program ID
                'name' => 'Chess Beginners - Batch 1',
                'venue_id' => 1, // Replace with an actual venue ID
                'spot_id' => 1, // Replace with an actual spot ID
                'partner_id' => 1, // Replace with an actual partner ID
                'mode' => 'Fixed',
                'capacity' => 20,
                'occupancy' => 15,
                'status' => 'Active',
                'notes' => 'Beginner chess class',
            ],
            [
                'program_id' => 2, // Replace with an actual program ID
                'name' => 'Math Advanced - Batch A',
                'venue_id' => 2, // Replace with an actual venue ID
                'spot_id' => 2, // Replace with an actual spot ID
                'partner_id' => 2, // Replace with an actual partner ID
                'mode' => 'Recurring',
                'capacity' => 15,
                'occupancy' => 10,
                'status' => 'Active',
                'notes' => 'Advanced math tutoring',
            ],
        ];

        foreach ($batches as $batchData) {
            Batch::create($batchData);
        }
    }
}