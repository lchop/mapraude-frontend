import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import {
  Association,
  AssociationCreateUpdate,
  AssociationStats,
  AssociationsResponse,
  AssociationDetailResponse
} from '../models/association.model';
import { MaraudeAction, DayOfWeek } from '../models/maraude.model';
import { Merchant } from '../models/merchant.model.';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = '/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  // ==========================================
  // ASSOCIATIONS
  // ==========================================

  /**
   * Récupérer toutes les associations (avec pagination et filtres)
   */
  getAssociations(params?: {
    page?: number;
    limit?: number;
    active?: 'true' | 'false' | 'all';
    search?: string;
  }): Observable<AssociationsResponse> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.active) httpParams = httpParams.set('active', params.active);
      if (params.search) httpParams = httpParams.set('search', params.search);
    }

    return this.http.get<AssociationsResponse>(`${this.baseUrl}/associations`, {
      params: httpParams
    }).pipe(
      tap(response => {
        console.log('📋 Associations loaded:', response);
      }),
      catchError(error => {
        console.error('❌ Error loading associations:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupérer une association par ID
   */
  getAssociationById(id: string): Observable<AssociationDetailResponse> {
    return this.http.get<AssociationDetailResponse>(`${this.baseUrl}/associations/${id}`).pipe(
      tap(response => {
        console.log('🏢 Association detail loaded:', response);
      }),
      catchError(error => {
        console.error('❌ Error loading association:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Créer une nouvelle association
   */
  createAssociation(data: AssociationCreateUpdate): Observable<{
    message: string;
    association: Association
  }> {
    console.log('➕ Creating association:', data);

    return this.http.post<{ message: string; association: Association }>(
      `${this.baseUrl}/associations`,
      data
    ).pipe(
      tap(response => {
        console.log('✅ Association created:', response);
      }),
      catchError(error => {
        console.error('❌ Error creating association:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Mettre à jour une association
   */
  updateAssociation(id: string, data: Partial<AssociationCreateUpdate>): Observable<{
    message: string;
    association: Association
  }> {
    console.log('🔄 Updating association:', id, data);

    return this.http.put<{ message: string; association: Association }>(
      `${this.baseUrl}/associations/${id}`,
      data
    ).pipe(
      tap(response => {
        console.log('✅ Association updated:', response);
      }),
      catchError(error => {
        console.error('❌ Error updating association:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Supprimer une association
   */
  deleteAssociation(id: string): Observable<{ message: string }> {
    console.log('🗑️ Deleting association:', id);

    return this.http.delete<{ message: string }>(`${this.baseUrl}/associations/${id}`).pipe(
      tap(response => {
        console.log('✅ Association deleted:', response);
      }),
      catchError(error => {
        console.error('❌ Error deleting association:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupérer les statistiques d'une association
   */
  getAssociationStats(id: string): Observable<{ stats: AssociationStats }> {
    return this.http.get<{ stats: AssociationStats }>(
      `${this.baseUrl}/associations/${id}/stats`
    ).pipe(
      tap(response => {
        console.log('📊 Association stats loaded:', response);
      }),
      catchError(error => {
        console.error('❌ Error loading association stats:', error);
        return throwError(() => error);
      })
    );
  }

  // ==========================================
  // MARAUDES
  // ==========================================

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

  // ==========================================
  // MARAUDES - Public endpoints
  // ==========================================

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

  // ==========================================
  // MERCHANTS
  // ==========================================

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

  // ==========================================
  // DASHBOARD / REPORTS
  // ==========================================

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
