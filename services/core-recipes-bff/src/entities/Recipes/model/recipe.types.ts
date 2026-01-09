export interface RecipeDto {
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

export interface RecipeDetailsDto extends RecipeDto {
  detailedIngredients: Array<{ name: string; amount: string }>;
  steps: Array<{ stepNumber: number; instruction: string }>;
  author: string;
  likes: number;
  comments: Array<{
    id: number;
    author: string;
    content: string;
    createdAt: string;
    rating: number;
  }>;
}
