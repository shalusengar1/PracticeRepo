import api from "@/api/axios"; 
import { Batch, FetchBatchesParams } from "@/store/batch/batchSlice"; // Added FetchBatchesParams
import { Session } from '@/types/session';

const batchService = {
  async fetchBatches(params: FetchBatchesParams = {}): Promise<any> { // Accept params
    try {
      // Construct query parameters
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.perPage) queryParams.append('per_page', params.perPage.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.sortBy) queryParams.append('sort_by', params.sortBy);
      if (params.sortOrder) queryParams.append('sort_order', params.sortOrder);
      if (params.paginate !== undefined) queryParams.append('paginate', params.paginate.toString());

      const response = await api.get(`/admin/batches?${queryParams.toString()}`);
      const responseData = response.data.data || response.data; // Handle both paginated and non-paginated structures

      const mappedBatches = responseData.map((item: any) => ({
        id: item.id.toString(),
        name: item.name,
        programId: item.program_id,
        type: item.type,
        venueId: item.venue_id,
        venueSpotId: item.venue_spot_id,
        capacity: item.capacity,
        partners: item.partners || [],
        venue: item.venue ? {
          id: item.venue.venue_id,
          venue_name: item.venue.venue_name,
          venue_image: item.venue.venue_image
        } : { id: 0, venue_name: '', venue_image: null },
        spot: item.venue_spot ? {
          id: item.venue_spot.venue_spot_id,
          spot_name: item.venue_spot.spot_name,
          spot_image: item.venue_spot.spot_image
        } : { id: 0, spot_name: '', spot_image: null },
        program: item.program ? {
          id: item.program.id,
          name: item.program.name
        } : { id: 0, name: '' },
        description: item.description,
        startDate: item.start_date,
        endDate: item.end_date,
        sessionStartTime: item.session_start_time,
        sessionEndTime: item.session_end_time,
        noOfSessions: item.no_of_sessions,
        selectedSessionDates: item.selected_session_dates,
        schedulePattern: item.schedule_pattern,
        amount: item.amount,
        currency: item.currency,
        discountAvailable: item.discount_available,
        discountPercentage: item.discount_percentage || 0,
        status: item.status,
        progress: item.progress,
        memberCount: item.member_count,
        feeConfiguration: item.fee_configuration ? {
          type: item.fee_configuration.type,
          paymentModel: item.fee_configuration.payment_model,
          currency: item.fee_configuration.currency,
          amount: item.fee_configuration.amount,
          duration: item.fee_configuration.duration,
          hasDiscount: item.fee_configuration.has_discount,
          discountPercent: item.fee_configuration.discount_percent,
          proration: item.fee_configuration.proration ? {
            enabled: item.fee_configuration.proration.enabled,
            prorationMethod: item.fee_configuration.proration.proration_method,
            billingCycleDay: item.fee_configuration.proration.billing_cycle_day
          } : undefined
        } : undefined
      }));

      // If paginated, response.data will have pagination keys.
      // If not paginated, response.data will be the array directly (handled by responseData above).
      if (response.data.current_page !== undefined) { // Check if it's a paginated response
        return {
          data: mappedBatches,
          current_page: response.data.current_page,
          last_page: response.data.last_page,
          per_page: response.data.per_page,
          total: response.data.total
        };
      } else { // Non-paginated response
        return { data: mappedBatches }; // Return just the data array
      }

    } catch (error: any) {
      console.error("Error fetching batches:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch batches");
    }
  },

  async fetchPrograms() {
    try {
      const response = await api.get("/admin/programs?fields=id,name");
      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching programs:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch programs");
    }
  },

  async fetchPartners() {
    try {
      const response = await api.get("/admin/partners?fields=id,name,specialization");
      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching partners:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch partners");
    }
  },

  async fetchVenues() {
    try {
      const response = await api.get("/admin/venues?fields=venue_id,venue_name,venue_image");
      return response.data.data.map((venue: any) => ({
        id: venue.venue_id,
        name: venue.venue_name,
        venue_image: venue.venue_image
      }));
    } catch (error: any) {
      console.error("Error fetching venues:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch venues");
    }
  },

  async fetchVenueSpots(venueId: number) {
    try {
      const response = await api.get(`/admin/venues/${venueId}/spots?fields=venue_spot_id,spot_name,spot_image`);
      return response.data.data.map((spot: any) => ({
        id: spot.venue_spot_id,
        name: spot.spot_name,
        spot_image: spot.spot_image
      }));
    } catch (error: any) {
      console.error("Error fetching venue spots:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch venue spots");
    }
  },

  async addBatch(batchData: any) {
    try {
      const mappedData = {
        name: batchData.name,
        program_id: batchData.programId,
        type: batchData.type,
        venue_id: batchData.venueId || null,
        venue_spot_id: batchData.venueSpotId || null,
        partner_ids: batchData.partnerIds,
        capacity: batchData.capacity,
        description: batchData.description,
        start_date: batchData.startDate,
        end_date: batchData.endDate,
        session_start_time: batchData.sessionStartTime,
        session_end_time: batchData.sessionEndTime,
        no_of_sessions: batchData.noOfSessions,
        schedule_pattern: batchData.schedulePattern,
        amount: batchData.amount,
        currency: batchData.currency,
        discount_available: batchData.discountAvailable,
        discount_percentage: batchData.discountPercentage,
        status: batchData.status || 'active',
        progress: batchData.progress || 0,
        // selected_session_dates: batchData.schedulePattern === 'manual' ? batchData.selectedSessionDates : null
      };
      
      // Remove venue_id and venue_spot_id if they are null or 0
      if (!mappedData.venue_id) {
        delete mappedData.venue_id;
      }
      if (!mappedData.venue_spot_id) {
        delete mappedData.venue_spot_id;
      }

      const response = await api.post("/admin/batches", mappedData);
      return {
        id: response.data.data.id.toString(),
        ...batchData,
      };
    } catch (error: any) {
      // Handle validation errors (422)
      if (error?.response?.status === 422 && error?.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = Object.values(errors).flat();
        throw new Error(errorMessages.join(', '));
      }
      throw new Error(error?.response?.data?.message || error?.message || "Failed to add batch");
    }
  },

  async updateBatch(batchData: any) {
    try {
      const mappedData = {
        name: batchData.name,
        program_id: batchData.programId,
        type: batchData.type,
        venue_id: batchData.venueId || null,
        venue_spot_id: batchData.venueSpotId || null,
        partner_ids: batchData.partnerIds,
        capacity: batchData.capacity,
        description: batchData.description,
        start_date: batchData.startDate,
        end_date: batchData.endDate,
        session_start_time: batchData.sessionStartTime,
        session_end_time: batchData.sessionEndTime,
        no_of_sessions: batchData.noOfSessions,
        schedule_pattern: batchData.schedulePattern,
        amount: batchData.amount,
        currency: batchData.currency,
        discount_available: batchData.discountAvailable,
        discount_percentage: batchData.discountPercentage,
        status: batchData.status,
        progress: batchData.progress,
        selected_session_dates: batchData.schedulePattern === 'manual' ? batchData.selectedSessionDates : null
      };

      // Remove venue_id and venue_spot_id if they are null or 0
      if (!mappedData.venue_id) {
        delete mappedData.venue_id;
      }
      if (!mappedData.venue_spot_id) {
        delete mappedData.venue_spot_id;
      }

      const response = await api.put(`/admin/batches/${batchData.id}`, mappedData);
      return batchData;
    } catch (error: any) {
      console.error("Error updating batch:", error);
      throw new Error(error.response?.data?.message || "Failed to update batch");
    }
  },

  async deleteBatch(id: string) {
    try {
      await api.delete(`/admin/batches/${id}`);
      return true;
    } catch (error: any) {
      console.error("Error deleting batch:", error);
      throw new Error(error.response?.data?.message || "Failed to delete batch");
    }
  },

  async fetchSessionsByBatchId(batchId: number): Promise<Session[]> {
    try {
      const response = await api.get(`/admin/batches/${batchId}/sessions`);
      
      if (!response.data.data) {
        return [];
      }
      
      // Map the backend response to match our frontend Session type
      return response.data.data.sessions.map((session: any) => {
        // Calculate the day of week from the date
        const date = new Date(session.date);
        const day = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
        
        // Calculate a sequential session number if not provided
        const sessionNumber = session.session_number || (session.id % 100);
        
        return {
          id: session.id,
          batch_id: session.batch_id,
          date: session.date,
          start_time: session.start_time,
          end_time: session.end_time,
          status: session.status,
          notes: session.notes,
          created_at: session.created_at,
          updated_at: session.updated_at,
          venue: session.venue ? {
            venue_id: session.venue.venue_id,
            venue_name: session.venue.venue_name,
            venue_image: session.venue.venue_image
          } : undefined,
          spot: session.spot ? {
            venue_spot_id: session.spot.venue_spot_id,
            spot_name: session.spot.spot_name,
            spot_image: session.spot.spot_image
          } : undefined,
          day,
          sessionNumber
        };
      });
    } catch (error: any) {
      console.error("Error fetching sessions:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch sessions");
    }
  },
};

export default batchService;
