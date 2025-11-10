<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Program extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'created_by',
        'updated_by'
    ];

    /**
     * Get the batches associated with this program
     */
    public function batches(): HasMany
    {
        return $this->hasMany(Batch::class);
    }

    
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'updated_by');
    }
}
