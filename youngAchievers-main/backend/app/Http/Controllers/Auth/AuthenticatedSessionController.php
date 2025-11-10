<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\AdminUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthenticatedSessionController extends Controller
{
    /**
     * Handle an incoming authentication request.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        // $request->authenticate();

        // $request->session()->regenerate();

        // return response()->noContent();

    
        $admin = AdminUser::where('email', $request->email)->first();
    
        if (! $admin || ! Hash::check($request->password, $admin->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }
    
        $token = $admin->createToken('admin-token')->plainTextToken;
    
        return response()->json([
            'token' => $token,
            'user' => $admin->load('role', 'permissions'), // Include role, permission
        ]);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): Response
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return response()->noContent();
    }
}
