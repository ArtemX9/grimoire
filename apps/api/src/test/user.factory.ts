import { faker } from '@faker-js/faker';

import { Plan, Role } from '@grimoire/shared';

import { RequestUser } from '../common/decorators/current-user.decorator';

export interface IGenerateUser {
  id?: string;
  email?: string;
  name?: string;
  plan?: Plan;
  role?: Role;
  mustChangePassword?: boolean;
  isDemo?: boolean;
}

export function generateUser(params: IGenerateUser = {}): RequestUser {
  return {
    id: params.id ?? faker.string.uuid(),
    email: params.email ?? faker.internet.email(),
    plan: params.plan ?? Plan.FREE,
    role: params.role ?? Role.USER,
    mustChangePassword: params.mustChangePassword ?? false,
    isDemo: params.isDemo ?? false,
  };
}
