export interface Association {
  id: string;
  name: string;
  description?: string;
  email: string;
  phone?: string;
  address?: string;
  website?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
