<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VenueAdmin extends Model
{
    use HasFactory;

    protected $fillable = [
        'venue_id',
        'user_id',
        'assigned_by',
    ];

    protected $table = 'venue_admins';

    public $timestamps = false;

    /**
     * Get the venue that the admin is assigned to.
     */
    public function venue(): BelongsTo
    {
        return $this->belongsTo(Venue::class, 'venue_id');
    }

    /**
     * Get the admin user that is assigned to the venue.
     */
    public function adminUser(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'user_id');
    }

    /**
     * Get the admin user that assigned the admin to the venue.
     */
    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'assigned_by');
    }
}
