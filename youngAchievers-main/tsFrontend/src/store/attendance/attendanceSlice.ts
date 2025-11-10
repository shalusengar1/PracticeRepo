import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { format } from 'date-fns';
import { RootState } from '../store';
import api from '@/api/axios';
import { handleApiError } from '@/utils/errorHandling';


// Assuming AttendanceRecord is defined as in your component or a shared types file
// If not, define it here or import it.
interface AttendanceRecord {
  id: number;
  status: 'present' | 'absent' | 'excused' | 'not marked';
  display_status: 'present' | 'absent' | 'excused' | 'not marked';
  member?: { id: number; name: string; email: string; excused_until?: string };
  partner?: { id: number; name: string; email: string; excused_until?: string };
  marked_at: string;
  notes?: string;
  is_editable: boolean;
  batch_session?: {
    id: number;
    date: string; // 'yyyy-MM-dd'
    batch?: { id: number; name: string };
  };
}

// Assuming Batch type is defined elsewhere, e.g.,
interface Batch {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  members: Array<{ id: number; name: string; email: string; excused_until?: string }>;
  partners: Array<{ id: number; name: string; email: string; excused_until?: string }>;
  // Add other batch properties as needed
}

// Add new interface for API response
interface AttendanceApiResponse {
  data: AttendanceRecord[];
  current_date: string;
  message: string;
}

interface AttendanceState {
  batches: Batch[];
  // attendanceByDate: AttendanceRecord[]; // This might be deprecated or used for other purposes
  allBatchAttendanceData: Record<string, AttendanceRecord[]>; // Key: 'yyyy-MM-dd', Value: Attendance records for that date
  sessionsFromBatch: string[]; // Array of 'yyyy-MM-dd' date strings for sessions in the current batch
  recentAttendance: AttendanceRecord[]; // For the RecentAttendanceDialog
  loading: boolean;
  error: string | null;
  currentDate: string | null;
}

const initialState: AttendanceState = {
  batches: [],
  // attendanceByDate: [],
  allBatchAttendanceData: {},
  sessionsFromBatch: [],
  recentAttendance: [],
  loading: false,
  error: null,
  currentDate: null,
};

// Async Thunks

export const fetchBatches = createAsyncThunk('attendance/fetchBatches', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/admin/batches/with-members-partners');
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(handleApiError(error, 'Failed to fetch batches'));
  }
});

// NEW: Fetch all attendance for a specific batch and type
export const fetchAllAttendanceForBatch = createAsyncThunk(
  'attendance/fetchAllAttendanceForBatch',
  async (params: { batch_id: number; type: 'member' | 'partner' }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/attendance/batch/${params.batch_id}/all`, { params: { type: params.type } });
      const data = response.data as AttendanceApiResponse;
      
      // If no records found, reject with a standard message
      if (!data.data || data.data.length === 0) {
        return rejectWithValue('No attendance records found for this batch');
      }
      
      return data;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error, 'Failed to fetch attendance records'));
    }
  }
);

export const markAttendance = createAsyncThunk(
  'attendance/markAttendance',
  async (
    data: {
      type: 'member' | 'partner';
      person_id: number;
      batch_id: number;
      date: string; // 'yyyy-MM-dd'
      status: 'present' | 'absent' | 'excused' | 'not marked'; // Added 'not marked' for completeness
      notes?: string;
    },
    { rejectWithValue } // Removed dispatch, getState as they are not used for local update
  ) => {
    try {
      const response = await api.post('/admin/attendance/mark', data);
      // Return the updated record from the API and the original request data
      // for the reducer to perform a local update.
      return { updatedRecord: response.data as AttendanceRecord, originalRequest: data };
    } catch (error: any) {
      return rejectWithValue(handleApiError(error, 'Failed to mark attendance'));
    }
  }
);



// This thunk might be used by RecentAttendanceDialog or similar features
export const getPartnerRecentAttendance = createAsyncThunk(
  'attendance/getPartnerRecentAttendance',
  async (partnerId: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/attendance/partner/${partnerId}/recent`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error, 'Failed to fetch recent attendance'));
    }
  }
);


const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    // NEW: Action to clear the batch-specific attendance data
    clearAllBatchAttendanceData: (state) => {
      state.allBatchAttendanceData = {};
      state.sessionsFromBatch = [];
    },
    // Potentially, if you still need to clear specific date attendance for other features:
    // clearAttendanceByDate: (state) => {
    //   state.attendanceByDate = [];
    // },
  },
  extraReducers: (builder) => {
    builder
      // fetchBatches
      .addCase(fetchBatches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBatches.fulfilled, (state, action: PayloadAction<Batch[]>) => {
        state.loading = false;
        state.batches = action.payload;
      })
      .addCase(fetchBatches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // fetchAllAttendanceForBatch
      .addCase(fetchAllAttendanceForBatch.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.allBatchAttendanceData = {}; // Clear previous data
        state.sessionsFromBatch = [];      // Clear previous session dates
      })
      .addCase(fetchAllAttendanceForBatch.fulfilled, (state, action: PayloadAction<AttendanceApiResponse>) => {
        state.loading = false;
        const attendanceByDate: Record<string, AttendanceRecord[]> = {};
        const sessionDates = new Set<string>();

        // Extract current date from response
        state.currentDate = action.payload.current_date;

        action.payload.data.forEach((record: AttendanceRecord) => {
          if (record.batch_session?.date) {
            const dateKey = record.batch_session.date;
            if (!attendanceByDate[dateKey]) {
              attendanceByDate[dateKey] = [];
            }
            attendanceByDate[dateKey].push(record);
            sessionDates.add(dateKey);
          }
        });

        state.allBatchAttendanceData = attendanceByDate;
        state.sessionsFromBatch = Array.from(sessionDates).sort();
      })
      .addCase(fetchAllAttendanceForBatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.allBatchAttendanceData = {};
        state.sessionsFromBatch = [];
      })
      
      // markAttendance
      .addCase(markAttendance.pending, (state) => {
        // state.loading = true; // Or a more specific loading state like state.markingAttendance = true
        state.error = null;
      })
      .addCase(markAttendance.fulfilled, (state, action: PayloadAction<{ updatedRecord: AttendanceRecord, originalRequest: any }>) => {
        state.loading = false;
        const { updatedRecord, originalRequest } = action.payload;
        const dateKey = originalRequest.date; // 'yyyy-MM-dd'

        if (state.allBatchAttendanceData[dateKey]) {
          const personIdentifier = originalRequest.type === 'member' ? 'member' : 'partner';
          const personId = originalRequest.person_id;

          state.allBatchAttendanceData[dateKey] = state.allBatchAttendanceData[dateKey].map(
            (record) => {
              if (record[personIdentifier]?.id === personId) {
                return { ...record, ...updatedRecord, status: originalRequest.status, marked_at: updatedRecord.marked_at };
              }
              return record;
            }
          );
        }
        // Also update recentAttendance if the marked record is for a partner and is relevant
        // This part depends on how recentAttendance is structured and used.
        // For simplicity, we might need to re-fetch recent attendance if it's critical to be up-to-date immediately.
      })
      .addCase(markAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // getPartnerRecentAttendance
      .addCase(getPartnerRecentAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPartnerRecentAttendance.fulfilled, (state, action: PayloadAction<AttendanceRecord[]>) => {
        state.loading = false;
        state.recentAttendance = action.payload;
      })
      .addCase(getPartnerRecentAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearAllBatchAttendanceData } = attendanceSlice.actions;

// Selectors (already implicitly used by useSelector in the component, but good to define explicitly if needed elsewhere)
export const selectBatches = (state: RootState) => state.attendance.batches;
export const selectAllBatchAttendanceData = (state: RootState) => state.attendance.allBatchAttendanceData;
export const selectSessionsFromBatch = (state: RootState) => state.attendance.sessionsFromBatch;
export const selectAttendanceLoading = (state: RootState) => state.attendance.loading;
export const selectAttendanceError = (state: RootState) => state.attendance.error;
export const selectRecentAttendance = (state: RootState) => state.attendance.recentAttendance;
export const selectCurrentDate = (state: RootState) => state.attendance.currentDate;
export const selectIsSessionEditable = (state: RootState, date: string) => {
  const currentDate = state.attendance.currentDate;
  if (!currentDate) return false;
  
  return new Date(date).setHours(0, 0, 0, 0) <= new Date(currentDate).setHours(0, 0, 0, 0);
};


export default attendanceSlice.reducer;
