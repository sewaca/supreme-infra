import { clientAuthApi, clientRecipesApi } from '../lib/auth.client';
import { rscAuthApi, rscRecipesApi } from '../lib/auth.server';

// Combined API for backward compatibility
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

export const serverApi = {
  // Recipes methods
  getRecipes: rscRecipesApi.getRecipes.bind(rscRecipesApi),
  getRecipeById: rscRecipesApi.getRecipeById.bind(rscRecipesApi),
  toggleRecipeLike: rscRecipesApi.toggleRecipeLike.bind(rscRecipesApi),
  submitRecipe: rscRecipesApi.submitRecipe.bind(rscRecipesApi),
  getProposedRecipes: rscRecipesApi.getProposedRecipes.bind(rscRecipesApi),
  publishRecipe: rscRecipesApi.publishRecipe.bind(rscRecipesApi),
  updateRecipe: rscRecipesApi.updateRecipe.bind(rscRecipesApi),
  deleteRecipe: rscRecipesApi.deleteRecipe.bind(rscRecipesApi),
  // Auth methods
  register: rscAuthApi.register.bind(rscAuthApi),
  login: rscAuthApi.login.bind(rscAuthApi),
  getCurrentUser: rscAuthApi.getCurrentUser.bind(rscAuthApi),
  getUserById: rscAuthApi.getUserById.bind(rscAuthApi),
  deleteUser: rscAuthApi.deleteUser.bind(rscAuthApi),
};

// Re-export individual API instances
export { clientAuthApi as authApi, clientRecipesApi as recipesApi };
export { rscAuthApi as serverAuthApi, rscRecipesApi as serverRecipesApi };

// Re-export types for backward compatibility
export type {
  AuthResponse,
  LoginData,
  Recipe,
  RecipeDetails,
  RegisterData,
  User,
} from '@supreme-int/api-client';
