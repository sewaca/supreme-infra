import { beforeEach, describe, expect, it, vi } from 'vitest';
import { backendApi, Recipe, RecipeDetails } from './backendApi';

// Mock global fetch
global.fetch = vi.fn();

describe('BackendApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRecipes', () => {
    it('should fetch all recipes when no filters provided', async () => {
      const mockRecipes: Recipe[] = [
        {
          id: 1,
          title: 'Test Recipe',
          description: 'Test description',
          ingredients: ['ingredient1', 'ingredient2'],
          instructions: 'Test instructions',
          cookingTime: 30,
          difficulty: 'easy',
          imageUrl: 'https://example.com/image.jpg',
          servings: 4,
          calories: 320,
        },
      ];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipes,
      });

      const result = await backendApi.getRecipes();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/recipes',
        undefined,
      );
      expect(result).toEqual(mockRecipes);
    });

    it('should fetch recipes with search query', async () => {
      const mockRecipes: Recipe[] = [
        {
          id: 1,
          title: 'Test Recipe',
          description: 'Test description',
          ingredients: ['ingredient1'],
          instructions: 'Test instructions',
          cookingTime: 30,
          difficulty: 'easy',
          imageUrl: 'https://example.com/image.jpg',
          servings: 4,
          calories: 320,
        },
      ];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipes,
      });

      const result = await backendApi.getRecipes('test');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/recipes?search=test',
        undefined,
      );
      expect(result).toEqual(mockRecipes);
    });

    it('should throw error when fetch fails', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(backendApi.getRecipes()).rejects.toThrow(
        'Failed to fetch recipes: Not Found',
      );
    });
  });

  describe('getRecipeById', () => {
    it('should fetch recipe details', async () => {
      const mockRecipe: RecipeDetails = {
        id: 1,
        title: 'Test Recipe',
        description: 'Test description',
        ingredients: ['ingredient1'],
        instructions: 'Test instructions',
        cookingTime: 30,
        difficulty: 'easy',
        imageUrl: 'https://example.com/image.jpg',
        servings: 4,
        calories: 320,
        detailedIngredients: [{ name: 'ingredient1', amount: '100g' }],
        steps: [{ stepNumber: 1, instruction: 'Step 1' }],
        author: 'Test Author',
        likes: 10,
        comments: [],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipe,
      });

      const result = await backendApi.getRecipeById(1);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/recipes/1',
        expect.any(Object),
      );
      expect(result).toEqual(mockRecipe);
    });

    it('should throw error when recipe not found', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(backendApi.getRecipeById(999)).rejects.toThrow(
        'Recipe not found',
      );
    });

    it('should throw error when fetch fails', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(backendApi.getRecipeById(1)).rejects.toThrow(
        'Failed to fetch recipe: Internal Server Error',
      );
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = backendApi;
      const instance2 = backendApi;

      expect(instance1).toBe(instance2);
    });
  });
});
