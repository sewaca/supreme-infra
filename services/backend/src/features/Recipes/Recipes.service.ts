import { Injectable, NotFoundException } from '@nestjs/common';
import recipesMock from '../../shared/recipes-mock.json';

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

export interface RecipeDetails extends Recipe {
  detailedIngredients: RecipeIngredient[];
  steps: RecipeStep[];
  servings: number;
  calories: number;
  author: string;
  likes: number;
  comments: RecipeComment[];
}

@Injectable()
export class RecipesService {
  public getRecipes(_searchQuery?: string, _ingredients?: string[]): Recipe[] {
    return recipesMock.map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      cookingTime: recipe.cookingTime,
      difficulty: recipe.difficulty as 'easy' | 'medium' | 'hard',
      imageUrl: recipe.imageUrl,
      servings: recipe.servings,
      calories: recipe.calories,
    }));
  }

  public getRecipeById(id: number): RecipeDetails {
    const recipe = recipesMock.find((recipe) => recipe.id === id);
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }
    return recipe as RecipeDetails;
  }
}
