import { Injectable, NotFoundException } from '@nestjs/common';
import recipesMock from '../../../shared/recipes-mock.json';

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
  private publishedRecipes: RecipeDetails[] = [];
  private nextProposedRecipeId = 1_000_000;
  private deletedMockRecipeIds = new Set<number>();
  private updatedMockRecipes = new Map<number, RecipeDetails>();
  private getMockRecipes(): RecipeDetails[] {
    return recipesMock
      .filter((recipe) => !this.deletedMockRecipeIds.has(recipe.id))
      .map((recipe) => {
        const updated = this.updatedMockRecipes.get(recipe.id);
        return (updated || recipe) as RecipeDetails;
      });
  }

  public getRecipes(searchQuery?: string, ingredients?: string[]): Recipe[] {
    const mockRecipes = this.getMockRecipes();
    const allRecipes = [...mockRecipes, ...this.publishedRecipes];
    let filteredRecipes = allRecipes;

    // Фильтрация по поисковой строке
    if (searchQuery?.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filteredRecipes = filteredRecipes.filter(
        (recipe) => recipe.title.toLowerCase().includes(query) || recipe.description.toLowerCase().includes(query),
      );
    }

    // Фильтрация по ингредиентам
    if (ingredients && ingredients.length > 0) {
      const normalizedIngredients = ingredients.map((ing) => ing.trim()).filter((ing) => ing.length > 0);

      if (normalizedIngredients.length > 0) {
        filteredRecipes = filteredRecipes.filter((recipe) => {
          const recipeIngredients = recipe.ingredients.map((ing) => ing.toLowerCase());
          return normalizedIngredients.every((ingredient) => recipeIngredients.includes(ingredient.toLowerCase()));
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

  public getRecipeById(id: number, includeProposed = false): RecipeDetails {
    if (this.deletedMockRecipeIds.has(id)) {
      throw new NotFoundException('Recipe not found');
    }
    const mockRecipes = this.getMockRecipes();
    const allRecipes = [...mockRecipes, ...this.publishedRecipes];
    const recipe = allRecipes.find((recipe) => recipe.id === id);
    if (recipe) {
      return recipe as RecipeDetails;
    }

    if (includeProposed) {
      const proposedRecipe = this.proposedRecipes.find((recipe) => recipe.id === id);
      if (proposedRecipe) {
        return proposedRecipe;
      }
    }

    throw new NotFoundException('Recipe not found');
  }

  public getProposedRecipes(): Recipe[] {
    return this.proposedRecipes.map((recipe) => ({
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

  public publishRecipe(id: number): RecipeDetails {
    const proposedRecipeIndex = this.proposedRecipes.findIndex((recipe) => recipe.id === id);

    if (proposedRecipeIndex === -1) {
      throw new NotFoundException('Proposed recipe not found');
    }

    const recipe = this.proposedRecipes[proposedRecipeIndex];
    const mockRecipes = this.getMockRecipes();
    const allRecipes = [...mockRecipes, ...this.publishedRecipes];
    const maxId = Math.max(...allRecipes.map((r) => r.id));
    const publishedRecipe: RecipeDetails = {
      ...recipe,
      id: maxId + 1,
    };

    this.publishedRecipes.push(publishedRecipe);
    this.proposedRecipes.splice(proposedRecipeIndex, 1);

    return publishedRecipe;
  }

  public submitRecipe(recipeData: Omit<RecipeDetails, 'id' | 'likes' | 'comments' | 'instructions'>): number {
    const id = this.nextProposedRecipeId++;
    const instructions = recipeData.steps.map((step) => step.instruction).join('\n');
    const recipe: RecipeDetails = {
      ...recipeData,
      instructions,
      id,
      likes: 0,
      comments: [],
    };
    this.proposedRecipes.push(recipe);
    return id;
  }

  public updateRecipe(
    id: number,
    recipeData: Omit<RecipeDetails, 'id' | 'likes' | 'comments' | 'instructions'>,
  ): RecipeDetails {
    const isProposed = id >= 1_000_000;

    if (isProposed) {
      const recipeIndex = this.proposedRecipes.findIndex((recipe) => recipe.id === id);
      if (recipeIndex === -1) {
        throw new NotFoundException('Recipe not found');
      }
      const existingRecipe = this.proposedRecipes[recipeIndex];
      const instructions = recipeData.steps.map((step) => step.instruction).join('\n');
      const updatedRecipe: RecipeDetails = {
        ...recipeData,
        instructions,
        id: existingRecipe.id,
        likes: existingRecipe.likes,
        comments: existingRecipe.comments,
      };
      this.proposedRecipes[recipeIndex] = updatedRecipe;
      return updatedRecipe;
    }

    if (this.deletedMockRecipeIds.has(id)) {
      throw new NotFoundException('Recipe not found');
    }

    const mockIndex = recipesMock.findIndex((r) => r.id === id);
    if (mockIndex !== -1) {
      const existingRecipe = (this.updatedMockRecipes.get(id) || recipesMock[mockIndex]) as RecipeDetails;
      const instructions = recipeData.steps.map((step) => step.instruction).join('\n');
      const updatedRecipe: RecipeDetails = {
        ...recipeData,
        instructions,
        id: existingRecipe.id,
        likes: existingRecipe.likes || 0,
        comments: existingRecipe.comments || [],
      };
      this.updatedMockRecipes.set(id, updatedRecipe);
      return updatedRecipe;
    }

    const publishedIndex = this.publishedRecipes.findIndex((r) => r.id === id);
    if (publishedIndex === -1) {
      throw new NotFoundException('Recipe not found');
    }
    const existingRecipe = this.publishedRecipes[publishedIndex];
    const instructions = recipeData.steps.map((step) => step.instruction).join('\n');
    const updatedRecipe: RecipeDetails = {
      ...recipeData,
      instructions,
      id: existingRecipe.id,
      likes: existingRecipe.likes,
      comments: existingRecipe.comments,
    };
    this.publishedRecipes[publishedIndex] = updatedRecipe;
    return updatedRecipe;
  }

  public deleteRecipe(id: number): boolean {
    const isProposed = id >= 1_000_000;

    if (isProposed) {
      const proposedIndex = this.proposedRecipes.findIndex((recipe) => recipe.id === id);
      if (proposedIndex === -1) {
        throw new NotFoundException('Recipe not found');
      }
      this.proposedRecipes.splice(proposedIndex, 1);
      return true;
    }

    const mockIndex = recipesMock.findIndex((r) => r.id === id);
    if (mockIndex !== -1) {
      this.deletedMockRecipeIds.add(id);
      this.updatedMockRecipes.delete(id);
      return true;
    }

    const publishedIndex = this.publishedRecipes.findIndex((r) => r.id === id);
    if (publishedIndex === -1) {
      throw new NotFoundException('Recipe not found');
    }

    this.publishedRecipes.splice(publishedIndex, 1);
    return true;
  }
}
