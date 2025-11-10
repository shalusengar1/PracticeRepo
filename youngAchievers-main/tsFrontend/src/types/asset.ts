export interface FixedAsset {
    id: string;
    type: string;
    name: string;
    quantity: number;
    inUse: number;
    condition: 'excellent' | 'good' | 'fair' | 'poor';
    location: string;
    venue_id?: number;
    lastServiceDate?: string;
  }
  