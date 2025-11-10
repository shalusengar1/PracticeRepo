<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Amenity extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'icon',
        'category',
        'enabled',
    ];

    /**
     * The model's default values for attributes.
     */
    protected $attributes = [
        'enabled' => true, // Set default value for enabled
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'enabled' => 'boolean', // Add this cast
    ];

    public function venueSpots()
    {
        return $this->belongsToMany(VenueSpot::class, 'venue_spot_amenities', 'amenity_id', 'venue_spot_id');
    }
}
