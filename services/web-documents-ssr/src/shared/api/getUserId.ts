// TODO: extract from JWT token when auth middleware is enabled
const DEV_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

export const getUserId = (): string => {
  return DEV_USER_ID;
};
