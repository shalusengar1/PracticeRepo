export interface Session {
  id: string;
  batch_id: string;
  title?: string;
  date: string;
  start_time: string;
  end_time: string;
  description?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  sessionNumber?: number;
  created_at?: string;
  updated_at?: string;
  notes?: string; // For reschedule reasons and other session notes
  
  // Venue and spot information
  venue?: {
    venue_id: number;
    venue_name: string;
    venue_image?: string;
  };
  spot?: {
    venue_spot_id: number;
    spot_name: string;
    spot_image?: string;
  };
  
  // Frontend calculated properties
  day?: string;
}
