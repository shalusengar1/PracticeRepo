<?php

namespace Database\Seeders;

use App\Models\AdminUser;
use App\Models\Role;
use App\Models\UserPermission;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Create roles
        $adminRole = Role::firstOrCreate([
            'name' => 'Admin',
            'description' => 'Administrator with full access'
        ]);

        // Create an initial AdminUser and assign the account manager role
        $adminUser = AdminUser::firstOrCreate([
            'first_name' => 'Super',
            'last_name' => 'Admin',
            'email' => 'admin@admin.com',
            'password' => bcrypt('password'),
            'employee_code' => 'ADM001',
            'role_id' => $adminRole->id,
            'phone' => '+919696858576',
            'status' => 'active',
            'date_of_birth' => Carbon::create(1990, 1, 1),
            'alternate_contact' => '+919696858576',
            'address' => '123 Admin St, Anytown, USA',
        ]);

        UserPermission::updateOrCreate(
            ['user_id' => $adminUser->id],
            [
                'permissions' => $this->generateAllPermissions(),
                'created_by' => null,
                'updated_by' => null
            ]
        );

    }

    private function generateAllPermissions(): array
    {
        $modules = ['users', 'venues', 'batches', 'reports'];
        $actions = ['view', 'create', 'edit', 'delete'];
        $permissions = [];

        foreach ($modules as $module) {
            $permissions[$module] = [];
            foreach ($actions as $action) {
                $permissions[$module][$action] = true;
            }
        }

        return $permissions;
    }
}
