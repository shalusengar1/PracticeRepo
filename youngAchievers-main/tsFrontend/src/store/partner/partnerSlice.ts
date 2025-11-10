import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api from "@/api/axios";

interface BatchInfo {
  id: number;
  name: string;
  status?: string;
  pivot?: any;
}

interface Partner {
  id: number;
  name: string;
  specialization: string;
  email: string;
  mobile: string;
  status: "Active" | "Inactive";
  payType: "Fixed" | "Revenue Share";
  payAmount?: number;
  payPercentage?: number;
  tdsPercentage?: number | null;
  paymentTerms: string;
  assignedBatches?: BatchInfo[];
  attendance?: {
    [batch: string]: {
      date: string;
      status: "Present" | "Absent" | "Late";
      startTime: string;
      endTime: string;
    }[];
  };
}

interface PaginatedResponse {
  data: Partner[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface PartnerState {
  partners: Partner[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalPartners: number;
  perPage: number;
}

interface FetchPartnersParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
  paginate?: boolean;
  payType?: string;
  fields?: string[];
}

const initialState: PartnerState = {
  partners: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  totalPartners: 0,
  perPage: 10,
};

export const fetchPartners = createAsyncThunk<
  any,
  FetchPartnersParams,
  { rejectValue: string }
>(
  "partners/fetchPartners",
  async (params: FetchPartnersParams = {}, { rejectWithValue }) => {
    try {
      const { page = 1, perPage = 10, search = '', status, paginate = true, payType, fields } = params;
      const response = await api.get("/admin/partners", {
        params: {
          page,
          per_page: perPage,
          search,
          status,
          paginate,
          pay_type: payType,
          fields: fields?.join(','),
        },
      });
      const paginatedData = response.data;
      // If paginated response
      if (paginatedData.data && paginatedData.current_page !== undefined) {
        return {
          data: paginatedData.data.map((partner: any) => ({
            id: partner.id,
            name: partner.name,
            specialization: partner.specialization,
            email: partner.email,
            mobile: partner.mobile,
            status: partner.status,
            payType: partner.pay_type,
            payPercentage: partner.pay_percentage,
            payAmount: partner.pay_amount,
            paymentTerms: partner.payment_terms,
            tdsPercentage: partner.tds_percentage,
            assignedBatches: partner.batches ? partner.batches.map((b: any) => ({
              id: b.id,
              name: b.name,
              status: b.status,
              pivot: b.pivot
            })) : [],
          })),
          current_page: paginatedData.current_page,
          last_page: paginatedData.last_page,
          per_page: paginatedData.per_page,
          total: paginatedData.total,
        };
      } else if (Array.isArray(paginatedData)) { // Handle cases where the response is just an array
        return {
            data: paginatedData.map((partner: any) => ({
                id: partner.id,
                name: partner.name,
                specialization: partner.specialization,
                email: partner.email,
                mobile: partner.mobile,
                status: partner.status,
                payType: partner.pay_type,
                payPercentage: partner.pay_percentage,
                payAmount: partner.pay_amount,
                paymentTerms: partner.payment_terms,
                tdsPercentage: partner.tds_percentage,
                assignedBatches: partner.batches ? partner.batches.map((b: any) => ({
                    id: b.id,
                    name: b.name,
                    status: b.status,
                    pivot: b.pivot
                })) : [],
            })),
            current_page: 1,
            last_page: 1,
            per_page: paginatedData.length,
            total: paginatedData.length,
        };
      } else if (Array.isArray(paginatedData.data)) {
        // Non-paginated response
        return {
          data: paginatedData.data.map((partner: any) => ({
            id: partner.id,
            name: partner.name,
            specialization: partner.specialization,
            email: partner.email,
            mobile: partner.mobile,
            status: partner.status,
            payType: partner.pay_type,
            payPercentage: partner.pay_percentage,
            payAmount: partner.pay_amount,
            paymentTerms: partner.payment_terms,
            tdsPercentage: partner.tds_percentage,
            assignedBatches: partner.batches ? partner.batches.map((b: any) => ({
              id: b.id,
              name: b.name,
              status: b.status,
              pivot: b.pivot
            })) : [],
          })),
          current_page: 1,
          last_page: 1,
          per_page: paginatedData.data.length,
          total: paginatedData.data.length,
        };
      } else {
        // fallback
        return {
          data: [],
          current_page: 1,
          last_page: 1,
          per_page: 0,
          total: 0,
        };
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.response?.data?.errors || 'Failed to fetch partners');
    }
  }
);

export const loadMorePartners = createAsyncThunk<
  PaginatedResponse,
  FetchPartnersParams,
  { rejectValue: string }
>('partners/loadMorePartners', async (params, { rejectWithValue }) => {
  try {
    const response = await api.get('/admin/partners', { params });
    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || 'Failed to load more partners'
    );
  }
});

export const addPartner = createAsyncThunk<
  Partner, // Expected return type on success
  Omit<Partner, "id">, // Type of the first argument (partnerData)
  { rejectValue: string } // Type for rejectWithValue
>(
  "partners/addPartner",
  async (partnerData, { rejectWithValue }) => { // <-- Make sure to destructure rejectWithValue here
    try {
      const transformedData = {
        name: partnerData.name,
        specialization: partnerData.specialization,
        email: partnerData.email,
        mobile: partnerData.mobile,
        status: partnerData.status,
        pay_type: partnerData.payType,
        pay_percentage: partnerData.payPercentage ?? 0,
        pay_amount: partnerData.payAmount ?? 0,
        payment_terms: partnerData.paymentTerms,
        tds_percentage: partnerData.tdsPercentage ?? 0,
      };
      const response = await api.post("/admin/partners", transformedData);
      console.log(response.data.data);
      return response.data.data;
    } catch (error: any) {
      console.error("Error adding partner:", error);
      return rejectWithValue(error || 'Failed to add partner');
      // throw new Error(error.response?.data?.message || "Failed to add partner");
    }
  }
);

export const updatePartner = createAsyncThunk(
  "partners/updatePartner",
  async ({
    id,
    updatedPartner,
  }: {
    id: number;
    updatedPartner: Partial<Partner>;
  }, { rejectWithValue }) => {
    try {

      console.log("Updating partner with ID:", id);
      const response = await api.put(`/admin/partners/${id}`, {
        ...updatedPartner,
        pay_type: updatedPartner.payType,
        pay_percentage: updatedPartner.payPercentage,
        pay_amount: updatedPartner.payAmount,
        payment_terms: updatedPartner.paymentTerms,
        tds_percentage: updatedPartner.tdsPercentage,
      }); // Replace with your actual API endpoint

      const updated = response.data.data;
      return {
        ...updated,
        payType: updated.pay_type, 
        payPercentage: updated.pay_percentage, 
        payAmount: updated.pay_amount, 
        paymentTerms: updated.payment_terms, 
        tdsPercentage: updated.tds_percentage,
      };
    } catch (error: any) {
      
      // // Handle authentication errors
      // if (error.response?.status === 401) {
      //   console.log("Authentication error in updatePartner");
      //   return rejectWithValue({
      //     type: 'AUTHENTICATION_ERROR',
      //     message: 'Authentication failed. Please log in again.',
      //     originalError: error
      //   });
      // }
      
      // // Check if this is a "partner not found" error
      // if (error?.response?.data?.message?.includes('no longer exists') || 
      //     error?.response?.data?.message?.includes('may have been deleted')) {
      //   console.log("Detected partner not found error");
      //   // Return a special error object that can be handled by the UI
      //   return rejectWithValue({
      //     type: 'PARTNER_NOT_FOUND',
      //     message: error.response.data.message,
      //     originalError: error
      //   });
      // }
      
      return rejectWithValue(error);
    }
  }
);

export const deletePartner = createAsyncThunk<
  number, // ✅ we return the deleted partner's ID
  number, // ✅ we accept the partner's ID as the argument
  { rejectValue: string }
>(
  "partners/deletePartner",
  async (partnerId, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/partners/${partnerId}`);
      return partnerId;
    } catch (error: any) {
      console.error("Error deleting partner:", error);
      return rejectWithValue(error || 'Failed to delete partner');
    }
  }
);

const partnerSlice = createSlice({
  name: "partner",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPartners.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPartners.fulfilled,
        (state, action: PayloadAction<PaginatedResponse>) => {
          state.loading = false;
          state.partners = action.payload.data;
          state.currentPage = action.payload.current_page;
          state.totalPages = action.payload.last_page;
          state.perPage = action.payload.per_page;
          state.totalPartners = action.payload.total;
        }
      )
      .addCase(fetchPartners.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch partners";
      })
      .addCase(loadMorePartners.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadMorePartners.fulfilled, (state, action) => {
          state.loading = false;
          const existingIds = new Set(state.partners.map(p => p.id));
          const newPartners = action.payload.data.filter(p => !existingIds.has(p.id));
          state.partners.push(...newPartners);
          state.currentPage = action.payload.current_page;
          state.totalPages = action.payload.last_page;
      })
      .addCase(loadMorePartners.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload || 'Failed to load more partners';
      })
      .addCase(
        addPartner.fulfilled,
        (state, action: PayloadAction<any>) => { // Change PayloadAction type to any temporarily
          const newPartner = action.payload; // the data coming from the api

          // Transform snake_case keys to camelCase
          const transformedPartner: Partner = {
            ...newPartner,
            payType: newPartner.pay_type,
            payPercentage: newPartner.pay_percentage,
            payAmount: newPartner.pay_amount,
            paymentTerms: newPartner.payment_terms,
            tdsPercentage: newPartner.tds_percentage,
          };
          
          state.partners.unshift(transformedPartner);
        }
      )
      .addCase(
        updatePartner.fulfilled,
        (state, action: PayloadAction<Partner>) => {
          state.partners = state.partners.map((partner) =>
            partner.id === action.payload.id ? action.payload : partner
          );
        }
      )
      .addCase(deletePartner.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.partners = state.partners.filter(partner => partner.id !== action.payload);
      });
  },
});

export default partnerSlice.reducer;
