<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminUser; // Assuming your user model is App\Models\User
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth; // Added for Auth::id()
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Role; // If you have a Role model and want to assign roles
use Illuminate\Support\Facades\Log;

class BulkImportController extends Controller
{
    public function importUsers(Request $request)
    {
        $rules = [
            'users' => 'required|array|min:1',
            'users.*.first_name' => 'required|string|max:50',
            'users.*.last_name' => 'nullable|string|max:50',
            'users.*.email' => 'required|email|distinct|unique:admin_users,email',
            'users.*.phone' => 'nullable|string|max:20|distinct|unique:admin_users,phone',
            'users.*.role' => 'required|string|in:Admin,Account Manager,Facility Manager',
            'users.*.status' => 'required|string|in:active,pending,inactive',
            'users.*.date_of_birth' => 'nullable|date_format:Y-m-d',
            'users.*.employee_code' => 'nullable|string|max:20|distinct|unique:admin_users,employee_code',
            'users.*.joining_date' => 'nullable|date_format:Y-m-d',
            'users.*.alternate_contact' => 'nullable|string|max:20',
            'users.*.address' => 'nullable|string|max:65535',
            'users.*.password' => 'nullable|string|min:8|max:255',
        ];

        $usersDataRequest = $request->input('users', []);
        $customAttributes = [];
        
        $ordinalHelper = function($number) {
            $ends = ['th','st','nd','rd','th','th','th','th','th','th'];
            if ((($number % 100) >= 11) && (($number % 100) <= 13)) {
                return $number . 'th';
            } else {
                return $number . $ends[$number % 10];
            }
        };
        
        foreach ($usersDataRequest as $index => $userData) {
            $ordinal = $ordinalHelper($index + 1); // Convert 0-based index to 1-based ordinal
            $customAttributes["users.{$index}.first_name"] = "{$ordinal} user's first name";
            $customAttributes["users.{$index}.last_name"] = "{$ordinal} user's last name";
            $customAttributes["users.{$index}.email"] = "{$ordinal} user's email";
            $customAttributes["users.{$index}.phone"] = "{$ordinal} user's phone";
            $customAttributes["users.{$index}.role"] = "{$ordinal} user's role";
            $customAttributes["users.{$index}.status"] = "{$ordinal} user's status";
            $customAttributes["users.{$index}.date_of_birth"] = "{$ordinal} user's date of birth";
            $customAttributes["users.{$index}.employee_code"] = "{$ordinal} user's employee code";
            $customAttributes["users.{$index}.joining_date"] = "{$ordinal} user's joining date";
            $customAttributes["users.{$index}.alternate_contact"] = "{$ordinal} user's alternate contact";
            $customAttributes["users.{$index}.address"] = "{$ordinal} user's address";
            $customAttributes["users.{$index}.password"] = "{$ordinal} user's password";
        }

        $validator = Validator::make($request->all(), $rules, [], $customAttributes);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed. Please check the data for each user.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $usersData = $request->input('users');
        $createdUsersCount = 0;
        $createdUsersList = []; // Array to hold created user data

        DB::beginTransaction();
        try {
            foreach ($usersData as $index => $userData) {
                
                $status = $userData['status'] ?? 'pending'; // Already lowercase from frontend
                $passwordToHash = !empty($userData['password']) ? $userData['password'] : 'password';

                $roleName = $userData['role']; // Role is required by validator

                $role = Role::where('name', $roleName)->first();

                if (!$role) {
                    throw new \Exception("Role '{$roleName}' not found for user at index {$index}. Ensure roles exist in the database.");
                }

                $user = AdminUser::create([
                    'first_name' => $userData['first_name'],
                    'last_name' => $userData['last_name'] ?? null,
                    'email' => $userData['email'],
                    'phone' => $userData['phone'] ?? null,
                    'role_id' => $role->id,
                    'status' => $status,
                    'date_of_birth' => $userData['date_of_birth'] ?? null,
                    'employee_code' => $userData['employee_code'] ?? null,
                    'joining_date' => $userData['joining_date'] ?? null,
                    'alternate_contact' => $userData['alternate_contact'] ?? null,
                    'address' => $userData['address'] ?? null,
                    'password' => Hash::make($passwordToHash),
                    'created_by' => Auth::id(), // Set the creator of the user
                ]);

                // Load role for transformation, permission will be created next
                $user->load('role'); 

                $permissions = $this->getDefaultPermissionsForRole($roleName);
                $user->permission()->create([
                    'permissions' => json_encode($permissions),
                ]);

                $createdUsersCount++;

                // Add the transformed user to the list
                $createdUsersList[] = $this->transformImportedUser($user);
            }

            DB::commit();

            return response()->json([
                'message' => "Successfully imported {$createdUsersCount} users.",
                'created_count' => $createdUsersCount,
                'created_users' => $createdUsersList, // Send back the list of created users
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bulk user import failed: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json([
                'message' => 'An error occurred during the import process.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    private function transformImportedUser(AdminUser $user)
    {
        
        $permissionData = $user->permission ? $user->permission->permissions : null;
        if (is_string($permissionData)) {
            $permissionData = json_decode($permissionData, true);
        }

        return [
            'id' => $user->id,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role->name, // Role name
            'status' => $user->status, // Already lowercase
            'permission' => $permissionData, // Permissions
            // Add other fields as transformed in AdminUserController if needed for consistency
            'date_of_birth' => $user->date_of_birth,
            'employee_code' => $user->employee_code,
            'joining_date' => $user->joining_date,
            'alternate_contact' => $user->alternate_contact,
            'address' => $user->address,
        ];
    }

    private function getDefaultPermissionsForRole(string $role): array
    {
        $basePermissions = [
            'users' => ['view' => false, 'create' => false, 'edit' => false, 'delete' => false],
            'venues' => ['view' => false, 'create' => false, 'edit' => false, 'delete' => false],
            'batches' => ['view' => false, 'create' => false, 'edit' => false, 'delete' => false],
            'reports' => ['view' => false, 'export' => false],
        ];

        switch (strtolower($role)) {
            case 'admin':
                return [
                    'users' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                    'venues' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                    'batches' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                    'reports' => ['view' => true, 'export' => true],
                ];
            case 'account manager':
                return [
                    'users' => ['view' => true, 'create' => false, 'edit' => false, 'delete' => false],
                    'venues' => ['view' => true, 'create' => false, 'edit' => false, 'delete' => false],
                    'batches' => ['view' => true, 'create' => false, 'edit' => false, 'delete' => false],
                    'reports' => ['view' => true, 'export' => true],
                ];
            case 'facility manager':
                return [
                    'users' => ['view' => true, 'create' => false, 'edit' => false, 'delete' => false],
                    'venues' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                    'batches' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                    'reports' => ['view' => true, 'export' => false],
                ];
            default:
                return $basePermissions;
        }
    }

}
