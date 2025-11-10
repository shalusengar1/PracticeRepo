<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class AdminUser extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'status',
        'date_of_birth',
        'employee_code',
        'joining_date',
        'alternate_contact',
        'address',
        'documents',
        'profile_image',
        'created_by',
        'updated_by',
        'role_id',
        'password'
    ];

    public function role()
    {
        return $this->belongsTo(Role::class);
    }
    
    public function permission()
    {
        return $this->hasOne(UserPermission::class, 'user_id');
    }

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'documents' => 'array',
    ];
    
}
