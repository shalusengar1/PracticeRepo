export type AttendanceStatus = 'present' | 'absent' | 'not marked';

export type PersonStatus = 'active' | 'inactive' | 'pending' | 'blacklisted';

export interface AttendanceRecord {
  id: number;
  status: AttendanceStatus;
  member?: {
    id: number;
    name: string;
    email: string;
    excused_until?: string | null;
    excuse_reason?: string | null;
  };
  partner?: {
    id: number;
    name: string;
    email: string;
    excused_until?: string | null;
    excuse_reason?: string | null;
  };
  marked_at: string | null;
  notes?: string;
  batch_session?: {
    id: number;
    date: string;
    batch: {
      id: number;
      name: string;
    };
  };
}

export interface AttendanceMarkingPayload {
  type: 'member' | 'partner';
  person_id: number;
  batch_id: number;
  date: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface ExcusePayload {
  person_id: number;
  type: 'member' | 'partner';
  excuse_reason: string;
  excused_until: string;
} 