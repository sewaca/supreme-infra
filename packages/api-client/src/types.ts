export type UserRole = 'user' | 'moderator' | 'admin';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
}

export interface DecodedToken {
  sub: number;
  email: string;
  name: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export const TOKEN_KEY = 'auth_token';
