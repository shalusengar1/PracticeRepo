<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Member extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes, HasApiTokens;

    protected $fillable = [
        'name',
        'email',
        'password',
        'mobile',
        'status',
        'excused_until',
        'excuse_reason',
        'created_by',
        'updated_by',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'status' => 'string',
        'email_verified_at' => 'datetime',
        'excused_until' => 'date',
    ];

    // Relationships

    /**
     * Get the batches that the member is enrolled in
     */
    public function batches(): BelongsToMany
    {
        return $this->belongsToMany(Batch::class, 'batch_members');
    }

    /**
     * Get the admin user who created this member
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'created_by');
    }

    /**
     * Get the admin user who last updated this member
     */
    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'updated_by');
    }

    /**
     * Get all attendance records for this member
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(MemberAttendance::class);
    }

    /**
     * Get all programs associated with the member through their batches
     * This is a dynamic relationship - not stored in database
     */
    public function programs()
    {
        // This doesn't create a direct relationship to programs, it just returns
        // programs that are associated with the member's batches
        return $this->batches->map(function ($batch) {
            return $batch->program;
        })->unique('id');
    }
}
