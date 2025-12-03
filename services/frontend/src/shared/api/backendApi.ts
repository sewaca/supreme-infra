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
  servings: number;
  calories: number;
  author: string;
  likes: number;
  comments: RecipeComment[];
}

class BackendApi {
  private readonly baseUrl: string;

  private constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
  }

  private static instance: BackendApi | null = null;

  public static getInstance(): BackendApi {
    if (!BackendApi.instance) {
      BackendApi.instance = new BackendApi();
    }
    return BackendApi.instance;
  }

  public async getRecipes(
    searchQuery?: string,
    ingredients?: string[],
  ): Promise<Recipe[]> {
    const params = new URLSearchParams();
    if (searchQuery) {
      params.append('search', searchQuery);
    }
    if (ingredients && ingredients.length > 0) {
      params.append('ingredients', ingredients.join(','));
    }

    const url = `${this.baseUrl}/recipes${params.toString() ? `?${params.toString()}` : ''}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch recipes: ${response.statusText}`);
    }

    return response.json() as Promise<Recipe[]>;
  }

  public async getRecipeById(id: number): Promise<RecipeDetails> {
    const url = `${this.baseUrl}/recipes/${id}`;

    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Recipe not found');
      }
      throw new Error(`Failed to fetch recipe: ${response.statusText}`);
    }

    return response.json() as Promise<RecipeDetails>;
  }

  public async toggleRecipeLike(
    id: number,
    token: string,
  ): Promise<{ liked: boolean; totalLikes: number }> {
    const url = `${this.baseUrl}/recipes/${id}/like`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      if (response.status === 404) {
        throw new Error('Recipe not found');
      }
      throw new Error(`Failed to toggle like: ${response.statusText}`);
    }

    return response.json() as Promise<{ liked: boolean; totalLikes: number }>;
  }
}

export const backendApi = BackendApi.getInstance();
