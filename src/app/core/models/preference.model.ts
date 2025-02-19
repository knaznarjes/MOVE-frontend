export interface Preference {
    id: string;
    userId: string;
    category: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
  }
