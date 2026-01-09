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
  author: string;
  likes: number;
  comments: RecipeComment[];
  isLiked?: boolean;
};
