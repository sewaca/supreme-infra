import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '../../features/Auth/model/Users.service';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
