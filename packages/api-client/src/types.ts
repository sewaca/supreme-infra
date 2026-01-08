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

export interface Recipe {
  id: number;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string;
  cookingTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  imageUrl: string;
  servings: number;
  calories: number;
}

export interface RecipeIngredient {
  name: string;
  amount: string;
}

export interface RecipeStep {
  stepNumber: number;
  instruction: string;
}

export interface RecipeComment {
  id: number;
  author: string;
  content: string;
  createdAt: string;
  rating: number;
}

export interface RecipeDetails extends Recipe {
  detailedIngredients: RecipeIngredient[];
  steps: RecipeStep[];
  author: string;
  likes: number;
  comments: RecipeComment[];
  isLiked?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export const TOKEN_KEY = 'auth_token';
