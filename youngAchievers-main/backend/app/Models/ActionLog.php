<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActionLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'action',
        'user',
        'target',
        'category',
        'details',
        'ip_address',
        'old_values',
        'new_values',
        'performed_by',
        'entity_type',
        'entity_id'
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    public function performedBy(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'performed_by');
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    public function scopeByDateRange($query, $startDate, $endDate = null)
    {
        if ($endDate) {
            return $query->whereBetween('created_at', [$startDate, $endDate]);
        }
        return $query->where('created_at', '>=', $startDate);
    }
}