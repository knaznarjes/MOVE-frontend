/* eslint-disable @typescript-eslint/naming-convention */
// src/app/core/models/account.model.ts
export interface Account {
  id?: string;
  email: string;
}

// src/app/core/models/authentication-request.model.ts
export interface AuthenticationRequest {
  email: string;
  password: string;
}

// src/app/core/models/authentication-response.model.ts
export interface AuthenticationResponse {
  token: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
}

// src/app/core/models/preference.model.ts
export interface Preference {
  id?: string;
  userId?: string;
  category: string;
  priority: string;
}

// src/app/core/models/refresh-token-request.model.ts
export interface RefreshTokenRequest {
  refreshToken: string;
}

// src/app/core/models/register-request.model.ts
export enum Role {
  ADMIN = 'ADMIN',
  TRAVELER = 'TRAVELER'
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role?: Role;
}

// src/app/core/models/user.model.ts
export interface User {
  id?: string;
  fullName: string;
  email?: string;
  role?: string;
  creationDate?: Date;
  photoProfile?: string;
  preference?: Preference;
}
