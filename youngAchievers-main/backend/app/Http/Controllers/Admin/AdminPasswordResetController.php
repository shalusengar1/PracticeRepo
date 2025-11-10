<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use App\Traits\LogsActivity;

class AdminPasswordResetController extends Controller
{
    use LogsActivity;

    /**
     * Reset password for admin user without requiring current password
     */
    public function resetPassword(Request $request, $userId)
    {
        $validator = Validator::make($request->all(), [
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $adminUser = AdminUser::findOrFail($userId);
            
            $adminUser->update([
                'password' => Hash::make($request->password),
                'remember_token' => Str::random(60),
            ]);

            // Log the password reset activity
            $this->logUserAction(
                'Password Updated',
                $adminUser,
                $adminUser->first_name . ' ' . $adminUser->last_name . '\'s password was reset',
                null,
                ['password' => '********'] // Only log that password was changed, not the actual value
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Password reset successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to reset password'
            ], 500);
        }
    }
}
