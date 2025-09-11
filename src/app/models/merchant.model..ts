export interface Merchant {
  id: string;
  name: string;
  description?: string;
  category: 'restaurant' | 'cafe' | 'bakery' | 'pharmacy' | 'clothing_store' | 'supermarket' | 'laundromat' | 'health_center' | 'other';
  services: string[];
  latitude: number;
  longitude: number;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  openingHours?: { [key: string]: string };
  specialInstructions?: string;
  isVerified: boolean;
  isActive: boolean;
  contactPerson?: string;
  addedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
