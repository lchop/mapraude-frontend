import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log('🔧 Interceptor called for URL:', request.url);
    console.log('🔧 Request method:', request.method);

    // Get the auth token
    const token = this.authService.getToken();

    console.log('🔧 Interceptor - Token:', token ? 'présent' : 'absent');

    // Clone the request and add the authorization header if token exists
    if (token) {
      const authRequest = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('🔧 Interceptor - Authorization header added:', authRequest.headers.get('Authorization'));
      console.log('🔧 Interceptor - All headers:', authRequest.headers.keys());

      return next.handle(authRequest).pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('🔧 Interceptor - Erreur HTTP:', error.status, error.message);
          console.error('🔧 Interceptor - Error details:', error);

          // If we get a 401 Unauthorized, logout the user
          if (error.status === 401) {
            console.log('🔧 Interceptor - 401 détecté, déconnexion');
            this.authService.logout();
            this.router.navigate(['/login']);
          }
          return throwError(() => error);
        })
      );
    }

    console.log('🔧 Interceptor - Pas de token, requête sans header');

    // If no token, proceed with original request
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('🔧 Interceptor - Erreur HTTP (sans auth):', error.status, error.message);
        return throwError(() => error);
      })
    );
  }
}
