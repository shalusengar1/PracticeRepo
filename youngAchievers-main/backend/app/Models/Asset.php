<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Asset extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'type',
        'quantity',
        'in_use',
        'condition',
        'venue_id', 
        'last_service_date',
    ];

    protected $casts = [
        'last_service_date' => 'date',
    ];

    public function venue(): BelongsTo
    {
        return $this->belongsTo(Venue::class, 'venue_id', 'venue_id'); // Specify foreign and owner keys
    }
}
