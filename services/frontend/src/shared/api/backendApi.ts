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

  public async submitRecipe(
    recipe: Omit<RecipeDetails, 'id' | 'likes' | 'comments'>,
  ): Promise<{ success: boolean }> {
    const url = `${this.baseUrl}/recipes/submit`;

    const response = await fetch(url, {
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
