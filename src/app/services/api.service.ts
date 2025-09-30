import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Association } from '../models/association.model';
import { MaraudeAction, DayOfWeek } from '../models/maraude.model';
import { Merchant } from '../models/merchant.model.';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = '/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Associations (public, no auth needed - interceptor will handle)
  getAssociations(): Observable<{associations: Association[], pagination: any}> {
    return this.http.get<{associations: Association[], pagination: any}>(`${this.baseUrl}/associations`);
  }

  // Maraudes - let interceptor handle auth
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
      params: httpParams
    });
  }

  getMaraude(id: string): Observable<{ action: MaraudeAction }> {
    return this.http.get<{ action: MaraudeAction }>(`${this.baseUrl}/maraudes/${id}`);
  }

  createMaraude(maraudeData: any): Observable<{ message: string; action: MaraudeAction }> {
    console.log('🔐 Création maraude avec waypoints');
    console.log('📊 Données maraude envoyées:', maraudeData);

    return this.http.post<{ message: string; action: MaraudeAction }>(
      `${this.baseUrl}/maraudes`,
      maraudeData
    ).pipe(
      tap(response => {
        console.log('📦 Réponse création maraude:', response);
      }),
      catchError(error => {
        console.error('❌ Erreur création maraude:', error);
        return throwError(() => error);
      })
    );
  }

  updateMaraude(id: string, maraudeData: any): Observable<{ message: string; action: MaraudeAction }> {
    console.log('🔄 API Service - Updating maraude ID:', id);

    return this.http.put<{ message: string; action: MaraudeAction }>(
      `${this.baseUrl}/maraudes/${id}`,
      maraudeData
    ).pipe(
      tap(response => {
        console.log('✅ API Service - Update successful:', response);
      }),
      catchError(error => {
        console.error('❌ API Service - Update error:', error);
        return throwError(() => error);
      })
    );
  }

  deleteMaraude(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/maraudes/${id}`);
  }

  toggleMaraudeActive(id: string): Observable<{ message: string; action: MaraudeAction }> {
    return this.http.patch<{ message: string; action: MaraudeAction }>(
      `${this.baseUrl}/maraudes/${id}/toggle`,
      {}
    );
  }

  // Public endpoints (no auth needed)
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

  getWeeklySchedule(): Observable<{
    weeklySchedule: {[key: number]: MaraudeAction[]},
    days: DayOfWeek[]
  }> {
    return this.http.get<{
      weeklySchedule: {[key: number]: MaraudeAction[]},
      days: DayOfWeek[]
    }>(`${this.baseUrl}/maraudes/weekly-schedule`);
  }

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
    return this.http.get<any>(`${this.baseUrl}/reports/dashboard/stats`).pipe(
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
