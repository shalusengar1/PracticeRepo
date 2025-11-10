import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/api/axios';

interface DashboardStats {
  total_users: number;
  total_batches: number;
  active_venues: number;
  upcoming_events: number;
  total_programs: number;
  active_partners: number;
  total_sessions: number;
  completed_sessions: number;
  new_members: number;
  new_batches: number;
  user_growth: number;
  batch_growth: number;
  recent_activities: any[];
}

interface DashboardState {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  stats: null,
  loading: false,
  error: null
};

export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch dashboard stats';
      });
  }
});

export default dashboardSlice.reducer; 