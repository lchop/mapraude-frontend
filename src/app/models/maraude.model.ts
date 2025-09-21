import { Association } from './association.model';

export interface MaraudeAction {
  id: string;
  title: string;
  description?: string;
  startLatitude?: number;
  startLongitude?: number;
  startAddress?: string;
  waypoints?: Waypoint[];
  estimatedDistance?: number;
  estimatedDuration?: number;
  address?: string;

  // NEW: Weekly recurring fields
  dayOfWeek?: number; // 1=Monday, 2=Tuesday, ..., 7=Sunday
  isRecurring: boolean;
  isActive: boolean;

  // MODIFIED: Optional for recurring maraudes
  scheduledDate?: Date;

  startTime: string;
  endTime?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  participantsCount: number;
  beneficiariesHelped: number;
  materialsDistributed?: { [key: string]: number };
  notes?: string;

  createdBy: string;
  associationId: string;
  association?: Association;
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
  };

  // Computed fields from backend
  nextOccurrence?: string;
  isHappeningToday?: boolean;
  dayName?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface Waypoint {
  id: string;
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
  order: number;
}

// Helper interface for day names
export interface DayOfWeek {
  value: number;
  name: string;
  shortName: string;
}

export const DAYS_OF_WEEK: DayOfWeek[] = [
  { value: 1, name: 'Lundi', shortName: 'Lun' },
  { value: 2, name: 'Mardi', shortName: 'Mar' },
  { value: 3, name: 'Mercredi', shortName: 'Mer' },
  { value: 4, name: 'Jeudi', shortName: 'Jeu' },
  { value: 5, name: 'Vendredi', shortName: 'Ven' },
  { value: 6, name: 'Samedi', shortName: 'Sam' },
  { value: 7, name: 'Dimanche', shortName: 'Dim' }
];
