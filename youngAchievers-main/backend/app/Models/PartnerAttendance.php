<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


class PartnerAttendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'partner_id',
        'batch_session_id',
        'status',
        'notes',
        'marked_at',
        'marked_by',
    ];

    protected $casts = [
        'marked_at' => 'datetime',
    ];

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function batchSession(): BelongsTo
    {
        return $this->belongsTo(BatchSession::class);
    }

    public function markedBy(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'marked_by');
    }
}
