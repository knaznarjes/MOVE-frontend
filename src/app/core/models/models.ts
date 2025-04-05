/* eslint-disable @typescript-eslint/naming-convention */
// src/app/models/account.model.ts
export interface Account {
    fullName: string;
    profilePhotoUrl: null;
    id?: string;
    email: string;
    password?: string;
  }

  // src/app/models/preference.model.ts
  export interface Preference {
    id?: string;
    userId?: string;
    category: string;
    priority: string;
  }

  // src/app/models/user.model.ts
  export interface User {
    id?: string;
    fullName: string;
    email?: string;
    role?: string;
    creationDate?: Date;
    photoProfile?: string | null;
    preferences?: Preference[];
  }

  // src/app/models/auth.model.ts
  export interface RegisterRequest {
    fullName: string;
    email: string;
    password: string;
    role?: string;
  }

  export interface AuthRequest {
    email: string;
    password: string;
  }

  export interface AuthResponse {
    token: string;
    refreshToken: string;
    expiresAt: number;
    userId: string;
    role: string;  // Assurez-vous que cette propriété existe

  }

  export interface RefreshTokenRequest {
    refreshToken: string;
  }

  export enum Role {
    ADMIN = 'ADMIN',
    TRAVELER = 'TRAVELER'
  }
