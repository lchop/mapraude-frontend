// report.service.ts - VERSION COMPLÈTEMENT CORRIGÉE
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DistributionType, MaraudeReport } from '../models/report.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private baseUrl = '/api/reports';

  constructor(private http: HttpClient) {}

  // ✅ Méthode pour créer les headers avec token
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

  // Distribution types (pas besoin d'auth)
  getDistributionTypes(): Observable<{ types: DistributionType[], grouped: any, categories: any }> {
    return this.http.get<any>(`${this.baseUrl}/distribution-types`);
  }

  // Reports CRUD avec authentification
  getReports(params?: any): Observable<{ reports: MaraudeReport[], pagination: any }> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<any>(this.baseUrl, {
      params: httpParams,
      headers: this.getAuthHeaders()
    });
  }

  getReport(id: string): Observable<{ report: MaraudeReport }> {
    return this.http.get<{ report: MaraudeReport }>(`${this.baseUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // ✅ MÉTHODE PRINCIPALE CORRIGÉE
  createReport(reportData: MaraudeReport): Observable<{ message: string; report: MaraudeReport }> {
    const token = localStorage.getItem('maraude_token');
    console.log('🔐 Création rapport - Token présent:', !!token);
    console.log('📊 Données envoyées:', reportData);

    if (!token) {
      throw new Error('Token d\'authentification manquant');
    }

    return this.http.post<{ message: string; report: MaraudeReport }>(
      this.baseUrl,
      reportData,
      { headers: this.getAuthHeaders() }
    );
  }

  updateReport(id: string, reportData: Partial<MaraudeReport>): Observable<{ message: string; report: MaraudeReport }> {
    return this.http.put<{ message: string; report: MaraudeReport }>(`${this.baseUrl}/${id}`, reportData, {
      headers: this.getAuthHeaders()
    });
  }

  deleteReport(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Report workflow
  submitReport(id: string): Observable<{ message: string; report: MaraudeReport }> {
    return this.http.patch<{ message: string; report: MaraudeReport }>(`${this.baseUrl}/${id}/submit`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  validateReport(id: string): Observable<{ message: string; report: MaraudeReport }> {
    return this.http.patch<{ message: string; report: MaraudeReport }>(`${this.baseUrl}/${id}/validate`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  // Email et stats
  sendReportEmail(id: string, emailData: { recipients: string[], subject?: string, message?: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/${id}/send-email`, emailData, {
      headers: this.getAuthHeaders()
    });
  }

  getReportStats(params?: any): Observable<{ stats: any }> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<{ stats: any }>(`${this.baseUrl}/stats/summary`, {
      params: httpParams,
      headers: this.getAuthHeaders()
    });
  }

  checkDuplicateReport(maraudeActionId: string, reportDate: string): Observable<{exists: boolean, report?: any, message?: string}> {
  const params = new HttpParams()
    .set('maraudeActionId', maraudeActionId)
    .set('reportDate', reportDate);

  return this.http.get<{exists: boolean, report?: any, message?: string}>(`${this.baseUrl}/check-duplicate`, {
    params,
    headers: this.getAuthHeaders()
  });




}
}
