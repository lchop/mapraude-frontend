import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Association } from '../models/association.model';
import { MaraudeAction, DayOfWeek } from '../models/maraude.model';
import { Merchant } from '../models/merchant.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // Associations
  getAssociations(): Observable<{associations: Association[], pagination: any}> {
    return this.http.get<{associations: Association[], pagination: any}>(`${this.baseUrl}/associations`);
  }

  // Maraudes - UPDATED METHODS
  getMaraudes(params?: any): Observable<{actions: MaraudeAction[], pagination: any}> {
    let url = `${this.baseUrl}/maraudes`;
    if (params) {
      const queryParams = new URLSearchParams(params).toString();
      url += `?${queryParams}`;
    }
    return this.http.get<{actions: MaraudeAction[], pagination: any}>(url);
  }

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

  // NEW: Get weekly schedule
  getWeeklySchedule(): Observable<{
    weeklySchedule: {[key: number]: MaraudeAction[]},
    days: DayOfWeek[]
  }> {
    return this.http.get<{
      weeklySchedule: {[key: number]: MaraudeAction[]},
      days: DayOfWeek[]
    }>(`${this.baseUrl}/maraudes/weekly-schedule`);
  }

  // Merchants
  getMerchants(params?: any): Observable<{merchants: Merchant[], pagination: any}> {
    let url = `${this.baseUrl}/merchants`;
    if (params) {
      const queryParams = new URLSearchParams(params).toString();
      url += `?${queryParams}`;
    }
    return this.http.get<{merchants: Merchant[], pagination: any}>(url);
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
}
