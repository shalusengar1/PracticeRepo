import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/api/axios';
import { formatBackendError } from '@/utils/errorHandling'; 

interface HolidayState {
  venueNamesAndHolidays: VenueNameAndHolidays[];
  loading: boolean;
  error: string | null;
}

const initialState: HolidayState = {
  venueNamesAndHolidays: [],
  loading: false,
  error: null,
};
export interface Holiday {
    id: number;
    venue_id: number;
    name: string;
    holiday_type: 'specific' | 'recurring';
    date: string | null; // ISO 8601 date string
    start_date: string | null;
    end_date: string | null;
    recurring_day: number | null;
  }
  
  export interface VenueNameAndHolidays {
    venue_id: number;
    venue_name: string;
    holidays: Holiday[];
  }

export interface AddVenueHolidayPayload extends Omit<Holiday, 'id'> {
  venue_name: string;
}

export interface AddMultipleVenueHolidaysPayload {
  venue_id: number;
  venue_name: string;
  holidays: Omit<Holiday, 'id' | 'venue_id'>[];
}

// Async Thunk: Fetch Venue Names and Holidays
export const fetchVenueNamesAndHolidays = createAsyncThunk<VenueNameAndHolidays[], void, { rejectValue: string }>(
  'holidays/fetchVenueNamesAndHolidays',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/venue-names-and-holidays');
      return response.data.data as VenueNameAndHolidays[];
    } catch (error: any) {
      // Use formatBackendError to process the error
      return rejectWithValue(formatBackendError(error));
    }
  }
);

// Async Thunks for Holidays (Modified)
export const addVenueHoliday = createAsyncThunk<Holiday, AddVenueHolidayPayload, { rejectValue: string }>(
  'holidays/addHoliday',
  async (holiday, { rejectWithValue }) => {
    try {
      const response = await api.post('/admin/venue-holidays', holiday);
      return response.data.data as Holiday;
    } catch (error: any) {
      // Use formatBackendError to process the error
      return rejectWithValue(formatBackendError(error));
    }
  }
);

// Async Thunk for adding multiple holidays
export const addMultipleVenueHolidays = createAsyncThunk<Holiday[], AddMultipleVenueHolidaysPayload, { rejectValue: string }>(
  'holidays/addMultipleHolidays',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post('/admin/venue-holidays/bulk', {
        venue_id: payload.venue_id,
        holidays: payload.holidays
      });
      return response.data.data as Holiday[];
    } catch (error: any) {
      // Use formatBackendError to process the error
      return rejectWithValue(formatBackendError(error));
    }
  }
);

export const deleteVenueHoliday = createAsyncThunk<number, { id: number; venueId: number }, { rejectValue: string }>(
  'holidays/deleteHoliday',
  async ({ id, venueId }, { rejectWithValue }) => { // venueId is available here if needed for error context, though not directly used in API call
    try {
      await api.delete(`/admin/venue-holidays/${id}`);
      return id; // Return the ID of the deleted holiday
    } catch (error: any) {
      // Use formatBackendError to process the error
      return rejectWithValue(formatBackendError(error));
    }
  }
);

const holidaySlice = createSlice({
  name: 'holidays',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Venue Names and Holidays
      .addCase(fetchVenueNamesAndHolidays.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVenueNamesAndHolidays.fulfilled, (state, action) => {
        state.loading = false;
        state.venueNamesAndHolidays = [...action.payload];
      })
      .addCase(fetchVenueNamesAndHolidays.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string; // Error is now the formatted string
      })

      .addCase(addVenueHoliday.fulfilled, (state, action) => {
        const newHoliday = action.payload;
        const existingVenueIndex = state.venueNamesAndHolidays.findIndex(v => v.venue_id === newHoliday.venue_id);
        
        if (existingVenueIndex === -1) {
          // Venue doesn't exist in the list yet, add it with the new holiday
          state.venueNamesAndHolidays.push({
            venue_id: newHoliday.venue_id,
            venue_name: action.meta.arg.venue_name || 'Unknown Venue', // Use venue name if provided
            holidays: [newHoliday]
          });
        } else {
          // Venue exists, add the holiday to its list
          state.venueNamesAndHolidays[existingVenueIndex].holidays.push(newHoliday);
        }
      })
      .addCase(addVenueHoliday.rejected, (state, action) => {
        state.error = action.payload as string; // Error is now the formatted string
      })

      // Add multiple holidays
      .addCase(addMultipleVenueHolidays.fulfilled, (state, action) => {
        const newHolidays = action.payload;
        if (newHolidays.length === 0) return;

        const venueId = newHolidays[0].venue_id;
        const existingVenueIndex = state.venueNamesAndHolidays.findIndex(v => v.venue_id === venueId);
        
        if (existingVenueIndex === -1) {
          // Venue doesn't exist in the list yet, add it with the new holidays
          state.venueNamesAndHolidays.push({
            venue_id: venueId,
            venue_name: action.meta.arg.venue_name || 'Unknown Venue',
            holidays: newHolidays
          });
        } else {
          // Venue exists, add the holidays to its list
          state.venueNamesAndHolidays[existingVenueIndex].holidays.push(...newHolidays);
        }
      })
      .addCase(addMultipleVenueHolidays.rejected, (state, action) => {
        state.error = action.payload as string; // Error is now the formatted string
      })

      // Delete Holiday
      .addCase(deleteVenueHoliday.pending, (state) => { // Optional: Add pending state for delete
        state.error = null;
      })
      .addCase(deleteVenueHoliday.fulfilled, (state, action) => {
        const deletedHolidayId = action.payload; // This is the ID of the holiday
        const venueId = action.meta.arg.venueId; // Get venueId from thunk arguments
        
        state.venueNamesAndHolidays = state.venueNamesAndHolidays.map(venue =>
          venue.venue_id === venueId
            ? { ...venue, holidays: venue.holidays.filter(h => h.id !== deletedHolidayId) }
            : venue
        );
      })
      .addCase(deleteVenueHoliday.rejected, (state, action) => {
        state.error = action.payload as string; // Error is now the formatted string
      });
  },
});

export const { clearError } = holidaySlice.actions;

export default holidaySlice.reducer;
