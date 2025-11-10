
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Session } from '@/types/session';
import batchService from '@/api/batchService';

interface SessionDetailsState {
  sessions: Session[];
  loading: boolean;
  error: string | null;
}

const initialState: SessionDetailsState = {
  sessions: [],
  loading: false,
  error: null,
};

// Async thunk to fetch sessions by batchId
export const fetchSessionsByBatchId = createAsyncThunk(
  'sessionDetails/fetchByBatch',
  async (batchId: number, { rejectWithValue }) => {
    try {
      const data: Session[] = await batchService.fetchSessionsByBatchId(batchId);  
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const sessionDetailsSlice = createSlice({
  name: 'sessionDetails',
  initialState,
  reducers: {
    clearSessionDetails: (state) => {
      state.sessions = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSessionsByBatchId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSessionsByBatchId.fulfilled, (state, action: PayloadAction<Session[]>) => {
        state.loading = false;
        state.sessions = action.payload;
      })
      .addCase(fetchSessionsByBatchId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSessionDetails } = sessionDetailsSlice.actions;
export default sessionDetailsSlice.reducer;
