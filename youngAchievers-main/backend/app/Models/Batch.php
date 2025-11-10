<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Batch extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'program_id',
        'type',
        'venue_id',
        'venue_spot_id',
        'capacity',
        'description',
        'start_date',
        'end_date',
        'session_start_time',
        'session_end_time',
        'no_of_sessions',
        'schedule_pattern',
        'amount',
        'currency',
        'discount_available',
        'discount_percentage',
        'status',
        'progress',
        'fee_configuration',
        'selected_session_dates',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'fee_configuration' => 'array',
        'discount_available' => 'boolean',
        'amount' => 'float',
        'selected_session_dates' => 'array',
    ];

    public function program()
    {
        return $this->belongsTo(Program::class);
    }

    public function venue()
    {
        return $this->belongsTo(Venue::class, 'venue_id', 'venue_id');
    }

    public function venueSpot()
    {
        return $this->belongsTo(VenueSpot::class, 'venue_spot_id', 'venue_spot_id');
    }

    public function partners()
    {
        return $this->belongsToMany(Partner::class, 'batch_partner');
    }

    public function batchSessions()
    {
        return $this->hasMany(BatchSession::class);
    }

    public function members()
    {
        return $this->belongsToMany(Member::class, 'batch_members');
    }


    public function getMemberCountAttribute(): int
    {
        if ($this->relationLoaded('members')) {
            return $this->members->count();
        }

        return $this->members()->count();
    }

}