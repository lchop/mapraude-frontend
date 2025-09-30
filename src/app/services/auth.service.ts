import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { User, LoginRequest, LoginResponse, RegisterRequest } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = '/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenKey = 'maraude_token';

  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadStoredUser();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, credentials).pipe(
      tap(response => {
        this.setCurrentUser(response.user, response.token);
      })
    );
  }

  register(userData: RegisterRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/register`, userData).pipe(
      tap(response => {
        this.setCurrentUser(response.user, response.token);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('maraude_user');
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    const token = localStorage.getItem('maraude_token');
    console.log('🔐 Token from localStorage:', token);
    console.log('📏 Token length:', token?.length);
    console.log('🔍 Token starts with:', token?.substring(0, 20) + '...');
    return token;
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  isCoordinatorOrAdmin(): boolean {
    const user = this.getCurrentUser();
    return user ? ['coordinator', 'admin'].includes(user.role) : false;
  }

  setCurrentUser(user: User, token: string): void {
    console.log('💾 Storing token:', token);
    console.log('📏 Token length:', token.length);

    // Nettoyez le token si nécessaire
    const cleanToken = token.trim();
    localStorage.setItem(this.tokenKey, cleanToken);
    localStorage.setItem('maraude_user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  // NEW METHOD: Update only the token (for refresh functionality)
  updateToken(newToken: string): void {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      localStorage.setItem(this.tokenKey, newToken);
      // Keep the same user object, just update the token
      this.currentUserSubject.next(currentUser);
    }
  }

  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('maraude_refresh_token');
    console.log('🔄 Attempting token refresh');

    return this.http.post<any>(`${this.baseUrl}/auth/refresh`, {
      refreshToken
    }).pipe(
      tap(response => {
        console.log('✅ Token refreshed successfully');
        this.setCurrentUser(response.user, response.token);
      }),
      catchError(error => {
        console.error('❌ Token refresh failed:', error);
        this.logout();
        return throwError(() => error);
      })
    );
  }

  private loadStoredUser(): void {
    const token = this.getToken();
    const storedUser = localStorage.getItem('maraude_user');

    if (token && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        this.logout();
      }
    }
  }
}
