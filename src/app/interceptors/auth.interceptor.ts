import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, BehaviorSubject, Observable, filter, take } from 'rxjs';

// Create a ref for the refresh token state
let isRefreshing = false;
let refreshTokenSubject = new BehaviorSubject<any>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Skip refresh token requests to avoid infinite loops
  if (req.url.includes('/auth/refresh')) {
    return next(req);
  }

  // Get the auth token
  const token = authService.getToken();

  // Add token to request if it exists
  let authReq = req;
  if (token) {
    authReq = addTokenHeader(req, token);
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && token) {
        return handle401Error(authReq, next, authService, router);
      }
      return throwError(() => error);
    })
  );
};

function addTokenHeader(request: any, token: string): any {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
}

function handle401Error(
  request: any,
  next: any,
  authService: AuthService,
  router: Router
): Observable<any> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((response: any) => {
        isRefreshing = false;
        const newToken = response.token || response.access_token;
        if (newToken) {
          // Update the token in auth service
          authService.updateToken(newToken);
          refreshTokenSubject.next(newToken);
          return next(addTokenHeader(request, newToken));
        }
        // If no new token, logout
        authService.logout();
        router.navigate(['/login']);
        return throwError(() => new Error('Refresh token failed'));
      }),
      catchError((err) => {
        isRefreshing = false;
        authService.logout();
        router.navigate(['/login']);
        return throwError(() => err);
      })
    );
  }

  return refreshTokenSubject.pipe(
    filter(token => token !== null),
    take(1),
    switchMap(token => next(addTokenHeader(request, token)))
  );
}
