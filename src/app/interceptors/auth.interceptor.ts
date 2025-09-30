import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, throwError, switchMap, filter, take, BehaviorSubject, Observable } from 'rxjs';

// State pour la gestion du refresh token
let isRefreshing = false;
let refreshTokenSubject = new BehaviorSubject<string | null>(null);

// Fonction utilitaire pour ajouter le token
const addTokenHeader = (req: HttpRequest<unknown>, token: string): HttpRequest<unknown> => {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

// Fonction pour gérer l'erreur 401
const handle401Error = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router
): Observable<any> => {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((response: any) => {
        isRefreshing = false;
        const newToken = response.token;
        refreshTokenSubject.next(newToken);

        // Clone la requête avec le nouveau token
        const newReq = addTokenHeader(req, newToken);
        return next(newReq);
      }),
      catchError((error) => {
        isRefreshing = false;
        authService.logout();
        router.navigate(['/login']);
        return throwError(() => error);
      })
    );
  } else {
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => {
        const newReq = addTokenHeader(req, token!);
        return next(newReq);
      })
    );
  }
};

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Skip les requêtes de refresh token
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
