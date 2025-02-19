import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpClient
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { TokenStorageService } from '../services/TokenStorageService';
import { AuthenticationResponse } from '../models/auth.models';


@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private tokenStorage: TokenStorageService,
    private http: HttpClient
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.isAuthEndpoint(request.url)) {
      return next.handle(request);
    }

    const token = this.tokenStorage.getToken();
    if (token) {
      request = this.addToken(request, token);
    }

    return next.handle(request).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.handle401Error(request, next);
        }
        return throwError(() => error);
      })
    );
  }

  private isAuthEndpoint(url: string): boolean {
    return url.includes('/auth/login') ||
           url.includes('/auth/register') ||
           url.includes('/auth/refresh');
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.refreshToken().pipe(
        switchMap((response) => {
          this.isRefreshing = false;
          if (response && response.token) {
            this.refreshTokenSubject.next(response.token);
            return next.handle(this.addToken(request, response.token));
          }
          this.handleRefreshFailure();
          return throwError(() => new Error('Session expired'));
        }),
        catchError((error) => {
          this.isRefreshing = false;
          this.handleRefreshFailure();
          return throwError(() => error);
        })
      );
    }

    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => next.handle(this.addToken(request, token)))
    );
  }

  private refreshToken(): Observable<AuthenticationResponse> {
    const refreshToken = this.tokenStorage.getRefreshToken();
    if (!refreshToken) {
      this.handleRefreshFailure();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<AuthenticationResponse>(
      `${environment.apiUrl}/auth/refresh`,
      { refreshToken }
    );
  }

  private handleRefreshFailure(): void {
    this.tokenStorage.clear();
    window.location.reload();
  }
}
