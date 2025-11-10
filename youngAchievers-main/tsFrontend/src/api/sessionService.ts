import api from "@/api/axios";
import { Session } from "@/types/session";

const sessionService = {
  async rescheduleSession(
    sessionId: number, 
    data: { date: string; start_time: string; end_time: string; notes?: string }
  ): Promise<Session> {
    try {
      const response = await api.put(`/admin/sessions/${sessionId}/reschedule`, data);
      return response.data.data;
    } catch (error: any) {
      console.error("Error rescheduling session:", error);
      // Use description field if available, otherwise fall back to message
      const errorMessage = error.response?.data?.description || error.response?.data?.message || "Failed to reschedule session";
      throw new Error(errorMessage);
    }
  }
};

export default sessionService;
