import { BaseApi } from '../base-api';
import type { Recipe, RecipeDetails } from './recipes-api.types';

export class RecipesApi extends BaseApi {
  public async getRecipes(searchQuery?: string, ingredients?: string[]): Promise<Recipe[]> {
    const params = new URLSearchParams();
    if (searchQuery) {
      params.append('search', searchQuery);
    }
    if (ingredients && ingredients.length > 0) {
      params.append('ingredients', ingredients.join(','));
    }

    const url = `${this.baseUrl}/recipes${params.toString() ? `?${params.toString()}` : ''}`;

    const response = await this.fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch recipes: ${response.statusText}`);
    }

    return response.json() as Promise<Recipe[]>;
  }

  public async getRecipeById(id: number | string, token?: string): Promise<RecipeDetails> {
    const url = `${this.baseUrl}/recipes/${id}`;

    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await this.fetch(url, { headers });
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Recipe not found');
      }
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      throw new Error(`Failed to fetch recipe: ${response.statusText}`);
    }

    return response.json() as Promise<RecipeDetails>;
  }

  public async toggleRecipeLike(id: number, token: string): Promise<{ liked: boolean; totalLikes: number }> {
    const url = `${this.baseUrl}/recipes/${id}/like`;

    const response = await this.fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      if (response.status === 404) {
        throw new Error('Recipe not found');
      }
      throw new Error(`Failed to toggle like: ${errorText || response.statusText}`);
    }

    return response.json() as Promise<{ liked: boolean; totalLikes: number }>;
  }

  public async proposeRecipe(
    recipe: Omit<RecipeDetails, 'id' | 'likes' | 'comments' | 'instructions'>,
  ): Promise<{ success: boolean; id: number }> {
    const url = `${this.baseUrl}/recipes/propose`;

    const response = await this.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recipe),
    });

    if (!response.ok) {
      throw new Error(`Failed to propose recipe: ${response.statusText}`);
    }

    return response.json() as Promise<{ success: boolean; id: number }>;
  }

  public async getProposedRecipes(token: string): Promise<Recipe[]> {
    const url = `${this.baseUrl}/recipes/proposed/all`;

    const response = await this.fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      throw new Error(`Failed to fetch proposed recipes: ${response.statusText}`);
    }

    return response.json() as Promise<Recipe[]>;
  }

  public async publishRecipe(id: number | string, token: string): Promise<{ id: number }> {
    const url = `${this.baseUrl}/recipes/proposed/${id}/publish`;

    const response = await this.fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      if (response.status === 404) {
        throw new Error('Proposed recipe not found');
      }
      throw new Error(`Failed to publish recipe: ${response.statusText}`);
    }

    return response.json() as Promise<{ id: number }>;
  }

  public async updateRecipe(
    id: number | string,
    recipe: Omit<RecipeDetails, 'id' | 'likes' | 'comments' | 'instructions'>,
    token: string,
  ): Promise<RecipeDetails> {
    const url = `${this.baseUrl}/recipes/${id}`;

    const response = await this.fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recipe),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      if (response.status === 404) {
        throw new Error('Recipe not found');
      }
      throw new Error(`Failed to update recipe: ${response.statusText}`);
    }

    return response.json() as Promise<RecipeDetails>;
  }

  public async deleteRecipe(id: number | string, token: string): Promise<{ success: boolean }> {
    const url = `${this.baseUrl}/recipes/${id}`;

    const response = await this.fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      if (response.status === 404) {
        throw new Error('Recipe not found');
      }
      throw new Error(`Failed to delete recipe: ${response.statusText}`);
    }

    return response.json() as Promise<{ success: boolean }>;
  }
}
