export interface AuthenticationRequest {
    email: string;
    password: string;
}

export interface AuthenticationResponse {
    token: string;
    refreshToken: string;
    expiresAt: number;
}

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
}
