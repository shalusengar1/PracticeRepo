import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/api/axios'; // Assuming you have your axios instance

// Define the Program interface
export interface Program {
  id: number; // Assuming your backend uses numeric IDs
  name: string;
  description: string;
  members_count?: number;
}

// Define the state interface
interface ProgramState {
  programs: Program[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  perPage: number;
  totalPrograms: number;
  search: string;
  totalEnrolledMembers?: number;
}

// Initial state
const initialState: ProgramState = {
  programs: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  perPage: 10,
  totalPrograms: 0,
  search: '',
  totalEnrolledMembers: 0,
};

// Async thunks for CRUD operations
export const fetchPrograms = createAsyncThunk(
  'programs/fetchPrograms',
  async (params: { page?: number; perPage?: number; search?: string, paginate?: boolean, fields?: string[] } = {}, { getState }) => {
    const { page = 1, perPage = 10, search, paginate = true, fields } = params;
    const response = await api.get('/admin/programs', {
      params: { page, per_page: perPage, paginate, search, fields: fields?.join(',') },
    });
    return response.data;
  }
);

export const loadMorePrograms = createAsyncThunk(
  'programs/loadMorePrograms',
  async (params: { page?: number; perPage?: number; search?: string } = {}, { getState }) => {
    const { page = 1, perPage = 10, search } = params;
    const response = await api.get('/admin/programs', {
      params: { page, per_page: perPage, paginate: true, search },
    });
    return response.data;
  }
);

export const fetchProgramsWithCount = createAsyncThunk(
  'programs/fetchProgramsWithCount',
  async (params: { page?: number; perPage?: number } = {}, { rejectWithValue }) => {
    try {
      const { page = 1, perPage = 10 } = params;
      const response = await api.get('/admin/programs/with-member-count', {
        params: { page, per_page: perPage },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error);
    }
  }
);

export const addProgram = createAsyncThunk(
  'programs/addProgram',
  async (program: Omit<Program, 'id'>) => {
    const response = await api.post('/admin/programs', program);
    return response.data.data as Program;
  }
);

export const updateProgram = createAsyncThunk(
  'programs/updateProgram',
  async (program: Program) => {
    const response = await api.put(`/admin/programs/${program.id}`, program);
    return response.data.data as Program;
  }
);

export const deleteProgram = createAsyncThunk(
  'programs/deleteProgram',
  async (id: number) => {
    await api.delete(`/admin/programs/${id}`);
    return id; // Return the ID of the deleted program
  }
);

// Create the slice
const programSlice = createSlice({
  name: 'programs',
  initialState,
  reducers: {
    setProgramSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
      state.currentPage = 1; // Reset to first page on new search
    },
    setCurrentPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPrograms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPrograms.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        if (Array.isArray(action.payload)) { // Non-paginated
        state.programs = action.payload;
          state.totalPrograms = action.payload.length;
          state.currentPage = 1;
          state.totalPages = 1;
        } else { // Paginated
          state.programs = action.payload.data;
          state.currentPage = action.payload.current_page;
          state.totalPages = action.payload.last_page;
          state.perPage = action.payload.per_page;
          state.totalPrograms = action.payload.total;
        }
      })
      .addCase(fetchPrograms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch programs';
      })
      .addCase(loadMorePrograms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadMorePrograms.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const existingIds = new Set(state.programs.map(p => p.id));
        const newPrograms = action.payload.data.filter((p: Program) => !existingIds.has(p.id));
        state.programs.push(...newPrograms);
        state.currentPage = action.payload.current_page;
        state.totalPages = action.payload.last_page;
        state.perPage = action.payload.per_page;
        state.totalPrograms = action.payload.total;
      })
      .addCase(loadMorePrograms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch more programs';
      })
      .addCase(fetchProgramsWithCount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProgramsWithCount.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        if (action.payload.current_page === 1) {
            state.programs = action.payload.data;
        } else {
            const existingIds = new Set(state.programs.map(p => p.id));
            const newPrograms = action.payload.data.filter((p: Program) => !existingIds.has(p.id));
            state.programs.push(...newPrograms);
        }
        if (action.payload.total_enrolled_members !== undefined) {
            state.totalEnrolledMembers = action.payload.total_enrolled_members;
        }
        state.currentPage = action.payload.current_page;
        state.totalPages = action.payload.last_page;
        state.perPage = action.payload.per_page;
        state.totalPrograms = action.payload.total;
      })
      .addCase(fetchProgramsWithCount.rejected, (state, action) => {
          state.loading = false;
          state.error = (action.payload as any)?.message || 'Failed to fetch programs with count';
      })
      .addCase(addProgram.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addProgram.fulfilled, (state, action: PayloadAction<Program>) => {
        state.loading = false;
        state.programs.unshift(action.payload);
      })
      .addCase(addProgram.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add program';
      })
      .addCase(updateProgram.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProgram.fulfilled, (state, action: PayloadAction<Program>) => {
        state.loading = false;
        state.programs = state.programs.map((program) =>
          program.id === action.payload.id ? action.payload : program
        );
      })
      .addCase(updateProgram.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update program';
      })
      .addCase(deleteProgram.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProgram.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.programs = state.programs.filter((program) => program.id !== action.payload);
      })
      .addCase(deleteProgram.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete program';
      });
  },
});

export const { setProgramSearch, setCurrentPage } = programSlice.actions;

export default programSlice.reducer;
