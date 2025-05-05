import { Router } from '@angular/router';
import { AuthService } from './../../services/auth.service';
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take, finalize } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AuthenticationResponse } from '../../models/models';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(private authService: AuthService, private router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (this.isPublicEndpoint(request.url)) {
      return next.handle(request);
    }

    const token = this.authService.getToken();

    console.log('[AuthInterceptor] Token intercepted:', token || '⛔ No token found');

    if (token) {
      request = this.addToken(request, token);
    } else {
      console.warn('[AuthInterceptor] Protected endpoint accessed without token');
    }

    return next.handle(request).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse) {
          if (error.status === 401) {
            return this.handle401Error(request, next);
          } else if (error.status === 403) {
            console.error('[AuthInterceptor] Access forbidden (403):', request.url);
            // Optional redirect to a permissions error page
            // this.router.navigate(['/forbidden']);
          }
        }
        return throwError(() => error);
      })
    );
  }

  private addToken(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private isPublicEndpoint(url: string): boolean {
    const publicEndpoints = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/refresh-token',
      '/api/auth/refresh'
    ];

    // If URL is absolute (starts with http), remove the apiUrl
    if (url.startsWith(environment.apiUrl)) {
      url = url.substring(environment.apiUrl.length);
    }

    // Check if URL corresponds to a public endpoint
    return publicEndpoints.some(endpoint => url.includes(endpoint));
  }

  private handle401Error(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((response: AuthenticationResponse) => {
          this.isRefreshing = false;

          if (response && response.token) {
            this.refreshTokenSubject.next(response.token);
            return next.handle(this.addToken(request, response.token));
          } else {
            console.error('[AuthInterceptor] Token refresh succeeded but no token returned');
            this.authService.logout();
            this.router.navigate(['/login']);
            return throwError(() => new Error('Token refresh failed'));
          }
        }),
        catchError(error => {
          console.error('[AuthInterceptor] Error refreshing token:', error);
          this.isRefreshing = false;
          this.authService.logout();
          this.router.navigate(['/login']);
          return throwError(() => error);
        }),
        finalize(() => {
          this.isRefreshing = false;
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter((token): token is string => token !== null),
        take(1),
        switchMap(token => next.handle(this.addToken(request, token)))
      );
    }
  }
}