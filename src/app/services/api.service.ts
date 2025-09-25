import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Association } from '../models/association.model';
import { MaraudeAction, DayOfWeek } from '../models/maraude.model';
import { Merchant } from '../models/merchant.model.';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = '/api';

  constructor(private http: HttpClient) {}

  // Method to create auth headers (same pattern as ReportService)
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('maraude_token');
    console.log('🔐 Token récupéré:', token ? 'présent' : 'absent');

    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    }

    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  // Associations (public, no auth needed)
  getAssociations(): Observable<{associations: Association[], pagination: any}> {
    return this.http.get<{associations: Association[], pagination: any}>(`${this.baseUrl}/associations`);
  }

  // Maraudes - UPDATED with manual headers
  getMaraudes(params?: any): Observable<{actions: MaraudeAction[], pagination: any}> {
    let url = `${this.baseUrl}/maraudes`;
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<{actions: MaraudeAction[], pagination: any}>(url, {
      params: httpParams,
      headers: this.getAuthHeaders()
    });
  }

  // Get specific maraude by ID
  getMaraude(id: string): Observable<{ action: MaraudeAction }> {
    return this.http.get<{ action: MaraudeAction }>(`${this.baseUrl}/maraudes/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  createMaraude(maraudeData: {
    title: string;
    description?: string;
    startLatitude: number;
    startLongitude: number;
    startAddress?: string;
    waypoints?: any[];
    estimatedDistance?: number;
    estimatedDuration?: number;
    routePolyline?: string;
    isRecurring: boolean;
    dayOfWeek?: number | null;
    scheduledDate?: string | null;
    startTime: string;
    endTime?: string;
    participantsCount?: number;
    notes?: string;
    // Backward compatibility
    latitude?: number;
    longitude?: number;
    address?: string;
  }): Observable<{ message: string; action: MaraudeAction }> {
    const token = localStorage.getItem('maraude_token');
    console.log('🔐 Création maraude avec waypoints - Token présent:', !!token);
    console.log('📊 Données maraude envoyées:', maraudeData);
    console.log('🎯 Waypoints dans les données:', maraudeData.waypoints);

    if (!token) {
      return throwError(() => new Error('Token d\'authentification manquant'));
    }

    return this.http.post<{ message: string; action: MaraudeAction }>(
      `${this.baseUrl}/maraudes`,
      maraudeData,
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(response => {
        console.log('📦 Réponse création maraude:', response);
        console.log('🎯 Waypoints dans la réponse:', response?.action?.waypoints);
      }),
      catchError(error => {
        console.error('❌ Erreur création maraude:', error);
        return throwError(() => error);
      })
    );
  }

  // FIXED: updateMaraude method with proper logging and error handling
  updateMaraude(id: string, maraudeData: {
    title?: string;
    description?: string;
    startLatitude?: number;
    startLongitude?: number;
    startAddress?: string;
    waypoints?: any[];
    estimatedDistance?: number;
    estimatedDuration?: number;
    routePolyline?: string;
    isRecurring?: boolean;
    dayOfWeek?: number | null;
    scheduledDate?: string | null;
    startTime?: string;
    endTime?: string;
    status?: string;
    participantsCount?: number;
    beneficiariesHelped?: number;
    materialsDistributed?: any;
    notes?: string;
    isActive?: boolean;
    // Backward compatibility
    latitude?: number;
    longitude?: number;
    address?: string;
  }): Observable<{ message: string; action: MaraudeAction }> {

    console.log('🔄 API Service - Updating maraude ID:', id);
    console.log('📤 API Service - Update payload:', maraudeData);
    console.log('🎯 API Service - Waypoints in update payload:', maraudeData.waypoints);
    console.log('📊 API Service - Waypoints count:', maraudeData.waypoints?.length || 0);

    return this.http.put<{ message: string; action: MaraudeAction }>(
      `${this.baseUrl}/maraudes/${id}`,
      maraudeData,
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(response => {
        console.log('✅ API Service - Update successful:', response);
        console.log('🎯 API Service - Updated waypoints in response:', response?.action?.waypoints);
        console.log('📊 API Service - Updated waypoints count:', response?.action?.waypoints?.length || 0);
      }),
      catchError(error => {
        console.error('❌ API Service - Update error:', error);
        console.error('📤 API Service - Failed payload was:', maraudeData);
        return throwError(() => error);
      })
    );
  }

  // Delete a maraude - UPDATED with manual headers
  deleteMaraude(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/maraudes/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Toggle active status of a maraude - UPDATED with manual headers
  toggleMaraudeActive(id: string): Observable<{ message: string; action: MaraudeAction }> {
    return this.http.patch<{ message: string; action: MaraudeAction }>(
      `${this.baseUrl}/maraudes/${id}/toggle`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  // Get today's active maraudes (public, no auth needed)
  getTodayActiveMaraudes(): Observable<{
    actions: MaraudeAction[],
    count: number,
    date: string,
    currentDayOfWeek: number,
    currentDayName: string
  }> {
    return this.http.get<{
      actions: MaraudeAction[],
      count: number,
      date: string,
      currentDayOfWeek: number,
      currentDayName: string
    }>(`${this.baseUrl}/maraudes/today/active`);
  }

  // Get weekly schedule (public, no auth needed)
  getWeeklySchedule(): Observable<{
    weeklySchedule: {[key: number]: MaraudeAction[]},
    days: DayOfWeek[]
  }> {
    return this.http.get<{
      weeklySchedule: {[key: number]: MaraudeAction[]},
      days: DayOfWeek[]
    }>(`${this.baseUrl}/maraudes/weekly-schedule`);
  }

  // Merchants (public, no auth needed)
  getMerchants(params?: any): Observable<{merchants: Merchant[], pagination: any}> {
    let url = `${this.baseUrl}/merchants`;
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<{merchants: Merchant[], pagination: any}>(url, {
      params: httpParams
    });
  }

  getNearbyMerchants(lat: number, lng: number, radius: number = 5): Observable<{
    merchants: Merchant[],
    location: any,
    radius: number,
    count: number
  }> {
    return this.http.get<{
      merchants: Merchant[],
      location: any,
      radius: number,
      count: number
    }>(`${this.baseUrl}/merchants/nearby/${lat}/${lng}?radius=${radius}`);
  }

  getDashboardStats(): Observable<any> {
  return this.http.get<any>(`${this.baseUrl}/reports/dashboard/stats`, {
    headers: this.getAuthHeaders() // ← Ajouter les headers d'auth
  }).pipe(
    tap(response => {
      console.log('📊 Dashboard stats loaded:', response);
    }),
    catchError(error => {
      console.error('❌ Dashboard stats error:', error);
      return throwError(() => error);
    })
  );
  }
}
