import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@martin-pos/shared';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
