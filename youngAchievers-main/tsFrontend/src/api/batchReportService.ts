import api from "@/api/axios";

export interface BatchReportSummary {
  id: number;
  name: string;
  program_name: string;
  venue_name: string;
  venue_spot_name: string;
  status: string;
  session_count: number;
  completed_sessions: number;
  completion_rate: number;
  start_date: string;
  end_date: string;
  student_count: number;
  occupancy_rate: number;
  upcoming_sessions: number;
}

export interface BatchDetailedReport extends BatchReportSummary {
  batch_id: number;
  batch_name: string;
  capacity: number;
  cancelled_sessions: number;
  currency: string;
  amount: number;
  partners: Array<{
    id: number;
    name: string;
    specialization: string;
  }>;
  next_session?: {
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    status: string;
  };
}

const batchReportService = {
  async getBatchReport(batchId: number): Promise<BatchDetailedReport> {
    try {
      const response = await api.get(`/admin/batches/${batchId}/report`);
      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching batch report:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch batch report");
    }
  },
  
  async getBatchesSummary(): Promise<BatchReportSummary[]> {
    try {
      const response = await api.get('/admin/batches-summary');
      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching batches summary:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch batches summary");
    }
  }
};

export default batchReportService;
