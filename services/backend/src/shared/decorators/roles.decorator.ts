import { SetMetadata } from '@nestjs/common';

export type UserRole = 'user' | 'moderator' | 'admin';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
