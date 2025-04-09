/* eslint-disable @typescript-eslint/naming-convention */
export interface Account {
    id?: string;
    email: string;
    password?: string;
  }

  export interface Preference {
    id?: string;
    userId?: string;
    category: string;
    priority: string;
  }

  export interface User {
    id: string;
    fullName: string;
    role: string;
    creationDate?: Date;
    photoProfile?: string | null;
    account?: Account;
    preferences?: Preference[];
    email?: string;
    accountDTO?: AccountDTO;
  }

  export interface RegisterRequest {
    fullName: string;
    email: string;
    password: string;
    role?: Role;
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
    role: Role;
  }

  export interface RefreshTokenRequest {
    refreshToken: string;
  }

  export enum Role {
    ADMIN = 'ADMIN',
    TRAVELER = 'TRAVELER',
    MASTERADMIN  ='MASTERADMIN'
  }

  export interface AccountDTO {
    id: string;
    email?: string;
    password?: string;
  }

  export interface UserDTO {
    account: any;
    id: string;
    fullName: string;
    role: string;
    creationDate: Date;
    photoProfile?: string;
    accountDTO?: AccountDTO;
    preferences?: PreferenceDTO[];
  }

  export interface PreferenceDTO {
    id: string;
    userId: string;
    category: string;
    priority: string;
  }
