import { Association } from './association.model';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'volunteer' | 'coordinator';
  phone?: string;
  isActive: boolean;
  associationId: string;
  association?: Association;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  token: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  associationId: string;
  role?: string;
}
