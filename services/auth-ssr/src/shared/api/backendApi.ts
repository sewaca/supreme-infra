import { clientAuthApi } from '../lib/auth.client';

// Combined API for client-side usage
export const backendApi = {
  // Auth methods
  register: clientAuthApi.register.bind(clientAuthApi),
  login: clientAuthApi.login.bind(clientAuthApi),
  getCurrentUser: clientAuthApi.getCurrentUser.bind(clientAuthApi),
  getUserById: clientAuthApi.getUserById.bind(clientAuthApi),
  deleteUser: clientAuthApi.deleteUser.bind(clientAuthApi),
};

// Re-export individual API instances
export { clientAuthApi as authApi };

// Re-export types for backward compatibility
export type {
  AuthResponse,
  LoginData,
  Recipe,
  RecipeDetails,
  RegisterData,
  User,
} from '@supreme-int/api-client';
