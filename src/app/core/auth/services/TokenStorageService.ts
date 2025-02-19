import { Injectable } from '@angular/core';
import { User } from '../models/auth.models';

@Injectable({
    providedIn: 'root'
  })
  export class TokenStorageService {
    getToken(): string | null {
      return localStorage.getItem('token');
    }

    setToken(token: string): void {
      localStorage.setItem('token', token);
    }

    removeToken(): void {
      localStorage.removeItem('token');
    }

    getRefreshToken(): string | null {
      return localStorage.getItem('refreshToken');
    }

    setRefreshToken(token: string): void {
      localStorage.setItem('refreshToken', token);
    }

    removeRefreshToken(): void {
      localStorage.removeItem('refreshToken');
    }

    getUserRole(): string | null {
      return localStorage.getItem('userRole');
    }

    setUserRole(role: string): void {
      localStorage.setItem('userRole', role);
    }

    getUserData(): User | null {
      const data = localStorage.getItem('userData');
      return data ? JSON.parse(data) : null;
    }

    setUserData(user: User): void {
      localStorage.setItem('userData', JSON.stringify(user));
    }

    clear(): void {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userData');
    }
  }
