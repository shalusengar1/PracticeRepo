export interface Amenity {
    id: number;
    name: string;
    icon: string | null;
    category: 'basic' | 'comfort' | 'additional';
    enabled: boolean;
  }
  