import { deleteUser, getCurrentUser, login, lookup, register } from '../lib/auth.client';

export const backendApi = {
  login,
  lookup,
  register,
  getCurrentUser,
  deleteUser,
};
