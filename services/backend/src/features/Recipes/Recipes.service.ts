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
  private proposedRecipes: RecipeDetails[] = [];
  private nextProposedRecipeId = 1_000_000;
  public getRecipes(searchQuery?: string, ingredients?: string[]): Recipe[] {
    let filteredRecipes = recipesMock;

    // Фильтрация по поисковой строке
    if (searchQuery?.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filteredRecipes = filteredRecipes.filter(
        (recipe) =>
          recipe.title.toLowerCase().includes(query) ||
          recipe.description.toLowerCase().includes(query),
      );
    }

    // Фильтрация по ингредиентам
    if (ingredients && ingredients.length > 0) {
      const normalizedIngredients = ingredients
        .map((ing) => ing.trim())
        .filter((ing) => ing.length > 0);

      if (normalizedIngredients.length > 0) {
        filteredRecipes = filteredRecipes.filter((recipe) => {
          const recipeIngredients = recipe.ingredients.map((ing) =>
            ing.toLowerCase(),
          );
          return normalizedIngredients.every((ingredient) =>
            recipeIngredients.includes(ingredient.toLowerCase()),
          );
        });
      }
    }

    return filteredRecipes.map((recipe) => ({
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

  public submitRecipe(
    recipeData: Omit<RecipeDetails, 'id' | 'likes' | 'comments'>,
  ): number {
    const id = this.nextProposedRecipeId++;
    const recipe: RecipeDetails = { ...recipeData, id, likes: 0, comments: [] };
    this.proposedRecipes.push(recipe);
    return id;
  }
}
