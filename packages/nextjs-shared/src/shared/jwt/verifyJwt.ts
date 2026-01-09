import { jwtVerify } from 'jose';

export type JwtVerifyOptions = { token: string; secret: string };

export const verifyJwt = async ({ token, secret }: JwtVerifyOptions): Promise<boolean> => {
  try {
    const secretKey = new TextEncoder().encode(secret);
    await jwtVerify(token, secretKey);
    return true;
  } catch {
    return false;
  }
};
