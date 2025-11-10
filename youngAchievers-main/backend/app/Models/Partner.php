<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Partner extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'specialization',
        'status',
        'pay_schedule',
        'pay_type',
        'pay_percentage',
        'pay_amount',
        'payment_terms',
        'email',
        'mobile',
        'tds_percentage',
        'excused_until',
        'excuse_reason',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'excused_until' => 'date',
    ];

    public function batches(): BelongsToMany
    {
        // Assuming your pivot table is 'batch_partner'
        // and foreign keys are 'partner_id' and 'batch_id'
        return $this->belongsToMany(Batch::class, 'batch_partner', 'partner_id', 'batch_id')
                    ->withTimestamps(); // If your pivot table has timestamps
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(PartnerAttendance::class);
    }
}
