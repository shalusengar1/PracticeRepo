import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/api/axios';
import { Member, MemberFormData, BatchSummary } from '@/types/member.ts';

interface FetchMembersWithFieldsPayload {
  fields?: string[]; // Array of field names
}

interface MemberState {
  members: Member[];
  selectedMember: Member | null;
  loading: boolean;
  error: string | null;
  currentPage: number;
  perPage: number;
  totalPages: number;
  totalMembers: number;
}

// Defined the structure for pausing attendance
interface TogglePausePayload {
  memberId: number; 
  action: 'pause' | 'resume'; 
  pause_reason?: string;      // Only relevant for 'pause' action
  pause_end_date?: string;    // YYYY-MM-DD, only relevant for 'pause' action
}

interface FetchMembersPaginatedPayload {
  page?: number;
  perPage?: number;
  programId?: number;
  batchId?: string;
  search?: string;
}

const initialState: MemberState = {
  members: [],
  selectedMember: null,
  loading: false,
  error: null,
  currentPage: 1,
  perPage: 10,
  totalPages: 1,
  totalMembers: 0,
};

// Fetch all members
export const fetchMembers = createAsyncThunk<Member[], void, { rejectValue: string }>(
  'members/fetchMembers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/members');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error);
    }
  }
);

export const fetchMembersWithFields = createAsyncThunk(
  'members/fetchMembersWithFields',
  async (payload: FetchMembersWithFieldsPayload | undefined, { rejectWithValue }) => {
    try {
      // UPDATED URL to point to the new dedicated endpoint
      let url = '/admin/members/members-for-studentlist'; 
      if (payload?.fields && payload.fields.length > 0) {
        url += `?fields=${payload.fields.join(',')}`;
      }
      const response = await api.get(url);
      return response.data; 
    } catch (error: any) {
      return rejectWithValue(error);
    }
  }
);


// Fetch a single member by ID
export const fetchMemberById = createAsyncThunk<Member, number, { rejectValue: string }>(
  'members/fetchMemberById',
  async (memberId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/members/${memberId}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error);
    }
  }
);

// Create a new member
export const createMember = createAsyncThunk<Member, MemberFormData, { rejectValue: string }>(
  'members/createMember',
  async (memberData, { rejectWithValue }) => {
    try {
      const response = await api.post('/admin/members', memberData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error);
    }
  }
);

// Update an existing member
export const updateMember = createAsyncThunk<Member, { id: number; memberData: Partial<MemberFormData> }, { rejectValue: string }>(
  'members/updateMember',
  async ({ id, memberData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/members/${id}`, memberData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error);
    }
  }
);

// Delete a member
export const deleteMember = createAsyncThunk<number, number, { rejectValue: string }>(
  'members/deleteMember',
  async (memberId, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/members/${memberId}`);
      return memberId;
    } catch (error: any) {
      return rejectWithValue(error);
    }
  }
);

export const toggleMemberPauseStatus = createAsyncThunk(
  'members/togglePauseStatus',
  async (payload: TogglePausePayload, { rejectWithValue }) => {
    try {
      const { memberId, ...data } = payload;
      const response = await api.put(`/admin/members/${memberId}/toggle-pause`, data);
      return response.data.data; // Assuming backend returns updated member in 'data' field
    } catch (error: any) {
      return rejectWithValue(error);
    }
  }
);

export const fetchMembersPaginated = createAsyncThunk(
  'members/fetchMembersPaginated',
  async (params: FetchMembersPaginatedPayload, { rejectWithValue }) => {
    try {
      const { page = 1, perPage = 10, programId, batchId, search } = params;
      const response = await api.get('/admin/members', {
        params: { 
          page, 
          per_page: perPage, 
          paginate: true,
          program_id: programId,
          batch_id: batchId,
          search,
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error);
    }
  }
);

const memberSlice = createSlice({
  name: 'members',
  initialState,
  reducers: {
    clearSelectedMember(state) {
      state.selectedMember = null;
    },
    setSelectedMember(state, action: PayloadAction<Member>) {
      state.selectedMember = action.payload;
    },
    resetMembers(state) {
      state.members = [];
      state.currentPage = 1;
      state.totalPages = 1;
      state.totalMembers = 0;
    },
    setCurrentPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchMembers
      .addCase(fetchMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMembers.fulfilled, (state, action: PayloadAction<Member[]>) => {
        state.loading = false;
        state.members = action.payload;
      })
      .addCase(fetchMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch members';
      })

      .addCase(fetchMembersWithFields.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMembersWithFields.fulfilled, (state, action) => {
        state.loading = false;
        state.members = action.payload; 
      })
      .addCase(fetchMembersWithFields.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Handle fetchMemberById
      .addCase(fetchMemberById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMemberById.fulfilled, (state, action: PayloadAction<Member>) => {
        state.loading = false;
        state.selectedMember = action.payload;
      })
      .addCase(fetchMemberById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch member details';
      })

      // Handle createMember
      .addCase(createMember.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMember.fulfilled, (state, action: PayloadAction<Member>) => {
        state.loading = false;
        state.members.unshift(action.payload);
      })
      .addCase(createMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create member';
      })

      // Handle updateMember
      .addCase(updateMember.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMember.fulfilled, (state, action: PayloadAction<Member>) => {
        state.loading = false;
        // Update the member in the members array
        state.members = state.members.map(member => 
          member.id === action.payload.id ? action.payload : member
        );
        // Update selected member if it's the one being updated
        if (state.selectedMember?.id === action.payload.id) {
          state.selectedMember = action.payload;
        }
      })
      .addCase(updateMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update member';
      })

      // Handle deleteMember
      .addCase(deleteMember.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMember.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        // Remove the deleted member from the members array
        state.members = state.members.filter(member => member.id !== action.payload);
        // Clear selected member if it's the one being deleted
        if (state.selectedMember?.id === action.payload) {
          state.selectedMember = null;
        }
      })
      .addCase(deleteMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete member';
      })
      .addCase(toggleMemberPauseStatus.pending, (state) => {
        state.loading = true; // Or a specific loading state like state.updatingStatus = true
      })
      .addCase(toggleMemberPauseStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.members.findIndex(m => m.id === action.payload.id);
        if (index !== -1) {
          state.members[index] = action.payload;
        }
      })
      .addCase(toggleMemberPauseStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string; // Or parse error object
      })
      .addCase(fetchMembersPaginated.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMembersPaginated.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const { data, current_page, last_page, per_page, total } = action.payload;
        // Append new members for "Load More", or replace if it's the first page
        if (current_page === 1) {
          state.members = data;
        } else {
          const existingIds = new Set(state.members.map(m => m.id));
          const newMembers = data.filter((m: Member) => !existingIds.has(m.id));
          state.members = [...state.members, ...newMembers];
        }
        state.currentPage = current_page;
        state.totalPages = last_page;
        state.perPage = per_page;
        state.totalMembers = total;
      })
      .addCase(fetchMembersPaginated.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as { message?: string })?.message || 'Failed to fetch members';
      });

  },
});

export const { clearSelectedMember, setSelectedMember, resetMembers, setCurrentPage } = memberSlice.actions;
export default memberSlice.reducer;