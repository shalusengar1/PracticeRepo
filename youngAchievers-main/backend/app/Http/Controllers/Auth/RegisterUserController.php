<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Validator;

class RegisterUserController extends Controller
{
    /**
     * Handle an incoming registration request.
     *
     */
    public function store(Request $request): JsonResponse
    {
        
        // Define the validation rules
        $rules = [
            'first_name' => ['required', 'string', 'max:50'],
            'first_name' => ['required', 'string', 'max:50'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:100', 'unique:' . AdminUser::class],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'phone' => ['nullable', 'string', 'max:20', 'unique:' . AdminUser::class],
            'status' => ['nullable', 'string', Rule::in(['active', 'inactive', 'pending'])],
            'date_of_birth' => ['nullable', 'date'],
            'employee_code' => ['required', 'string', 'max:20', 'unique:' . AdminUser::class],
            'alternate_contact' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string'],
            'documents' => ['nullable', 'json'],
            'created_by' => ['nullable', 'integer', Rule::exists('admin_users', 'id')],
            'updated_by' => ['nullable', 'integer', Rule::exists('admin_users', 'id')],
        ];

        // Validate the request data
        $validator = Validator::make($request->all(), $rules);

        // Check if validation fails
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422); // 422 Unprocessable Entity
        }


        // Create the admin user
        $adminUser = AdminUser::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone,
            'status' => $request->status ?? 'pending',
            'date_of_birth' => $request->date_of_birth,
            'employee_code' => $request->employee_code,
            'alternate_contact' => $request->alternate_contact,
            'address' => $request->address,
            'documents' => $request->documents,
            'created_by' => null,
            'updated_by' => null,
        ]);

        // Dispatch the Registered event
        event(new Registered($adminUser));

        // Return a JSON response indicating success
        return response()->json([
            'message' => 'Admin user registered successfully',
            'user' => $adminUser,
        ], 201); // 201 Created
    }
}
