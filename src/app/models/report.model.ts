export interface DistributionType {
  id: string;
  name: string;
  category: 'meal' | 'hygiene' | 'clothing' | 'medical' | 'other';
  icon?: string;
  color?: string;
  isActive: boolean;
}

export interface Distribution {
  distributionTypeId: string;
  quantity: number;
  notes?: string;
}

export interface Alert {
  alertType: 'medical' | 'social' | 'security' | 'housing' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  locationLatitude?: number;
  locationLongitude?: number;
  locationAddress?: string;
  personDescription?: string;
  situationDescription: string;
  actionTaken?: string;
  followUpRequired: boolean;
  followUpNotes?: string;
}

export interface MaraudeReport {
  id?: string;
  maraudeActionId: string;
  reportDate: string;
  startTime: string;
  endTime: string;
  beneficiariesCount: number;
  volunteersCount: number;
  generalNotes?: string;
  difficultiesEncountered?: string;
  positivePoints?: string;
  urgentSituationsDetails?: string;
  distributions?: Distribution[];
  alerts?: Alert[];
  status?: 'draft' | 'submitted' | 'validated';
  hasUrgentSituations?: boolean;
}
