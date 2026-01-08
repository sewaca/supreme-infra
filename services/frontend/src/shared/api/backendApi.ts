// Re-export API instances from @supreme-int/api-client
import { authApi as clientAuthApi, recipesApi as clientRecipesApi } from '@supreme-int/api-client/client';
import { authApi as srvAuthApi, recipesApi as srvRecipesApi } from '@supreme-int/api-client/server';

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
  getRecipes: srvRecipesApi.getRecipes.bind(srvRecipesApi),
  getRecipeById: srvRecipesApi.getRecipeById.bind(srvRecipesApi),
  toggleRecipeLike: srvRecipesApi.toggleRecipeLike.bind(srvRecipesApi),
  submitRecipe: srvRecipesApi.submitRecipe.bind(srvRecipesApi),
  getProposedRecipes: srvRecipesApi.getProposedRecipes.bind(srvRecipesApi),
  publishRecipe: srvRecipesApi.publishRecipe.bind(srvRecipesApi),
  updateRecipe: srvRecipesApi.updateRecipe.bind(srvRecipesApi),
  deleteRecipe: srvRecipesApi.deleteRecipe.bind(srvRecipesApi),
  // Auth methods
  register: srvAuthApi.register.bind(srvAuthApi),
  login: srvAuthApi.login.bind(srvAuthApi),
  getCurrentUser: srvAuthApi.getCurrentUser.bind(srvAuthApi),
  getUserById: srvAuthApi.getUserById.bind(srvAuthApi),
  deleteUser: srvAuthApi.deleteUser.bind(srvAuthApi),
};

// Re-export individual API instances
export { clientAuthApi as authApi, clientRecipesApi as recipesApi };
export { srvAuthApi as serverAuthApi, srvRecipesApi as serverRecipesApi };

// Re-export types for backward compatibility
export type {
  AuthResponse,
  LoginData,
  Recipe,
  RecipeDetails,
  RegisterData,
  User,
} from '@supreme-int/api-client';
