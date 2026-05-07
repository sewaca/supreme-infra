import { z } from 'zod';

export const decodedTokenSchema = z.object({
  sub: z.string(),
  jti: z.string().optional(),
  email: z.string(),
  name: z.string(),
  role: z.string(),
  iat: z.number(),
  exp: z.number(),
});

export type DecodedToken = z.infer<typeof decodedTokenSchema>;
