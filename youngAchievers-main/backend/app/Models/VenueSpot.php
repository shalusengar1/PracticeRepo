<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class VenueSpot extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'venue_id',
        'spot_name',
        'capacity',
        'area',
        'start_time',
        'end_time',
        'operative_days',
        'created_by',
        'updated_by',
    ];

    protected $primaryKey = 'venue_spot_id';
    
    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'operative_days' => 'array',
    ];

    /**
     * Get the venue that the spot belongs to.
     */
    public function venue(): BelongsTo
    {
        return $this->belongsTo(Venue::class, 'venue_id');
    }

    /**
     * Get the admin user that created the venue spot.
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'created_by');
    }

    /**
     * Get the admin user that last updated the venue spot.
     */
    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'updated_by');
    }

    public function amenities()
    {
        return $this->belongsToMany(Amenity::class, 'venue_spot_amenities', 'venue_spot_id', 'amenity_id');
    }
}
