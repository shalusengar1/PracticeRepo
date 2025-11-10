<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use App\Models\Role;
use App\Models\UserPermission;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use App\Traits\LogsActivity;
use App\Services\GoogleCloudStorageService;

class AdminUserController extends Controller
{
    use LogsActivity;

    protected $gcsService;

    public function __construct(GoogleCloudStorageService $gcsService)
    {
        $this->gcsService = $gcsService;
    }

    /**
     * List all admin users with optional pagination and filtering.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = AdminUser::with(['role', 'permission'])->orderBy('created_at', 'desc');

            // Filtering by search
            if ($request->has('search')) {
                $search = $request->input('search');
                $query->where(function($q) use ($search) {
                    $q->where('first_name', 'like', "%$search%")
                      ->orWhere('last_name', 'like', "%$search%")
                      ->orWhere('email', 'like', "%$search%")
                      ->orWhere('phone', 'like', "%$search%")
                      ->orWhere('address', 'like', "%$search%")
                      ->orWhereHas('role', function($qr) use ($search) {
                          $qr->where('name', 'like', "%$search%") ;
                      })
                      ->orWhere('status', 'like', "%$search%") ;
                });
            }

            // Filtering by role
            if ($request->filled('role')) {
                $role = $request->input('role');
                $query->whereHas('role', function($q) use ($role) {
                    $q->where('name', $role);
                });
            }

            // Filtering by status
            if ($request->filled('status')) {
                $status = $request->input('status');
                $query->where('status', $status);
            }

            $paginate = $request->boolean('paginate', true);

            if ($paginate) {
                $perPage = $request->input('per_page', 10);
                $users = $query->paginate($perPage);
                // Transform each user in the paginated result
                $users->getCollection()->transform(function ($user) {
                    return $this->transformUser($user);
                });
                return response()->json($users);
            } else {
                $users = $query->get()->map(function ($user) {
                    return $this->transformUser($user);
                });
                return response()->json([
                    'message' => 'Admin users retrieved successfully',
                    'data' => $users,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to fetch admin users', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Something went wrong while retrieving users',
            ], 500);
        }
    }

    /**
     * Transform the user data to include only the role name.
     */
    private function transformUser($user)
    {
        return [
            'id' => $user->id,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'phone' => $user->phone,
            'address' => $user->address,
            'role' => $user->role->name, // Return role name only
            'permission' => $user->permission->permissions,
            'status' => $user->status,
            'employee_code' => $user->employee_code,
            'joining_date' => $user->joining_date,
            'date_of_birth' => $user->date_of_birth,
            'alternate_contact' => $user->alternate_contact,
            'profile_image' => $user->profile_image, // This is already the public URL
            'documents' => $user->documents ? json_decode($user->documents, true) : [], // Ensure documents are parsed
        ];
    }

    /**
     * Store a newly created admin user.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Decode the JSON data from the request
            $data = json_decode($request->input('data'), true);
            if (!$data) {
                return response()->json(['message' => 'Invalid data format.'], 422);
            }
            // Log::info('Request Data:', $data); // Logs the request data

            // Validate the main data
            $validator = Validator::make($data, [
                'first_name' => 'required|string|max:50',
                'last_name' => 'nullable|string|max:50',
                'email' => 'required|email|unique:admin_users,email',
                'phone' => 'nullable|string|max:20|unique:admin_users,phone',
                'role' => 'required|string',
                'status' => 'required|in:active,inactive,pending',
                'date_of_birth' => 'nullable|date',
                'employee_code' => 'nullable|string|max:20|unique:admin_users,employee_code',
                'joining_date' => 'nullable|date',
                'alternate_contact' => 'nullable|string|max:20',
                'address' => 'nullable|string',
                'permissions' => 'required|array',
                'permissions.users' => 'nullable|array', // Make users nullable
                'permissions.batches' => 'nullable|array', // Make batches nullable
                'permissions.venues' => 'nullable|array', // Make venues nullable
                'permissions.reports' => 'nullable|array',
                // No need to validate documents structure here as they are files
                // and will be handled by file validation.
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            // Validate files if present
            if ($request->hasFile('profileImage') || $request->hasFile('documents')) {
                $fileValidator = Validator::make($request->allFiles(), [ // Use allFiles() for file validation
                    'profileImage' => [
                        'nullable',
                        'file',
                        'image',
                        'mimes:jpeg,png,jpg,gif',
                        'max:2048', // 2MB max size
                    ],
                    'documents.*' => [
                        'nullable',
                        'file',
                        'mimes:pdf,doc,docx,xls,xlsx,jpeg,png,jpg', // Allow common image types for documents too
                        'max:15360', // 15MB max size
                    ]
                ]);

                if ($fileValidator->fails()) {
                    return response()->json(['errors' => $fileValidator->errors()], 422);
                }
            }

            // Start a database transaction
            DB::beginTransaction();

            // Find the role
            $role = Role::where('name', $data['role'])->first();

            // Create the user
            $adminUser = new AdminUser();
            $adminUser->first_name = $data['first_name'];
            $adminUser->last_name = $data['last_name'];
            $adminUser->email = $data['email'];
            $adminUser->phone = $data['phone'];
            $adminUser->role_id = $role->id;
            $adminUser->status = $data['status'];
            $adminUser->date_of_birth = $data['date_of_birth'];
            $adminUser->employee_code = $data['employee_code'];
            $adminUser->joining_date = $data['joining_date'];
            $adminUser->alternate_contact = $data['alternate_contact'];
            $adminUser->address = $data['address'];
            $adminUser->created_by = Auth::id();
            $adminUser->save();

            // Handle profile image upload
            if ($request->hasFile('profileImage')) {
                $uploadResult = $this->gcsService->uploadFile($request->file('profileImage'), "admin_users/{$adminUser->id}/profile_images");
                $adminUser->profile_image_path = $uploadResult['object_name'];
                $adminUser->profile_image = $uploadResult['public_url'];
                $adminUser->save();
            }

            // Handle documents and store metadata
            $documentMetadata = [];
            if ($request->hasFile('documents')) {
                foreach ($request->file('documents') as $file) {
                    $uploadResult = $this->gcsService->uploadFile($file, "admin_users/{$adminUser->id}/documents");
                    $documentMetadata[] = [
                        'path' => $uploadResult['object_name'], // GCS object name
                        'url' => $uploadResult['public_url'],   // Public URL
                        'original_name' => $file->getClientOriginalName(),
                        'mime_type' => $file->getMimeType(),
                        'size_kb' => round($file->getSize() / 1024, 2),
                    ];
                }
                $adminUser->documents = json_encode($documentMetadata);
                $adminUser->save();
            }

            // Create user permissions
            UserPermission::create([
                'user_id' => $adminUser->id,
                'permissions' => $data['permissions'], // Set the permissions
                'created_by' => null, // Set the created_by user ID
                'updated_by' => null, // Set the updated_by user ID
            ]);

            $this->logUserAction(
                'User Created',
                $adminUser,
                "Created new user with role: \"{$role->name}\"",
                null,
                $adminUser->toArray() // Log all new attributes
            );

            // Commit the transaction
            DB::commit();

            return response()->json([
                'message' => 'Admin user created successfully.',
                'admin_user' => $adminUser,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Rollback the transaction if an error occurs
            DB::rollback();
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            // Rollback the transaction if an error occurs
            DB::rollback();
            Log::error('Failed to create admin user', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Something went wrong while creating the user',
            ], 500);
        }
    }

    /**
     * Update an admin user.
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $adminUser = AdminUser::find($id);

            if (!$adminUser) {
                return response()->json(['message' => 'Admin user not found'], 404);
            }

            $originalUser = $adminUser->replicate(); // Replicate to get a clean copy of original attributes
            $originalUser->setRelations($adminUser->getRelations()); // Copy loaded relations
            $originalPermissions = $adminUser->permission ? $adminUser->permission->permissions : null;
            
            // Decode the JSON data from the request
            $data = json_decode($request->get('data'), true);

            if (!$data) {
                return response()->json(['message' => 'Invalid data format.'], 422);
            }

            // Ensure 'permissions' is decoded if it's a JSON string
            if (isset($data['permissions']) && is_string($data['permissions'])) {
                $data['permissions'] = json_decode($data['permissions'], true);
            }

            // Validate the main data
            $validator = Validator::make($data, [
                'first_name' => 'required|string|max:50',
                'last_name' => 'nullable|string|max:50',
                'email' => 'required|email|unique:admin_users,email,' . $adminUser->id,
                'phone' => 'nullable|string|max:20|unique:admin_users,phone,' . $adminUser->id,
                'role' => 'required|string', // Ensure role exists
                'status' => 'required|in:active,inactive,pending',
                'date_of_birth' => 'nullable|date',
                'employee_code' => 'nullable|string|max:20|unique:admin_users,employee_code,' . $adminUser->id,
                'joining_date' => 'nullable|date',
                'alternate_contact' => 'nullable|string|max:20',
                'address' => 'nullable|string',
                'permissions' => 'required|array',
                'permissions.users' => 'nullable|array',
                'permissions.batches' => 'nullable|array',
                'permissions.venues' => 'nullable|array',
                'permissions.reports' => 'nullable|array',
                'password' => 'nullable|string|min:8',
                'kept_document_paths' => 'nullable|array', // Array of GCS object names to keep
                'kept_document_paths.*' => 'string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'errors' => $validator->errors(),
                ], 422);
            }

            if ($request->hasFile('profileImage') || $request->hasFile('new_documents')) {
                $fileValidator = Validator::make($request->allFiles(), [ // Use allFiles()
                    'profileImage' => [
                        'nullable',
                        'file',
                        'image',
                        'mimes:jpeg,png,jpg,gif',
                        'max:2048', // 2MB max size
                    ],
                    'new_documents.*' => [ // Validate new_documents array
                        'nullable',
                        'file',
                        'mimes:pdf,doc,docx,xls,xlsx,jpeg,png,jpg',
                        'max:15360', // 15MB max size
                    ]
                ]);

                if ($fileValidator->fails()) {
                    return response()->json(['errors' => $fileValidator->errors()], 422);
                }
            }

            // Start a database transaction
            DB::beginTransaction();

            // Find the role
            $role = Role::where('name', $data['role'])->first();

            // Update the user
            $adminUser->first_name = $data['first_name'];
            $adminUser->last_name = $data['last_name'];
            $adminUser->email = $data['email'];
            $adminUser->phone = $data['phone'];
            $adminUser->role_id = $role->id;
            $adminUser->status = $data['status'];
            $adminUser->date_of_birth = $data['date_of_birth'];
            $adminUser->employee_code = $data['employee_code'];
            $adminUser->joining_date = $data['joining_date'];
            $adminUser->alternate_contact = $data['alternate_contact'];
            $adminUser->address = $data['address'];

            // Update password if provided
            if (isset($data['password']) && !empty($data['password'])) {
                $adminUser->password = Hash::make($data['password']);
            }
            $adminUser->save();

            // Handle profile image upload
            if ($request->hasFile('profileImage')) {
                // Delete the old profile image from GCS if it exists
                if ($adminUser->profile_image_path) {
                    $this->gcsService->deleteFile($adminUser->profile_image_path);
                }
                $uploadResult = $this->gcsService->uploadFile($request->file('profileImage'), "admin_users/{$adminUser->id}/profile_images");
                $adminUser->profile_image_path = $uploadResult['object_name'];
                $adminUser->profile_image = $uploadResult['public_url'];
                $adminUser->save();
            } elseif (isset($data['remove_profile_image']) && $data['remove_profile_image']) {
                // Handle profile image removal
                if ($adminUser->profile_image_path) {
                    $this->gcsService->deleteFile($adminUser->profile_image_path);
                }
                $adminUser->profile_image_path = null;
                $adminUser->profile_image = null;
                $adminUser->save();
            }

            // Handle document updates
            $currentDocuments = $adminUser->documents ? json_decode($adminUser->documents, true) : [];
            $keptDocumentPaths = $data['kept_document_paths'] ?? [];
            $finalDocuments = [];

            // Determine documents to delete and keep
            foreach ($currentDocuments as $doc) {
                if (in_array($doc['path'], $keptDocumentPaths)) {
                    $finalDocuments[] = $doc; // Keep this document
                } else {
                    // Delete from GCS
                    if (!empty($doc['path'])) {
                        $this->gcsService->deleteFile($doc['path']);
                    }
                }
            }

            // Add new documents
            if ($request->hasFile('new_documents')) {
                foreach ($request->file('new_documents') as $key => $file) {
                    if ($file && $file->isValid()) {
                        $uploadResult = $this->gcsService->uploadFile($file, "admin_users/{$adminUser->id}/documents");
                        $finalDocuments[] = [
                            'path' => $uploadResult['object_name'],
                            'url' => $uploadResult['public_url'],
                            'original_name' => $file->getClientOriginalName(),
                            'mime_type' => $file->getMimeType(),
                            'size_kb' => round($file->getSize() / 1024, 2),
                        ];
                    } else {
                        $errorMsg = $file ? $file->getErrorMessage() : 'File is null or invalid.';
                    }
                }
            }
            $adminUser->documents = json_encode(array_values($finalDocuments)); // Re-index array
            $adminUser->save();

            UserPermission::updateOrCreate(
                ['user_id' => $adminUser->id], // Corrected line: Use user_id
                [
                    'permissions' => $data['permissions'],
                    'created_by' => null, // Set the created_by user ID
                    'updated_by' => null, // Set the updated_by user ID
                ]
            );

            $adminUser->refresh(); // Refresh to get all changes including from UserPermission
            
            // Logging changes
            $oldValuesForLog = [];
            $newValuesForLog = [];
            $logMessages = [];
            $originalDocumentsForLog = $originalUser->documents ? json_decode($originalUser->documents, true) : [];

            $changedAttributes = $adminUser->getChanges(); // Get only changed attributes after save

            $excludedFields = ['role_id','updated_at', 'password', 'remember_token', 'documents', 'profile_image', 'profile_image_path'];

            foreach ($changedAttributes as $key => $newValue) {
                if (in_array($key, $excludedFields)) continue;

                $oldValue = $originalUser->{$key} ?? null; // Use replicated original model
                // Ensure values are scalar or serializable for logging
                $oldValue = is_array($oldValue) ? json_encode($oldValue) : $oldValue;
                $newValue = is_array($newValue) ? json_encode($newValue) : $newValue;

                if ($oldValue !== $newValue) {
                    $oldValuesForLog[$key] = $originalUser->{$key}; // Log original type
                    $newValuesForLog[$key] = $adminUser->{$key};   // Log new type
                    $logMessages[] = "Updated {$key} from \"{$oldValue}\" to \"{$newValue}\"";
                }
            }
            
            if (isset($data['password']) && !empty($data['password'])) {
                $logMessages[] = "Password was updated";
                $oldValuesForLog['password_changed'] = false; 
                $newValuesForLog['password_changed'] = true;
            }

            $updatedPermissions = $adminUser->permission ? $adminUser->permission->permissions : null;
            if ($originalPermissions !== $updatedPermissions) {
                $logMessages[] = "Permissions were updated";
                $oldValuesForLog['permissions'] = $originalPermissions;
                $newValuesForLog['permissions'] = $updatedPermissions;
            }
            
            // Role change logging (check original role_id vs new role_id)
            if ($originalUser->role_id !== $adminUser->role_id) {
                $originalRole = Role::find($originalUser->role_id);
                $newRole = $adminUser->role; // Already loaded or will be fetched by relation
                $logMessages[] = "Role changed from \"".($originalRole->name ?? 'N/A')."\" to \"".($newRole->name ?? 'N/A')."\"";
                $oldValuesForLog['role'] = $originalRole->name ?? null;
                $newValuesForLog['role'] = $newRole->name ?? null;
            }
            
            // Log document changes (simplified: just indicate if they changed)
            if ($originalDocumentsForLog !== $finalDocuments) {
                $logMessages[] = "Documents were updated";
            }

            if (!empty($logMessages)) {
                $this->logUserAction(
                    'User Updated',
                    $adminUser,
                    implode(', ', $logMessages),
                    $oldValuesForLog,
                    $newValuesForLog
                );
            }

            // Commit the transaction
            DB::commit();

            return response()->json([
                'message' => 'Admin user updated successfully',
                'data' => $this->transformUser($adminUser->fresh(['role', 'permission'])), // Return transformed fresh data
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Rollback the transaction if an error occurs
            DB::rollback();
            Log::error("Failed to update admin user with ID: $id - Validation Error", ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            // Rollback the transaction if an error occurs
            DB::rollback();
            Log::error("Failed to update admin user with ID: $id", ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Something went wrong while updating the user',
                'error' => $e->getMessage(), // Include the error message for debugging
            ], 500);
        }
    }

    /**
     * Delete an admin user.
     */
    public function destroy($id): JsonResponse
    {
        try {
            $user = AdminUser::find($id);

            if (!$user) {
                return response()->json(['message' => 'Admin user not found'], 404);
            }

            $originalStatus = $user->status;
            $user->update(['status' => 'inactive']);

            $this->logUserAction(
                'User Deactivated', // Or 'Admin User Deleted'
                $user,
                "User \"{$user->first_name} {$user->last_name}\" was deactivated",
                ['status' => $originalStatus],
                ['status' => $user->status]
            );

            return response()->json([
                'message' => 'Admin user deleted successfully',
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to delete admin user with ID: $id", ['error' => $e->getMessage()]);

            return response()->json([
                'message' => 'Something went wrong while deleting the user',
            ], 500);
        }
    }

    /**
     * Display the specified admin user.
     */
    public function show($id): JsonResponse
    {
        try {
            $user = AdminUser::with(['role', 'permission'])->find($id);

            if (!$user) {
                return response()->json(['message' => 'Admin user not found'], 404);
            }

            return response()->json([
                'message' => 'Admin user retrieved successfully',
                'data' => $this->transformUser($user), // Use the transformation
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to retrieve admin user with ID: $id", ['error' => $e->getMessage()]);

            return response()->json([
                'message' => 'Something went wrong while retrieving the user',
            ], 500);
        }
    }

    public function indexByPermission()
    {
        try {
            $users = AdminUser::where('status', 'active')
            ->whereHas('permission', function ($query) {
                $query->where(function ($q) {
                    $keys = ['view', 'edit', 'create', 'delete'];
    
                    foreach ($keys as $key) {
                        $q->orWhereRaw("
                            JSON_UNQUOTE(JSON_EXTRACT(permissions, '$.venues.$key')) = 'true'
                        ");
                    }
                });
            })
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'firstName' => $user->first_name,
                    'lastName' => $user->last_name,
                    'email' => $user->email,
                ];
            });
    
            return response()->json([
                'message' => "Active admin users with any 'venues' permission retrieved successfully",
                'data' => $users,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch admin users by venue permission', ['error' => $e->getMessage()]);
    
            return response()->json([
                'message' => 'Something went wrong while retrieving users by venue permission',
            ], 500);
        }
    }

    public function uploadProfilePicture(Request $request)
    {
        $request->validate([
            'profile_image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
            'user_id' => 'required|exists:admin_users,id'
        ]);

        try {
            $file = $request->file('profile_image');
            $userId = $request->input('user_id');
            $user = AdminUser::find($userId);
            
            // Store original data for logging
            $originalData = $user->toArray();
            
            // Upload to GCS
            $gcsPath = "admin_users/{$userId}/profile_images";
            $uploadResult = $this->gcsService->uploadFile($file, $gcsPath);

            // Delete old profile image if exists
            if ($user->profile_image_path) {
                $this->gcsService->deleteFile($user->profile_image_path);
            }

            // Store the object path and current signed URL
            $user->profile_image_path = $uploadResult['object_name'];
            $user->profile_image = $uploadResult['public_url']; // Store current signed URL
            $user->save();

            return response()->json([
                'message' => 'Profile picture updated successfully',
                'profile_image' => $uploadResult['public_url']
            ]);

        } catch (\Exception $e) {
            Log::error('Profile picture upload failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to upload profile picture',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a fresh signed URL for a profile image
     */
    public function refreshProfileImageUrl()
    {
        try {
            $user = auth()->user();
            
            if (!$user->profile_image_path) {
                return response()->json([
                    'message' => 'No profile image found'
                ], 404);
            }

            $signedUrl = $this->gcsService->getSignedUrl($user->profile_image_path);
            
            // Update the stored signed URL
            $user->profile_image = $signedUrl;
            $user->save();

            return response()->json([
                'message' => 'URL refreshed successfully',
                'profile_image' => [
                    'url' => $signedUrl,
                    'expires_in' => '7 days'
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to refresh profile image URL: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to refresh profile image URL',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle user status between active and inactive.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function toggleStatus($id): JsonResponse
    {
        try {
            $user = AdminUser::find($id);

            if (!$user) {
                return response()->json(['message' => 'Admin user not found'], 404);
            }

            $originalStatus = $user->status;
            $newStatus = $originalStatus === 'active' ? 'inactive' : 'active';

            $user->update(['status' => $newStatus]);

            // Log the status change
            $this->logUserAction(
                'User Status Updated',
                $user,
                "User status was changed from {$originalStatus} to {$newStatus}",
                ['status' => $originalStatus],
                ['status' => $newStatus]
            );

            return response()->json([
                'message' => 'User status updated successfully',
                'data' => [
                    'id' => $user->id,
                    'status' => ucfirst($newStatus)
                ]
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to toggle status for user with ID: $id", ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Something went wrong while updating the user status',
            ], 500);
        }
    }

    /**
     * Update the authenticated admin's own profile information.
     * This method is specifically for the fields editable on Profile.tsx.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateAuthenticatedUserProfile(Request $request)
    {
        $user = $request->user(); // Get the currently authenticated user

        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:50',
            'last_name' => 'required|string|max:50',
            'email' => 'required|string|email|max:255|unique:admin_users,email,' . $user->id,
            'phone' => 'required|string|max:20|unique:admin_users,phone,' . $user->id,
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $originalData = [
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'phone' => $user->phone,
            'profile_image' => $user->profile_image,
        ];

        // Track changes
        $logMessages = [];
        $oldValuesForLog = [];
        $newValuesForLog = [];

        $fields = ['first_name', 'last_name', 'email', 'phone'];
        foreach ($fields as $field) {
            $old = $user->$field;
            $new = $request->input($field);
            if ($old !== $new) {
                $logMessages[] = "$field changed from \"$old\" to \"$new\"";
                $oldValuesForLog[$field] = $old;
                $newValuesForLog[$field] = $new;
            }
        }

        // Explicitly update the user fields
        $user->first_name = $request->input('first_name');
        $user->last_name = $request->input('last_name');
        $user->email = $request->input('email');
        $user->phone = $request->input('phone');

        // Handle profile image upload/removal
        if ($request->hasFile('profileImage')) {
            $request->validate([
                'profileImage' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048', // Validate the file
            ]);

            try {
                // Delete the old profile image from GCS if it exists
                if ($user->profile_image_path) {
                    $this->gcsService->deleteFile($user->profile_image_path);
                }
                // Upload the new file
                $uploadResult = $this->gcsService->uploadFile($request->file('profileImage'), "admin_users/{$user->id}/profile_images");
                $user->profile_image_path = $uploadResult['object_name'];
                $user->profile_image = $uploadResult['public_url']; // Store the public URL
                $logMessages[] = "profile_image updated";
                $oldValuesForLog['profile_image'] = $user->profile_image;
                $newValuesForLog['profile_image'] = $uploadResult['public_url'];
            } catch (\Exception $e) {
                Log::error('Profile picture upload failed during self-update: ' . $e->getMessage());
                // Optionally return an error or log it and continue with other updates
            }
        } elseif ($request->has('remove_profile_image') && $request->input('remove_profile_image') === 'true') {
            // Handle profile image removal
            if ($user->profile_image_path) {
                $this->gcsService->deleteFile($user->profile_image_path);
            }
            $user->profile_image_path = null;
            $user->profile_image = null;
            $logMessages[] = "profile_image removed";
            $oldValuesForLog['profile_image'] = $user->profile_image;
            $newValuesForLog['profile_image'] = null;
        }
        $user->save();

        $this->logUserAction(
            'Profile Self-Updated',
            $user,
            $logMessages ? implode(', ', $logMessages) : "Authenticated user updated their profile details.",
            $oldValuesForLog,
            $newValuesForLog
        );

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => [ // Return data structure expected by profileSlice.updateProfile.fulfilled
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'phone' => $user->phone,
                'profile_image' => $user->profile_image, // Return the updated profile image URL
            ]
        ]);
    }
}
