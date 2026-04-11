import { clientRecipesApi } from '../lib/auth.client';

// Combined API for client-side usage
export const backendApi = {
  // Recipes methods
  getRecipes: clientRecipesApi.getRecipes.bind(clientRecipesApi),
  getRecipeById: clientRecipesApi.getRecipeById.bind(clientRecipesApi),
  toggleRecipeLike: clientRecipesApi.toggleRecipeLike.bind(clientRecipesApi),
  proposeRecipe: clientRecipesApi.proposeRecipe.bind(clientRecipesApi),
  getProposedRecipes: clientRecipesApi.getProposedRecipes.bind(clientRecipesApi),
  publishRecipe: clientRecipesApi.publishRecipe.bind(clientRecipesApi),
  updateRecipe: clientRecipesApi.updateRecipe.bind(clientRecipesApi),
  deleteRecipe: clientRecipesApi.deleteRecipe.bind(clientRecipesApi),
};

export type {
  AuthResponse,
  LoginData,
  RegisterData,
  User,
} from '@supreme-int/api-client/src/core-auth-bff/auth-api.types';
// Re-export types for backward compatibility
export type {
  Recipe,
  RecipeDetails,
} from '@supreme-int/api-client/src/core-recipes-bff/recipes-api.types';
