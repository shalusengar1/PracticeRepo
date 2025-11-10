import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/api/axios';

export interface ActivityLog {
  id: string;
  action: string;
  user: string;
  target: string;
  timestamp: string;
  category: string;
  details: string;
  ip_address?: string;
  old_values?: any;
  new_values?: any;
  performed_by?: number;
  entity_type?: string;
  entity_id?: number;
}

interface ActivityLogsState {
  logs: ActivityLog[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  filters: {
    category: string;
    dateRange: string;
    search: string;
    sortOrder: 'asc' | 'desc';
  };
}

const initialState: ActivityLogsState = {
  logs: [],
  loading: false,
  error: null,
  totalPages: 1,
  currentPage: 1,
  filters: {
    category: 'all',
    dateRange: 'all',
    search: '',
    sortOrder: 'desc'
  }
};

// Async thunks
export const fetchActivityLogs = createAsyncThunk(
  'activityLogs/fetchActivityLogs',
  async (params: {
    page?: number;
    category?: string;
    dateRange?: string;
    search?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) => {
    const { 
      page = 1, 
      category = 'all', 
      dateRange = 'all', 
      search = '',
      sortOrder = 'desc'
    } = params;
    const response = await api.get('/admin/activity-logs', {
      params: {
        page,
        category: category !== 'all' ? category : undefined,
        date_range: dateRange !== 'all' ? dateRange : undefined,
        search: search || undefined,
        sort_order: sortOrder,
        per_page: 15
      }
    });
    return response.data;
  }
);

export const createActivityLog = createAsyncThunk(
  'activityLogs/createActivityLog',
  async (logData: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const response = await api.post('/admin/activity-logs', logData);
    return response.data;
  }
);

const activityLogsSlice = createSlice({
  name: 'activityLogs',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<ActivityLogsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.currentPage = 1; // Reset to first page when filters change
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch activity logs
      .addCase(fetchActivityLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivityLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.logs = action.payload.data.map((log: any) => ({
          id: log.id.toString(),
          action: log.action,
          user: log.user,
          target: log.target,
          timestamp: log.created_at,
          category: log.category,
          details: log.details,
          ip_address: log.ip_address,
          old_values: log.old_values,
          new_values: log.new_values,
          performed_by: log.performed_by,
          entity_type: log.entity_type,
          entity_id: log.entity_id
        }));
        state.totalPages = action.payload.last_page;
        state.currentPage = action.payload.current_page;
      })
      .addCase(fetchActivityLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch activity logs';
      })
      // Create activity log
      .addCase(createActivityLog.fulfilled, (state, action) => {
        const newLog: ActivityLog = {
          id: action.payload.id.toString(),
          action: action.payload.action,
          user: action.payload.user,
          target: action.payload.target,
          timestamp: action.payload.created_at,
          category: action.payload.category,
          details: action.payload.details,
          ip_address: action.payload.ip_address,
          old_values: action.payload.old_values,
          new_values: action.payload.new_values,
          performed_by: action.payload.performed_by,
          entity_type: action.payload.entity_type,
          entity_id: action.payload.entity_id
        };
        state.logs.unshift(newLog);
      });
  }
});

export const { setFilters, setCurrentPage, clearError } = activityLogsSlice.actions;
export default activityLogsSlice.reducer;