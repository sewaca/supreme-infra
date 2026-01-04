export type User = {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'moderator' | 'admin';
};

export type Recipe = {
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
};

export type RecipeIngredient = {
  name: string;
  amount: string;
};

export type RecipeStep = {
  stepNumber: number;
  instruction: string;
};

export type RecipeComment = {
  id: number;
  author: string;
  content: string;
  createdAt: string;
  rating: number;
};

export type RecipeDetails = Recipe & {
  detailedIngredients: RecipeIngredient[];
  steps: RecipeStep[];
  servings: number;
  calories: number;
  author: string;
  likes: number;
  comments: RecipeComment[];
  isLiked?: boolean;
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
