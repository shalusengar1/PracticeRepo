
export interface Member {
  id: number;
  name: string;
  email: string;
  mobile: string;
  status: string;
  excused_until: string | null;
  excuse_reason: string | null;
  batches: BatchSummary[];
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  created_by?: number | null;
  updated_by?: number | null;
}

export interface BatchSummary {
  id: number;
  name: string;
  program: {
    id: number;
    name: string;
  };
}

export interface MemberFormData {
  name: string;
  email: string;
  mobile: string;
  password?: string;
  status: 'active' | 'inactive' | 'pending' | 'blacklisted';
  batch_ids?: number[];
}

export interface MemberUI {
  id: number;
  name: string;
  email: string;
  mobile: string;
  enrolledPrograms: string[];
  enrolledBatches: BatchUI[];
  attendance: {
    [program: string]: {
      date: string;
      status: string;
    }[];
  };
}

export interface BatchUI {
  id: number;
  name: string;
  programId?: number;
  programName?: string;
}

export interface ProgramUI {
  id: number;
  name: string;
  batches: BatchUI[];
}
