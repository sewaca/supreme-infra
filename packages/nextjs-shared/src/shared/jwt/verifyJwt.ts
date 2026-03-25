import { verifyJwt as verifyJwtCore } from '@supreme-int/authorization-lib/src/jwt/verify-jwt';

export type JwtVerifyOptions = { token: string; secret: string };

/** @deprecated Use @supreme-int/authorization-lib/src/jwt/verify-jwt directly */
export const verifyJwt = async ({ token, secret }: JwtVerifyOptions): Promise<boolean> => {
  const { valid } = await verifyJwtCore({ token, secret });
  return valid;
};
