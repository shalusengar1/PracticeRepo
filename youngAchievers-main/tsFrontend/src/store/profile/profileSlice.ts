import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../api/axios';
import { formatBackendError } from '@/utils/errorHandling';

interface ProfileState {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  profilePicture: string;
  loading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  id: 0,
  firstName: '',
  lastName: '',
  email: '',
  mobile: '',
  profilePicture: '',
  loading: false,
  error: null,
};

export const fetchProfile = createAsyncThunk(
  'profile/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/me');
      const profileData = response.data;

      return {
        id: profileData.id,
        firstName: profileData.first_name || '',
        lastName: profileData.last_name || '',
        email: profileData.email || '',
        mobile: profileData.phone || '',
        profilePicture: profileData.profile_image || '',
      } as Omit<ProfileState, 'loading' | 'error'>;
    } catch (error: any) {
      return rejectWithValue(formatBackendError(error));
    }
  }
);

// Updated to accept FormData
export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async (
    formData: FormData, // Changed to accept FormData
    { rejectWithValue }
  ) => {
    try {
      // The backend expects field names like 'first_name', 'profileImage' etc.
      // These should be set directly in the FormData object in Profile.tsx
      const response = await api.post('/admin/profile', formData, { // Changed from api.put
        headers: {
          // Axios will automatically set Content-Type to multipart/form-data when FormData is passed
          // However, explicitly setting it can be done if needed, but often not necessary.
          // 'Content-Type': 'multipart/form-data', (Usually handled by Axios)
        },
      });
      const userData = response.data.user;

      return {
        firstName: userData.first_name || '',
        lastName: userData.last_name || '',
        email: userData.email || '',
        mobile: userData.phone || '',
        profilePicture: userData.profile_image || '', // Backend returns the updated image URL
      } as Omit<ProfileState, 'id' | 'loading' | 'error'>;
    } catch (error: any) {
      return rejectWithValue(formatBackendError(error));
    }
  }
);

// This thunk is no longer called directly from Profile.tsx for profile updates,
// but can be kept for other uses or removed if not needed elsewhere.
export const uploadProfilePicture = createAsyncThunk<
  string,
  { userId: number; file: File },
  { rejectValue: string }
>(
  'profile/uploadProfilePicture',
  async ({ userId, file }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('profile_image', file);
      formData.append('user_id', userId.toString()); // Ensure this matches backend expectation if used

      const response = await api.post('/admin/profile/upload-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.profile_image;
    } catch (error: any) {
      return rejectWithValue(formatBackendError(error));
    }
  }
);

export const refreshProfileImageUrl = createAsyncThunk(
  'profile/refreshProfileImageUrl',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/profile/refresh-image-url');
      return response.data.profile_image.url;
    } catch (error: any) {
      return rejectWithValue(formatBackendError(error));
    }
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setProfileData: (state, action: PayloadAction<Partial<ProfileState>>) => {
      return { ...state, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Profile
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action: PayloadAction<Omit<ProfileState, 'loading' | 'error'>>) => {
        state.id = action.payload.id;
        state.firstName = action.payload.firstName;
        state.lastName = action.payload.lastName;
        state.email = action.payload.email;
        state.mobile = action.payload.mobile;
        state.profilePicture = action.payload.profilePicture;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })      
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action: PayloadAction<Omit<ProfileState, 'id' | 'loading' | 'error'>>) => {
        state.firstName = action.payload.firstName;
        state.lastName = action.payload.lastName;
        state.email = action.payload.email;
        state.mobile = action.payload.mobile;
        state.profilePicture = action.payload.profilePicture; // This will update with the new URL from backend
        state.loading = false;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Upload Profile Picture (if kept for other uses)
      .addCase(uploadProfilePicture.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadProfilePicture.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.profilePicture = action.payload; // Updates profile picture if this thunk is used
      })
      .addCase(uploadProfilePicture.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Refresh Profile Image URL
      .addCase(refreshProfileImageUrl.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(refreshProfileImageUrl.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.profilePicture = action.payload;
      })
      .addCase(refreshProfileImageUrl.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setProfileData, clearError } = profileSlice.actions;
export default profileSlice.reducer;
