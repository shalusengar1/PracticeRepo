import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Amenity } from '@/types/amenity';
import amenityService from '@/services/amenityService';
import { formatBackendError } from '@/utils/errorHandling';
import { useToast } from '@/hooks/use-toast';

interface AmenityState {
  amenities: Amenity[];
  loading: boolean;
  error: string | null;
}

const initialState: AmenityState = {
  amenities: [],
  loading: false,
  error: null,
};

// Async Thunks
export const fetchAmenities = createAsyncThunk(
  'amenities/fetchAmenities',
  async (enabledOnly: boolean | undefined = undefined, { rejectWithValue }) => {
    try {
      const shouldFetchEnabledOnly = enabledOnly === undefined ? false : enabledOnly;
      const amenities = await amenityService.getAmenities(shouldFetchEnabledOnly);
      return amenities;
    } catch (error: any) {
      return rejectWithValue(formatBackendError(error));
    }
  }
);

export const createAmenity = createAsyncThunk(
  'amenities/createAmenity',
  async (amenityData: Omit<Amenity, 'id' | 'enabled'>, { rejectWithValue }) => {
    try {
      const amenity = await amenityService.createAmenity(amenityData);
      return amenity;
    } catch (error: any) {
      return rejectWithValue(formatBackendError(error));
    }
  }
);

export const updateAmenity = createAsyncThunk(
  'amenities/updateAmenity',
  async ({ id, amenityData }: { id: number; amenityData: Partial<Omit<Amenity, 'id'>> }, { rejectWithValue }) => {
    try {
      const amenity = await amenityService.updateAmenity(id, amenityData);
      return amenity;
    } catch (error: any) {
      return rejectWithValue(formatBackendError(error));
    }
  }
);

export const updateAmenitiesBulk = createAsyncThunk(
  'amenities/updateAmenitiesBulk',
  async (updates: { id: number; enabled: boolean }[], { rejectWithValue }) => {
    try {
      const updatedAmenities = await amenityService.updateAmenitiesBulk(updates);
      return updatedAmenities;
    } catch (error: any) {
      return rejectWithValue(formatBackendError(error));
    }
  }
);

export const deleteAmenity = createAsyncThunk<
  number, // Return type: ID of the deleted amenity
  number, // Argument type: amenity ID to delete
  { rejectValue: string }
>(
  'amenities/deleteAmenity',
  async (amenityId, { rejectWithValue }) => {
    try {
      // Assumes amenityService.deleteAmenity(id) makes the API call
      await amenityService.deleteAmenity(amenityId);
      return amenityId; // Return the ID on success
    } catch (error: any) {
      return rejectWithValue(formatBackendError(error));
    }
  }
);

// Create a custom hook for handling amenity-related toasts
export const useAmenityToasts = () => {
  const { toast } = useToast();

  const showSuccessToast = (message: string) => {
    toast({
      title: "Success",
      description: message,
    });
  };

  const showErrorToast = (error: string) => {
    toast({
      title: "Error",
      description: error,
      variant: "destructive",
    });
  };

  return { showSuccessToast, showErrorToast };
};

const amenitySlice = createSlice({
  name: 'amenities',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Amenities
      .addCase(fetchAmenities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAmenities.fulfilled, (state, action: PayloadAction<Amenity[]>) => {
        state.loading = false;
        state.amenities = action.payload;
      })
      .addCase(fetchAmenities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create Amenity
      .addCase(createAmenity.pending, (state) => {
        state.error = null;
      })
      .addCase(createAmenity.fulfilled, (state, action: PayloadAction<Amenity>) => {
        state.loading = false;
        state.amenities.unshift(action.payload);
      })
      .addCase(createAmenity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update Amenity
      .addCase(updateAmenity.pending, (state) => {
        state.error = null;
      })
      .addCase(updateAmenity.fulfilled, (state, action: PayloadAction<Amenity>) => {
        state.loading = false;
        state.amenities = state.amenities.map(amenity =>
          amenity.id === action.payload.id ? action.payload : amenity
        );
      })
      .addCase(updateAmenity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // update a set of amenities
      .addCase(updateAmenitiesBulk.fulfilled, (state, action) => {
        state.loading = false;
        action.payload?.forEach((updatedAmenity: Amenity) => {
          const index = state.amenities.findIndex(a => a.id === updatedAmenity.id);
          if (index !== -1) {
            state.amenities[index] = updatedAmenity;
          }
        });
      })
      .addCase(updateAmenitiesBulk.pending, (state) => {
        state.error = null;
      })
      .addCase(updateAmenitiesBulk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete Amenity
      .addCase(deleteAmenity.pending, (state) => {
        // state.loading = true;
        state.error = null;
      })
      .addCase(deleteAmenity.fulfilled, (state, action: PayloadAction<number>) => {
        // state.loading = false;
        state.amenities = state.amenities.filter(amenity => amenity.id !== action.payload);
      })
      .addCase(deleteAmenity.rejected, (state, action) => {
        // state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = amenitySlice.actions;

export default amenitySlice.reducer;
