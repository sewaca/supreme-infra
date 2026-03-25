import { deleteUser, getCurrentUser, login, register } from '../lib/auth.client';

export const backendApi = {
  login,
  register,
  getCurrentUser,
  deleteUser,
};
