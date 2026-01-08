import { clientAuthApi, clientRecipesApi } from '../lib/auth.client';

// Combined API for client-side usage
export const backendApi = {
  // Recipes methods
  getRecipes: clientRecipesApi.getRecipes.bind(clientRecipesApi),
  getRecipeById: clientRecipesApi.getRecipeById.bind(clientRecipesApi),
  toggleRecipeLike: clientRecipesApi.toggleRecipeLike.bind(clientRecipesApi),
  submitRecipe: clientRecipesApi.submitRecipe.bind(clientRecipesApi),
  getProposedRecipes: clientRecipesApi.getProposedRecipes.bind(clientRecipesApi),
  publishRecipe: clientRecipesApi.publishRecipe.bind(clientRecipesApi),
  updateRecipe: clientRecipesApi.updateRecipe.bind(clientRecipesApi),
  deleteRecipe: clientRecipesApi.deleteRecipe.bind(clientRecipesApi),
  // Auth methods
  register: clientAuthApi.register.bind(clientAuthApi),
  login: clientAuthApi.login.bind(clientAuthApi),
  getCurrentUser: clientAuthApi.getCurrentUser.bind(clientAuthApi),
  getUserById: clientAuthApi.getUserById.bind(clientAuthApi),
  deleteUser: clientAuthApi.deleteUser.bind(clientAuthApi),
};

// Re-export individual API instances
export { clientAuthApi as authApi, clientRecipesApi as recipesApi };

// Re-export types for backward compatibility
export type {
  AuthResponse,
  LoginData,
  Recipe,
  RecipeDetails,
  RegisterData,
  User,
} from '@supreme-int/api-client';
