import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/api/axios';
import { UserFromBackend, UserData } from '@/types/user';
import { PermissionValue } from '@/types/permission';
import { TruncatedUser } from '@/types/user';
import { formatBackendError } from '@/utils/errorHandling';
import axios from 'axios';

export interface DocumentFile {
  path: string;
  original_name: string;
  url: string;
  size_kb?: number;
  mime_type?: string;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  permissions: PermissionValue;
  status: 'Active' | 'Inactive' | 'Pending';
  dateOfBirth?: string;
  employeeCode?: string;
  joiningDate?: string;
  alternateContact?: string;
  profilePicture?: string;
  documents?: DocumentFile[];
}

// Add pagination state
interface PaginationInfo {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

interface UserState {
  users: User[];
  venueAdmins: TruncatedUser[];
  selectedUser: User | null;
  loading: boolean;
  error: string | null;
  pagination?: PaginationInfo | null;
}

// Types for Bulk Import
interface BulkImportUserData {
  first_name: string;
  last_name: string | null;
  email: string;
  phone: string | null;
  role: string;
  status: string; // Should be lowercase: 'active', 'inactive', 'pending'
  date_of_birth?: string | null;
  employee_code?: string | null;
  joining_date?: string | null;
  alternate_contact?: string | null;
  address?: string | null;
  password?: string | null;
}

interface BulkImportResponse {
  message: string;
  created_count: number;
  created_users: UserFromBackend[]; // Expect an array of created users
}
interface ToggleStatusResponse {
  id: number;
  status: 'Active' | 'Inactive' | 'Pending';
}

const initialState: UserState = {
  users: [],
  venueAdmins: [],
  selectedUser: null,
  loading: false,
  error: null,
  pagination: null,
};

// Fetch users with pagination and filtering
export const fetchUsers = createAsyncThunk<
  any,
  { page?: number; perPage?: number; search?: string; paginate?: boolean; signal?: AbortSignal; role?: string; status?: string } | void,
  { rejectValue: string }
>(
  'users/fetchUsers',
  async (params, { rejectWithValue }) => {
    try {
      let queryParams: any = {};
      let signal: AbortSignal | undefined = undefined;
      if (params) {
        if (params.paginate !== undefined) queryParams.paginate = params.paginate;
        if (params.page) queryParams.page = params.page;
        if (params.perPage) queryParams.per_page = params.perPage;
        if (params.search) queryParams.search = params.search;
        if (params.signal) signal = params.signal;
        if (params.role) queryParams.role = params.role;
        if (params.status) queryParams.status = params.status;
      }
      const response = await api.get('/admin/users', { params: queryParams, signal });
      return response.data;
    } catch (error: any) {
      // Suppress error for cancelled requests
      if (axios.isCancel?.(error) || error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
        // Do not show toast or error for cancelled requests
        return;
      }
      return rejectWithValue(formatBackendError(error));
    }
  }
);

// Fetch single user
export const fetchUser = createAsyncThunk<User, number, { rejectValue: string }>(
  'users/fetchUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      const user = response.data.data;

      return {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name ?? '',
        email: user.email,
        phone: user.phone ?? '',
        address: user.address ?? '',
        role: user.role,
        permissions: user.permission,
        status: (user.status.charAt(0).toUpperCase() + user.status.slice(1)) as User['status'],
        dateOfBirth: user.date_of_birth ?? '',
        employeeCode: user.employee_code ?? '',
        joiningDate: user.joining_date ?? '',
        alternateContact: user.alternate_contact ?? '',
        profilePicture: user.profile_image ?? '',
        documents: user.documents ?? [], // Assuming user.documents is already an array of DocumentFile from transformUser
      };
    } catch (error: any) {
      return rejectWithValue(formatBackendError(error));
    }
  }
);

// Create new user
export const createUser = createAsyncThunk<User, FormData, { rejectValue: string }>(
  'users/createUser',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post('/admin/users', formData);
      const user = response.data.admin_user; // This is the raw user model, documents is a JSON string
      
      return {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name ?? '',
        email: user.email,
        phone: user.phone ?? '',
        address: user.address ?? '',
        role: user.role,
        permissions: user.permission,
        status: (user.status.charAt(0).toUpperCase() + user.status.slice(1)) as User['status'],
        dateOfBirth: user.date_of_birth ?? '',
        employeeCode: user.employee_code ?? '',
        joiningDate: user.joining_date ?? '',
        alternateContact: user.alternate_contact ?? '',
        profilePicture: user.profile_image ?? '',
        documents: typeof user.documents === 'string' 
          ? JSON.parse(user.documents) 
          : (user.documents ?? []), // Parse if string, otherwise use as is or default to empty array
      };
    } catch (error: any) {
      return rejectWithValue(formatBackendError(error));
    }
  }
);

// Update user
export const updateUser = createAsyncThunk<User, { userId: number; formData: FormData }, { rejectValue: string }>(
  'users/updateUser',
  async ({ userId, formData }, { rejectWithValue }) => {
    try {
      formData.append('_method', 'PUT');
      const response = await api.post(`/admin/users/${userId}`, formData);
      const user = response.data.data; // This is the transformed user, documents is an array

      return {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name ?? '',
        email: user.email,
        phone: user.phone ?? '',
        address: user.address ?? '',
        role: user.role,
        permissions: user.permission,
        status: (user.status.charAt(0).toUpperCase() + user.status.slice(1)) as User['status'],
        dateOfBirth: user.date_of_birth ?? '',
        employeeCode: user.employee_code ?? '',
        joiningDate: user.joining_date ?? '',
        alternateContact: user.alternate_contact ?? '',
        profilePicture: user.profile_image ?? '',
        documents: user.documents ?? [],
      };
    } catch (error: any) {
      return rejectWithValue(formatBackendError(error));
    }
  }
);

// Reset user password
export const resetUserPassword = createAsyncThunk<void, { userId: number; password: string; password_confirmation: string }, { rejectValue: string }>(
  'users/resetPassword',
  async ({ userId, password, password_confirmation }, { rejectWithValue }) => {
    try {
      await api.post(`/admin/users/${userId}/reset-password`, {
        password,
        password_confirmation
      });
    } catch (error: any) {
      return rejectWithValue(formatBackendError(error));
    }
  }
);

// Delete user
export const deleteUser = createAsyncThunk<number, number, { rejectValue: string }>(
  'users/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      return userId;
    } catch (error: any) {
      return rejectWithValue(formatBackendError(error));
    }
  }
);

// Toggle user status
export const toggleUserStatus = createAsyncThunk<ToggleStatusResponse, number, { rejectValue: string }>(
  'users/toggleStatus',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/admin/users/${userId}/toggle-status`);
      return response.data.data as ToggleStatusResponse;
    } catch (error: any) {
      return rejectWithValue(formatBackendError(error));
    }
  }
);

// Fetch venue admins
export const fetchVenueAdmins = createAsyncThunk<TruncatedUser[], void, { rejectValue: string }>(
  'users/fetchVenueAdmins',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/users/venue-admins');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(formatBackendError(error));
    }
  }
);

// Upload user profile picture
export const uploadUserProfilePicture = createAsyncThunk<
  string,
  { userId: number; file: File },
  { rejectValue: string }
>(
  'users/uploadProfilePicture',
  async ({ userId, file }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('profile_image', file);
      formData.append('user_id', userId.toString());

      const response = await api.post('/admin/profile/upload-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.profile_image;
    } catch (error: any) {
      return rejectWithValue((formatBackendError(error)));
    }
  }
);

// Bulk Import Users
export const bulkImportUsers = createAsyncThunk<
  BulkImportResponse,
  { users: BulkImportUserData[] },
  { rejectValue: string }
>('users/bulkImportUsers', async (data, { rejectWithValue }) => {
  try {
    const response = await api.post('/admin/users/bulk-import', data);
    return response.data as BulkImportResponse;
  } catch (error: any) {
    return rejectWithValue(formatBackendError(error));
  }
});

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearSelectedUser: (state) => {
      state.selectedUser = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        // If paginated (Laravel paginator has 'data' and 'current_page')
        if (action.payload && action.payload.data && action.payload.current_page !== undefined) {
          state.users = action.payload.data.map((user: any) => ({
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name ?? '',
            email: user.email,
            phone: user.phone ?? '',
            address: user.address ?? '',
            role: user.role,
            permissions: user.permission,
            status: (user.status.charAt(0).toUpperCase() + user.status.slice(1)) as User['status'],
            dateOfBirth: user.date_of_birth ?? '',
            employeeCode: user.employee_code ?? '',
            joiningDate: user.joining_date ?? '',
            alternateContact: user.alternate_contact ?? '',
            profilePicture: user.profile_image ?? '',
            documents: user.documents ?? [],
          }));
          state.pagination = {
            current_page: action.payload.current_page,
            last_page: action.payload.last_page,
            total: action.payload.total,
            per_page: action.payload.per_page,
          };
        } else if (Array.isArray(action.payload.data)) {
          // Not paginated, but wrapped in {data: []}
          state.users = action.payload.data.map((user: any) => ({
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name ?? '',
            email: user.email,
            phone: user.phone ?? '',
            address: user.address ?? '',
            role: user.role,
            permissions: user.permission,
            status: (user.status.charAt(0).toUpperCase() + user.status.slice(1)) as User['status'],
            dateOfBirth: user.date_of_birth ?? '',
            employeeCode: user.employee_code ?? '',
            joiningDate: user.joining_date ?? '',
            alternateContact: user.alternate_contact ?? '',
            profilePicture: user.profile_image ?? '',
            documents: user.documents ?? [],
          }));
          state.pagination = null;
        } else if (Array.isArray(action.payload)) {
          // Not paginated, just array
          state.users = action.payload;
          state.pagination = null;
        } else {
          state.users = [];
          state.pagination = null;
        }
        state.error = null;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch users';
      })

      // Fetch Single User
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedUser = action.payload;
        state.error = null;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch user';
      })

      // Create User
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users.unshift(action.payload);
        state.error = null;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create user';
      })

      // Update User
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedUser = action.payload;
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update user';
      })

      // Delete User
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.filter(user => user.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete user';
      })

      // Toggle User Status
      .addCase(toggleUserStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleUserStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index].status = action.payload.status;
        }
        if (state.selectedUser?.id === action.payload.id) {
          state.selectedUser.status = action.payload.status;
        }
        state.error = null;
      })
      .addCase(toggleUserStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to toggle user status';
      })

      // Fetch Venue Admins
      .addCase(fetchVenueAdmins.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVenueAdmins.fulfilled, (state, action) => {
        state.loading = false;
        state.venueAdmins = action.payload;
        state.error = null;
      })
      .addCase(fetchVenueAdmins.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch venue admins';
      })

      // Upload User Profile Picture
      .addCase(uploadUserProfilePicture.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadUserProfilePicture.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        const user = state.users.find(u => u.id === state.selectedUser?.id);
        if (user) {
          user.profilePicture = action.payload;
        }
        if (state.selectedUser) {
          state.selectedUser.profilePicture = action.payload;
        }
        state.error = null;
      })
      .addCase(uploadUserProfilePicture.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to upload profile picture';
      })

      // Bulk Import Users
      .addCase(bulkImportUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkImportUsers.fulfilled, (state, action) => {
        state.loading = false;
        // Add the newly created users to the beginning of the users list
        const newUsers = action.payload.created_users.map((userFromApi): User => ({
          id: userFromApi.id,
          firstName: userFromApi.first_name,
          lastName: userFromApi.last_name ?? '',
          email: userFromApi.email,
          phone: userFromApi.phone ?? '',
          address: userFromApi.address ?? '',
          role: userFromApi.role, 
          permissions: userFromApi.permission, 
          status: (userFromApi.status.charAt(0).toUpperCase() + userFromApi.status.slice(1)) as User['status'],
          dateOfBirth: userFromApi.date_of_birth ?? '',
          employeeCode: userFromApi.employee_code ?? '',
          joiningDate: userFromApi.joining_date ?? '',
          alternateContact: userFromApi.alternate_contact ?? '',
          profilePicture: '', 
          documents: [], 
        }));
        state.users.unshift(...newUsers);
        state.error = null;
      })
      .addCase(bulkImportUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to import users';
      });
  },
});

export const { clearSelectedUser, clearError } = userSlice.actions;
export default userSlice.reducer;
