export interface BatchInfo {
  id: number;
  name: string;
  status?: string;
}

export interface Partner {
  id: number;
  name: string;
  email: string;
  mobile: string;
  specialization: string;
  status: string;
  payType: string;
  payAmount?: number;
  payPercentage?: number;
  paymentTerms: string;
  excused_until: string | null;
  excuse_reason: string | null;
  assignedBatches?: BatchInfo[];
} 