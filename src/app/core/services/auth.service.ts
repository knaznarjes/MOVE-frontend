/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/member-ordering */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

import { Router } from '@angular/router';
import { environment } from 'environments/environment';
import { AuthRequest, AuthResponse, RefreshTokenRequest, RegisterRequest, User } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private userRoleSubject = new BehaviorSubject<string>('');
  public userRole$ = this.userRoleSubject.asObservable();
  private refreshTokenTimeout: any;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const role = localStorage.getItem('userRole');

    if (token && user) {
      const userData = JSON.parse(user);
      this.currentUserSubject.next(userData);

      // Charger le rôle depuis localStorage ou depuis l'objet user, en privilégiant l'objet user
      const userRole = userData.role || role || '';
      this.userRoleSubject.next(userRole);

      // S'assurer que le rôle est synchronisé dans le localStorage
      if (userRole) {
        localStorage.setItem('userRole', userRole);
      }

      this.startRefreshTokenTimer();
    }
  }

  register(request: RegisterRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/register`, request)
      .pipe(
        catchError(this.handleError)
      );
  }

  login(request: AuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request)
      .pipe(
        tap(response => this.setSession(response)),
        catchError(this.handleError)
      );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const request: RefreshTokenRequest = { refreshToken };
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, request)
      .pipe(
        tap(response => this.setSession(response)),
        catchError((error) => {
          this.logout();
          return throwError(() => error);
        })
      );
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`)
      .pipe(
        tap((user) => {
          // Mettre à jour l'utilisateur actuel avec toutes ses données
          this.currentUserSubject.next(user);
          localStorage.setItem('user', JSON.stringify(user));

          // Mettre à jour le rôle si présent
          if (user && user.role) {
            this.userRoleSubject.next(user.role);
            localStorage.setItem('userRole', user.role);
          }

          // Stocker l'ID utilisateur s'il existe
          if (user && user.id) {
            localStorage.setItem('userId', user.id);
          }
        }),
        catchError(this.handleError)
      );
  }
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('expiresAt');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    this.currentUserSubject.next(null);
    this.userRoleSubject.next('');
    this.stopRefreshTokenTimer();
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    const expiresAt = localStorage.getItem('expiresAt');
    return !!expiresAt && Date.now() < parseInt(expiresAt, 10);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUserRole(): string {
    return this.userRoleSubject.value;
  }

  updateUserRole(role: string): void {
    if (role) {
      this.userRoleSubject.next(role);
      localStorage.setItem('userRole', role);

      // Mettre également à jour l'objet utilisateur si disponible
      const currentUser = this.currentUserSubject.value;
      if (currentUser) {
        currentUser.role = role;
        this.currentUserSubject.next({...currentUser});
        localStorage.setItem('user', JSON.stringify(currentUser));
      }
    }
  }

  isAdmin(): boolean {
    const role = this.getUserRole();
    return role?.toUpperCase() === 'ADMIN' || role?.toUpperCase() === 'MASTERADMIN';
  }
  isMasterAdmin(): boolean {
    const role = this.getUserRole();
    return role?.toUpperCase() === 'MASTERADMIN';
  }
  private setSession(authResponse: AuthResponse): void {
    localStorage.setItem('token', authResponse.token);
    localStorage.setItem('refreshToken', authResponse.refreshToken);
    localStorage.setItem('expiresAt', authResponse.expiresAt.toString());
    localStorage.setItem('userId', authResponse.userId);

    // Stocker le rôle s'il est présent dans la réponse
    if (authResponse.role) {
      this.userRoleSubject.next(authResponse.role);
      localStorage.setItem('userRole', authResponse.role);
    }

    this.startRefreshTokenTimer();

    // Fetch current user data after successful authentication
    this.getCurrentUser().subscribe();
  }

  private startRefreshTokenTimer(): void {
    this.stopRefreshTokenTimer();

    const expiresAt = localStorage.getItem('expiresAt');
    if (!expiresAt) {return;}

    const expiresAtDate = new Date(parseInt(expiresAt, 10));
    const timeout = expiresAtDate.getTime() - Date.now() - (60 * 1000); // Refresh 1 minute before expiry

    if (timeout > 0) {
      this.refreshTokenTimeout = setTimeout(() => this.refreshToken().subscribe(), timeout);
    } else {
      this.refreshToken().subscribe();
    }
  }

  private stopRefreshTokenTimer(): void {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
