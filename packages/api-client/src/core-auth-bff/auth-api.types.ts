export type UserRole = 'user' | 'moderator' | 'admin';

export type User = {
  id: number;
  email: string;
  name: string;
  role: UserRole;
};

export type DecodedToken = {
  sub: number;
  email: string;
  name: string;
  role: UserRole;
  iat: number;
  exp: number;
};

export type RegisterData = {
  email: string;
  password: string;
  name: string;
};

export type LoginData = {
  email: string;
  password: string;
};

export type AuthResponse = {
  accessToken: string;
  user: User;
};

export const TOKEN_KEY = 'auth_token';
