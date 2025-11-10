<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BatchSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'batch_id',
        'date',
        'start_time',
        'end_time',
        'status',
        'notes'
    ];

    protected $table = 'batch_sessions';
    
    protected $casts = [
        'date' => 'date',
    ];

    public function batch()
    {
        return $this->belongsTo(Batch::class);
    }

    public function memberAttendances()
    {
        return $this->hasMany(MemberAttendance::class);
    }

    public function partnerAttendances()
    {
        return $this->hasMany(PartnerAttendance::class);
    }
}
