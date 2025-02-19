import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, map, catchError, switchMap } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { User, AuthenticationResponse } from '../models/auth.models';
import { TokenStorageService } from './TokenStorageService';


@Injectable({
    providedIn: 'root'
  })
  export class AuthService {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    private readonly API_URL = environment.apiUrl;
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    // eslint-disable-next-line @typescript-eslint/member-ordering
    currentUser$ = this.currentUserSubject.asObservable();

    constructor(
      private http: HttpClient,
      private tokenStorage: TokenStorageService
    ) {
      const token = this.tokenStorage.getToken();
      if (token) {
        const userData = this.tokenStorage.getUserData();
        if (userData) {
          try {
            this.currentUserSubject.next(userData);
          } catch (e) {
            console.error('Error parsing stored user data:', e);
            this.logout();
          }
        } else {
          this.fetchCurrentUser().subscribe({
            error: (err) => {
              console.error('Error fetching current user:', err);
              if (err.status === 401) {
                this.logout();
              }
            }
          });
        }
      }
    }

    fetchCurrentUser(): Observable<User> {
      const token = this.tokenStorage.getToken();

      return this.http.get<User>(`${this.API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      }).pipe(
        tap((user) => {
          this.tokenStorage.setUserData(user);
          this.currentUserSubject.next(user);
        }),
        catchError((error) => {
          console.error('Error fetching user data:', error);
          return of(null as any);
        })
      );
    }
    register(userData: any): Observable<AuthenticationResponse> {
        return this.http.post<AuthenticationResponse>(`${this.API_URL}/auth/register`, userData)
          .pipe(
            switchMap((response) => {
              if (response && response.token) {
                this.tokenStorage.setToken(response.token);

                return this.fetchCurrentUser().pipe(
                  map((user) => {
                    if (user && user.role) {
                      this.tokenStorage.setUserRole(user.role);
                    }
                    return response;
                  }),
                  catchError(() =>
                    // Even if fetching user fails, return the auth response
                     of(response)
                  )
                );
              }
              return of(response);
            })
          );
      }
    login(credentials: { email: string; password: string }): Observable<AuthenticationResponse> {
      return this.http.post<AuthenticationResponse>(`${this.API_URL}/auth/login`, credentials)
        .pipe(
          switchMap((response) => {
            if (response && response.token) {
              this.tokenStorage.setToken(response.token);

              return this.fetchCurrentUser().pipe(
                map((user) => {
                  if (user && user.role) {
                    this.tokenStorage.setUserRole(user.role);
                  }
                  return response;
                }),
                catchError((error) => {
                  console.error('Error in fetchCurrentUser after login:', error);
                  return of(response);
                })
              );
            }
            return of(response);
          }),
          catchError((error) => {
            console.error('Login error:', error);
            throw error;
          })
        );
    }

    refreshToken(): Observable<AuthenticationResponse> {
      const refreshToken = this.tokenStorage.getRefreshToken();
      if (!refreshToken) {
        return of(null as any);
      }

      return this.http.post<AuthenticationResponse>(`${this.API_URL}/auth/refresh`, { refreshToken })
        .pipe(
          tap((response) => {
            if (response && response.token) {
              this.tokenStorage.setToken(response.token);
              if (response.refreshToken) {
                this.tokenStorage.setRefreshToken(response.refreshToken);
              }
            }
          }),
          catchError((error) => {
            console.error('Token refresh error:', error);
            if (error.status === 401) {
              this.logout();
            }
            throw error;
          })
        );
    }

    logout(): void {
      this.tokenStorage.clear();
      this.currentUserSubject.next(null);
    }

    isLoggedIn(): boolean {
      return !!this.tokenStorage.getToken();
    }

    isAdmin(): boolean {
      const userRole = this.tokenStorage.getUserRole();
      return userRole === 'ROLE_ADMIN' || userRole === 'ADMIN';
    }

    getToken(): string | null {
      return this.tokenStorage.getToken();
    }

    getCurrentUser(): User | null {
      return this.currentUserSubject.value;
    }
  }
