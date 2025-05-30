/* eslint-disable arrow-parens */
/* eslint-disable curly */
/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable @typescript-eslint/naming-convention */
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import {
  AuthenticationRequest, AuthenticationResponse, RefreshTokenRequest, RegisterRequest,
  Role, User, UserDTO
} from '../models/models';
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private userRoleSubject = new BehaviorSubject<Role | null>(null);
  public userRole$ = this.userRoleSubject.asObservable();
  private refreshTokenTimeout: any;

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromStorage();
  }

  /** Load user from localStorage at app start */
  private loadUserFromStorage(): void {
    const token = this.getToken();
    const user = localStorage.getItem('user');
    const roleStr = localStorage.getItem('userRole');

    if (token && user) {
      try {
        const userData = JSON.parse(user) as User;
        this.currentUserSubject.next(userData);

        const userRole = userData.role || (roleStr as Role) || null;
        this.userRoleSubject.next(userRole);

        if (userRole) {
          localStorage.setItem('userRole', userRole);
        }

        this.startRefreshTokenTimer();
      } catch (error) {
        console.error('[AuthService] Error loading user from storage:', error);
        this.clearStorageAndRedirect();
      }
    }
  }

  /** Register new user */
  register(request: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}${environment.auth.register}`, request, { responseType: 'text' }).pipe(
      tap(res => console.log('[AuthService] Registration successful:', res)),
      catchError(this.handleError)
    );
  }

  /** Login and store session */
  login(request: AuthenticationRequest): Observable<AuthenticationResponse> {
    return this.http.post<AuthenticationResponse>(`${this.apiUrl}${environment.auth.login}`, request).pipe(
      tap(response => {
        if (!response.token || !response.refreshToken || !response.userId) {
          throw new Error('Invalid authentication response');
        }
        this.setSession(response);
      }),
      catchError(error => {
        if (error.status === 401 || error.status === 403) {
          return throwError(() => new Error('Invalid email or password'));
        }
        return this.handleError(error);
      })
    );
  }

  /// Correction de la méthode refreshToken dans AuthService

refreshToken(): Observable<AuthenticationResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const request: RefreshTokenRequest = { refreshToken };

    // Vérifier que l'URL de refresh est bien configurée
    // Adapter cette URL selon votre backend
    return this.http.post<AuthenticationResponse>(`${this.apiUrl}/api/auth/refresh-token`, request).pipe(
      tap(response => {
        if (!response || !response.token) {
          throw new Error('Invalid token refresh response');
        }
        console.log('[AuthService] Token refreshed successfully');
        this.setSession(response);
      }),
      catchError(error => {
        console.error('[AuthService] Token refresh failed:', error);
        // En cas d'échec, déconnecter l'utilisateur
        if (error.status === 401 || error.status === 403) {
          this.logout();
        }
        return throwError(() => error);
      })
    );
  }
  getUserId(): string | null {
  return this.currentUserSubject.value?.id || localStorage.getItem('userId');
}
getUserById(userId: string): Observable<User> {
  return this.http.get<UserDTO>(`${this.apiUrl}/api/users/${userId}`).pipe(
    map(dto => this.mapUserDTO(dto)), // on le convertit vers User (modèle interne)
    catchError(this.handleError)
  );
}

  /** Get user details from backend */
  getCurrentUser(): Observable<User> {
    return this.http.get<UserDTO>(`${this.apiUrl}${environment.auth.me}`).pipe(
      map(userDTO => this.mapUserDTO(userDTO)),
      tap(user => {
        this.currentUserSubject.next(user);
        localStorage.setItem('user', JSON.stringify(user));
        if (user.role) {
          this.userRoleSubject.next(user.role);
          localStorage.setItem('userRole', user.role);
        }
        if (user.id) {
          localStorage.setItem('userId', user.id);
        }
      }),
      catchError(this.handleError)
    );
  }

  /** Map UserDTO to User */
  private mapUserDTO(dto: UserDTO): User {
    return {
      id: dto.id,
      fullName: dto.fullName,
      photoProfile: dto.photoProfile,
      role: dto.role,
      creationDate: dto.creationDate,
      modifiedAt: dto.modifiedAt,
      preferences: dto.preferences || [],
      accountLocked: dto.accountLocked !== undefined ? dto.accountLocked : false,
      enabled: dto.enabled !== undefined ? dto.enabled : true,
      accountId: dto.account?.id
    };
  }

  /** Get email from user (convenience method) */
  getUserEmail(user: User | null): string {
    if (!user) return '';
    // Try to get email from localStorage if we have a cached UserDTO
    const userDTOStr = localStorage.getItem('userDTO');
    if (userDTOStr) {
      try {
        const userDTO = JSON.parse(userDTOStr) as UserDTO;
        if (userDTO.email) return userDTO.email;
        if (userDTO.account?.email) return userDTO.account.email;
      } catch (e) {
        console.error('[AuthService] Error parsing userDTO:', e);
      }
    }

    // If we have accountId, we could fetch account details
    if (user.accountId) {
      // Ideally, implement a method to get account by ID
      // return this.accountService.getAccountById(user.accountId)?.email || '';
    }

    return '';
  }

  /** Clear all session and redirect */
  logout(): void {
    this.clearStorageAndRedirect();
  }

  private clearStorageAndRedirect(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('expiresAt');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userDTO'); // Also clear the userDTO if we store it
    this.currentUserSubject.next(null);
    this.userRoleSubject.next(null);
    this.stopRefreshTokenTimer();
    this.router.navigate(['/login']);
  }

  /** Get token for interceptor */
  getToken(): string | null {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    console.log('[AuthService] getToken:', token ? '✔ token found' : '⛔ no token');
    return token;
  }

  getTokenExpiration(): number | null {
    const exp = localStorage.getItem('expiresAt');
    return exp ? parseInt(exp, 10) : null;
  }

  isLoggedIn(): boolean {
    const expiresAt = this.getTokenExpiration();
    return !!expiresAt && Date.now() < expiresAt;
  }

  /** Role helpers */
  getUserRole(): Role | null {
    return this.userRoleSubject.value;
  }

  isAdmin(): boolean {
    const role = this.getUserRole();
    return role === Role.ADMIN || role === Role.MASTERADMIN;
  }

  isMasterAdmin(): boolean {
    return this.getUserRole() === Role.MASTERADMIN;
  }

  isTraveler(): boolean {
    return this.getUserRole() === Role.TRAVELER;
  }

  updateUserRole(role: Role): void {
    if (role) {
      this.userRoleSubject.next(role);
      localStorage.setItem('userRole', role);
      const currentUser = this.currentUserSubject.value;
      if (currentUser) {
        currentUser.role = role;
        this.currentUserSubject.next({ ...currentUser });
        localStorage.setItem('user', JSON.stringify(currentUser));
      }
    }
  }

  /** Manage token expiration/refresh */
  private setSession(authResponse: AuthenticationResponse): void {
    localStorage.setItem('token', authResponse.token);
    localStorage.setItem('accessToken', authResponse.token);
    localStorage.setItem('refreshToken', authResponse.refreshToken);
    localStorage.setItem('expiresAt', authResponse.expiresAt.toString());
    localStorage.setItem('userId', authResponse.userId);
    if (authResponse.role) {
      this.userRoleSubject.next(authResponse.role);
      localStorage.setItem('userRole', authResponse.role);
    }

    this.startRefreshTokenTimer();
    this.getCurrentUser().subscribe({
      next: () => console.log('[AuthService] User fetched successfully'),
      error: err => console.error('[AuthService] Error fetching user:', err)
    });
  }

  private startRefreshTokenTimer(): void {
    this.stopRefreshTokenTimer();
    const expiresAt = this.getTokenExpiration();
    if (!expiresAt) return;
    const timeout = expiresAt - Date.now() - (60 * 1000);
    if (timeout <= 0) {
      this.refreshToken().subscribe();
    } else {
      this.refreshTokenTimeout = setTimeout(() => {
        this.refreshToken().subscribe();
      }, timeout);
    }
  }

  private stopRefreshTokenTimer(): void {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
      this.refreshTokenTimeout = null;
    }
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let msg = 'An unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      msg = `Client error: ${error.error.message}`;
    } else {
      msg = `Server error (${error.status}): ${error.message}`;
      if (error.status === 401) msg = 'Unauthorized access';
      if (error.status === 403) msg = 'Access forbidden';
      if (error.status === 404) msg = 'Resource not found';
      if (error.status === 400) msg = 'Bad request – check sent data';
    }
    console.error('[AuthService] Error handler:', msg);
    return throwError(() => new Error(msg));
  }
}
