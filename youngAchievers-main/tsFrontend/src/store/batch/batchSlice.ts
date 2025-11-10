import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import batchService from '@/api/batchService';

export interface DropdownItem {
  id: number;
  name: string;
  venue_image?: string;
  spot_image?: string;
}

interface PartnerName {
  id: number;
  name: string;
  specialization: string;
}

export interface Batch {
  id: string;
  name: string;
  programId: number;
  type: string;
  venueId: number;
  venueSpotId: number;
  capacity: number;
  memberCount?: number;
  partnerIds: number[];
  partners: Array<{
    id: number;
    name: string;
    specialization: string;
  }>;
  venue: {
    id: number;
    venue_name: string;
    venue_image?: string;
  };
  spot: {
    id: number;
    spot_name: string;
    spot_image?: string;
  };
  program: {id: number; name: string};
  description: string;
  startDate: string;
  endDate: string;
  sessionStartTime: string;
  sessionEndTime: string;
  noOfSessions: number;
  schedulePattern: string;
  amount: number;
  currency: string;
  discountAvailable: boolean;
  discountPercentage: number;
  status: string;
  progress: number;
  selectedSessionDates: string[];
  feeConfiguration?: { 
    type: 'fixed' | 'recurring' | 'subscription';
    paymentModel: 'monthly' | 'subscription';
    currency: string;
    amount: number;
    duration?: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
    hasDiscount: boolean;
    discountPercent?: number;
    proration?: {
      enabled: boolean;
      prorationMethod: 'daily' | 'weekly' | 'none';
      billingCycleDay?: number;
    };
  };
}

interface BatchState {
  batches: Batch[];
  loading: boolean;
  error: string | null;
  partners: PartnerName[];
  venues: DropdownItem[]; 
  programs: DropdownItem[]; 
  venueSpots: DropdownItem[]; 
  spotsLoading: boolean;
  spotsError: string | null;
  programsFetched: boolean;
  venuesFetched: boolean;
  partnersFetched: boolean;
  currentPage: number;
  totalPages: number;
  perPage: number;
  totalBatches: number;
  searchQuery: string;
}

const initialState: BatchState = {
  batches: [],
  loading: false,
  error: null,
  programs: [],
  programsFetched: false,
  venues: [],
  venuesFetched: false,
  partners: [],
  partnersFetched: false,
  venueSpots: [],
  spotsLoading: false,
  spotsError: null,
  currentPage: 1,
  totalPages: 1,
  perPage: 10,
  totalBatches: 0,
  searchQuery: '',
};

const createDropdownThunk = <
  TResponseItem,
  TDropdownItem extends DropdownItem = DropdownItem,
  TArg = void 
>(
  type: string,
  serviceMethod: (arg: TArg) => Promise<TResponseItem[]>,
  mapFn: (item: TResponseItem) => TDropdownItem = (item: any) => ({
    id: item.id,
    name: item.name,
  } as TDropdownItem)
) =>
  createAsyncThunk<TDropdownItem[], TArg>(
    type,
    async (arg: TArg, thunkAPI) => {
      const response = await serviceMethod(arg);
      return response.map(mapFn);
    }
  );

export interface FetchBatchesParams {
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  paginate?: boolean; // Added paginate flag
}

export const fetchBatches = createAsyncThunk(
  'batches/fetchBatches',
  async (params: FetchBatchesParams = {}) => {
    return await batchService.fetchBatches(params);
  }
);

export const loadMoreBatches = createAsyncThunk(
  'batches/loadMoreBatches',
  async (params: FetchBatchesParams = {}) => {
    return await batchService.fetchBatches(params);
  }
);

export const fetchPrograms = createDropdownThunk<DropdownItem>('batches/fetchPrograms', batchService.fetchPrograms);

export const fetchPartners = createAsyncThunk<PartnerName[]>( 
  'batches/fetchPartners',
  async () => {
    const response = await batchService.fetchPartners(); 
    return response.map((partner: any) => ({
      id: partner.id,
      name: partner.name,
      specialization: partner.specialization, 
    }));
  }
);

export const fetchVenues = createDropdownThunk('batches/fetchVenues', batchService.fetchVenues);

export const fetchVenueSpots = createAsyncThunk<DropdownItem[], number>(
  'batches/fetchVenueSpots',
  async (venueId: number, { rejectWithValue }) => {
    try {
      const response = await batchService.fetchVenueSpots(venueId);

      if (!Array.isArray(response)) {
        console.error('fetchVenueSpots: API response is not an array:', response);
        return rejectWithValue('Invalid API response format for venue spots');
      }

      const mappedSpots = response
        .map((item: any) => { 
          const id = item?.id;
          const name = item?.name;
          const spot_image = item?.spot_image;

          if (typeof id === 'number' && typeof name === 'string') {
            return { id, name, spot_image } as DropdownItem;
          }
          console.warn('fetchVenueSpots: Skipping invalid spot item from API due to missing or invalid id/name:', item);
          return null; 
        })
        .filter((item) => item !== null) as DropdownItem[];

      return mappedSpots;
    } catch (error: any) {
      console.error('Failed to fetch venue spots:', error);
      return rejectWithValue(error.message || 'An unknown error occurred while fetching venue spots');
    }
  }
);

export const addBatch = createAsyncThunk('batches/addBatch', async (batch: Omit<Batch, 'id'>) => {
  return await batchService.addBatch(batch);
});

export const updateBatch = createAsyncThunk('batches/updateBatch', async (batch: Batch) => {
  return await batchService.updateBatch(batch);
});

export const deleteBatch = createAsyncThunk('batches/deleteBatch', async (id: string) => {
  await batchService.deleteBatch(id);
  return id;
});

const batchSlice = createSlice({
  name: 'batches',
  initialState,
  reducers: {
    resetBatchState: () => initialState,
    clearVenueSpots: (state) => {
      state.venueSpots = [];
      state.spotsLoading = false;
      state.spotsError = null;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBatches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBatches.fulfilled, (state, action) => {
        state.loading = false;
        
        if (action.payload.current_page !== undefined) {
          state.batches = action.payload.data; // Replace for page-based navigation
          state.currentPage = action.payload.current_page;
          state.totalPages = action.payload.last_page;
          state.perPage = action.payload.per_page;
          state.totalBatches = action.payload.total;
        } else {
          // Handle non-paginated response
          state.batches = action.payload.data;
        }
      })
      .addCase(fetchBatches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch batches';
      })
      .addCase(loadMoreBatches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadMoreBatches.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.current_page !== undefined) {
            const existingIds = new Set(state.batches.map(b => b.id));
            const newBatches = action.payload.data.filter((b: Batch) => !existingIds.has(b.id));
            state.batches.push(...newBatches); // Append for "Load More"
            state.currentPage = action.payload.current_page;
            state.totalPages = action.payload.last_page;
            state.perPage = action.payload.per_page;
            state.totalBatches = action.payload.total;
        }
      })
      .addCase(loadMoreBatches.rejected, (state, action) => {
          state.loading = false;
          state.error = action.error.message || 'Failed to fetch batches';
      })
      .addCase(addBatch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addBatch.fulfilled, (state, action: PayloadAction<Batch>) => {
        state.loading = false;
        state.batches.push(action.payload);
      })
      .addCase(addBatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add batch';
      })
      .addCase(updateBatch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBatch.fulfilled, (state, action: PayloadAction<Batch>) => {
        state.loading = false;
        state.batches = state.batches.map(batch =>
          batch.id === action.payload.id ? action.payload : batch
        );
      })
      .addCase(updateBatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update batch';
      })
      .addCase(deleteBatch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBatch.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.batches = state.batches.filter(batch => batch.id !== action.payload);
      })
      .addCase(deleteBatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete batch';
      })
      .addCase(fetchPartners.pending, (state) => {
        state.loading = true; // Consider separate loading flags if fetches can happen in parallel
        state.error = null;
      })
      .addCase(fetchPartners.fulfilled, (state, action: PayloadAction<PartnerName[]>) => {
        state.partners = action.payload;
        state.partnersFetched = true;
        state.loading = false;
      })
      .addCase(fetchPartners.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch partners';
      })
      .addCase(fetchVenues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVenues.fulfilled, (state, action: PayloadAction<DropdownItem[]>) => {
        state.venues = action.payload;
        state.venuesFetched = true;
        state.loading = false;
      })
      .addCase(fetchVenues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch venues';
      })
      .addCase(fetchVenueSpots.pending, (state) => {
        state.spotsLoading = true;
        state.spotsError = null;
        // state.venueSpots = []; // Optionally clear previous spots when a new fetch starts
      })
      .addCase(fetchVenueSpots.fulfilled, (state, action: PayloadAction<DropdownItem[]>) => {
        state.spotsLoading = false;
        state.venueSpots = action.payload; // This now holds the correctly mapped and filtered spots
      })
      .addCase(fetchVenueSpots.rejected, (state, action) => {
        state.spotsLoading = false; // Changed from state.loading
        state.spotsError = action.error.message || 'Failed to fetch venue spots';
        state.venueSpots = []; // Clear spots on error
      })
      .addCase(fetchPrograms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPrograms.fulfilled, (state, action: PayloadAction<DropdownItem[]>) => {
        state.programs = action.payload;
        state.programsFetched = true;
        state.loading = false;
      })
      .addCase(fetchPrograms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch programs';
      });
  }
});

export const { resetBatchState, clearVenueSpots } = batchSlice.actions;
export default batchSlice.reducer;