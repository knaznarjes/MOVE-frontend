// auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthenticationRequest, AuthenticationResponse, RegisterRequest, User } from '../models/auth.models';
import { environment } from 'environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly API_URL = environment.apiUrl;
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient) {
        const token = localStorage.getItem('token');
        if (token) {
            this.loadUserProfile();
        }
    }

    register(request: RegisterRequest): Observable<AuthenticationResponse> {
        return this.http.post<AuthenticationResponse>(`${this.API_URL}/auth/register`, request)
            .pipe(
                tap(response => {
                    if (response?.token) {
                        localStorage.setItem('token', response.token);
                        this.loadUserProfile();
                    }
                })
            );
    }

    login(request: AuthenticationRequest): Observable<AuthenticationResponse> {
        return this.http.post<AuthenticationResponse>(`${this.API_URL}/auth/login`, request)
            .pipe(
                tap(response => {
                    if (response?.token) {
                        localStorage.setItem('token', response.token);
                        this.loadUserProfile();
                    }
                })
            );
    }

    logout(): void {
        localStorage.removeItem('token');
        this.currentUserSubject.next(null);
    }

    private loadUserProfile(): void {
        // Note: You'll need to implement this endpoint in your backend
        this.http.get<User>(`${this.API_URL}/profile`)
            .subscribe({
                next: (user) => {
                    this.currentUserSubject.next(user);
                },
                error: () => {
                    // If profile load fails, clear token and user
                    this.logout();
                }
            });
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    hasRole(role: string): boolean {
        const currentUser = this.currentUserSubject.value;
        return currentUser ? currentUser.role === role : false;
    }
}
