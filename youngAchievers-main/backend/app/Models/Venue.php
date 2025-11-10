<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Venue extends Model
{
    use HasFactory, SoftDeletes; // Added SoftDeletes trait

    protected $fillable = [
        'venue_name',
        'address',
        'description',
        'latitude',
        'longitude',
        'peak_occupancy',
        'total_events',
        'revenue_generated',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $primaryKey = 'venue_id';

    /**
     * The model's default values for attributes.
     *
     * @var array
     */
    protected $attributes = [
        'status' => 'active',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
    ];

    protected static function booted()
    {
        static::deleting(function ($venue) {
            if ($venue->isForceDeleting()) {
                $venue->assets()->forceDelete();
            } else {
                $venue->assets()->delete(); // soft delete assets
            }
        });
    }

    /**
     * Get the admin user that created the venue.
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'created_by');
    }

    /**
     * Get the admin user that last updated the venue.
     */
    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'updated_by');
    }

    /**
     * Get the venue admins associated with the venue.
     */
    public function venueAdmins(): BelongsToMany
    {
        return $this->belongsToMany(AdminUser::class, 'venue_admins', 'venue_id', 'user_id')
            ->where('status', 'active');
    }

    /**
     * Get the venue spots for the venue.
     */
    public function venueSpots(): HasMany
    {
        return $this->hasMany(VenueSpot::class, 'venue_id');
    }

    // ... inside the Venue model ...

    public function venueHolidays(): HasMany
    {
        return $this->hasMany(VenueHoliday::class, 'venue_id');
    }

    public function assets(): HasMany
    {
        return $this->hasMany(Asset::class, 'venue_id', 'venue_id');
    }


}
