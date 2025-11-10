<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserPermission extends Model
{
    protected $primaryKey = 'user_id'; // If user_id is the primary key
    public $incrementing = false; // If user_id is not auto-incrementing
    
    protected $fillable = [
        'user_id',
        'permissions',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'permissions' => 'array',
    ];
}
