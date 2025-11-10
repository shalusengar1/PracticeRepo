<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'description', 'is_active'];

    public function adminUsers()
    {
        return $this->hasMany(AdminUser::class);
    }
}
