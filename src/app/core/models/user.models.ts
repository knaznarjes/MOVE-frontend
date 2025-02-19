
export interface RegisterRequest {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: 'USER' | 'ADMIN';
  }

  export interface AuthenticationRequest {
    email: string;
    password: string;
  }

  export interface AuthenticationResponse {
    token: string;
  }

  export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'USER' | 'ADMIN';
  }
