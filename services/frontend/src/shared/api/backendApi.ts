export interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'moderator' | 'admin';
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
  servings: number;
  calories: number;
  author: string;
  likes: number;
  comments: RecipeComment[];
}

class BackendApi {
  private readonly baseUrl: string;

  constructor(shiturl: string) {
    this.baseUrl = shiturl;
  }

  private async fetch(url: string, options?: RequestInit): Promise<Response> {
    console.log('outgoing request started', url, options);
    return fetch(url, options)
      .then((response) => {
        console.log(
          'outgoing request finished with status',
          response.status,
          response.statusText,
        );
        return response;
      })
      .catch((error) => {
        console.error('outgoing request failed with ', error);
        throw error;
      });
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

    const response = await this.fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch recipes: ${response.statusText}`);
    }

    return response.json() as Promise<Recipe[]>;
  }

  public async getRecipeById(
    id: number,
    token?: string,
  ): Promise<RecipeDetails> {
    const url = `${this.baseUrl}/recipes/${id}`;

    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });
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

  public async toggleRecipeLike(
    id: number,
    token: string,
  ): Promise<{ liked: boolean; totalLikes: number }> {
    const url = `${this.baseUrl}/recipes/${id}/like`;

    const response = await this.fetch(url, {
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

  public async submitRecipe(
    recipe: Omit<RecipeDetails, 'id' | 'likes' | 'comments' | 'instructions'>,
  ): Promise<{ success: boolean }> {
    const url = `${this.baseUrl}/recipes/submit`;

    const response = await this.fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recipe),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit recipe: ${response.statusText}`);
    }

    return response.json() as Promise<{ success: boolean }>;
  }

  public async getProposedRecipes(token: string): Promise<Recipe[]> {
    const url = `${this.baseUrl}/recipes/proposed/all`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      throw new Error(
        `Failed to fetch proposed recipes: ${response.statusText}`,
      );
    }

    return response.json() as Promise<Recipe[]>;
  }

  public async publishRecipe(
    id: number,
    token: string,
  ): Promise<RecipeDetails> {
    const url = `${this.baseUrl}/recipes/proposed/${id}/publish`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        // TODO: fixme – need to fix method to update or etc
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

    return response.json() as Promise<RecipeDetails>;
  }

  public async updateRecipe(
    id: number,
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

  public async deleteRecipe(
    id: number,
    token: string,
  ): Promise<{ success: boolean }> {
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

  public async getUserById(id: number, token: string): Promise<User> {
    const url = `${this.baseUrl}/auth/users/${id}`;

    const response = await this.fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      if (response.status === 404) {
        throw new Error('User not found');
      }
      throw new Error(`Failed to fetch user: ${response.statusText}`);
    }

    return response.json() as Promise<User>;
  }

  public async deleteUser(
    id: number,
    token: string,
  ): Promise<{ success: boolean }> {
    const url = `${this.baseUrl}/auth/users/${id}`;

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
        throw new Error('User not found');
      }
      throw new Error(`Failed to delete user: ${response.statusText}`);
    }

    return response.json() as Promise<{ success: boolean }>;
  }
}

const isProd = process.env.NODE_ENV === 'production';

const createServerApi = () => {
  if (!isProd) {
    return new BackendApi('http://localhost:4000');
  }

  // Используем POD_NAMESPACE из Kubernetes Downward API
  // Если указан BACKEND_SERVICE_NAMESPACE и он отличается от текущего namespace,
  // используем полный формат DNS имени
  const podNamespace = process.env.POD_NAMESPACE;
  const backendNamespace = process.env.BACKEND_SERVICE_NAMESPACE;

  const backendUrl =
    backendNamespace && backendNamespace !== podNamespace
      ? `http://backend.${backendNamespace}.svc.cluster.local`
      : 'http://backend'; // Короткий формат для того же namespace

  return new BackendApi(backendUrl);
};

const createClientApi = () =>
  new BackendApi(
    isProd ? 'http://84.252.134.216/api' : 'http://localhost:4000',
  );

export const serverApi = createServerApi();
export const backendApi = createClientApi();
