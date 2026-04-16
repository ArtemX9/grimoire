import { faker } from '@faker-js/faker';

import { Plan, Role, User } from '@grimoire/shared';

export interface IGenerateUser {
  id?: string;
  email?: string;
  name?: string;
  plan?: Plan;
  role?: Role;
  mustChangePassword?: boolean;
  aiEnabled?: boolean;
  aiRequestsLimit?: number | null;
  createdAt?: Date;
}

export function generateUser(params: IGenerateUser = {}): User {
  return {
    id: params.id ?? faker.string.uuid(),
    email: params.email ?? faker.internet.email(),
    name: params.name ?? faker.person.fullName(),
    plan: params.plan ?? Plan.FREE,
    role: params.role ?? Role.USER,
    mustChangePassword: params.mustChangePassword ?? false,
    aiEnabled: params.aiEnabled ?? false,
    aiRequestsLimit: params.aiRequestsLimit !== undefined ? params.aiRequestsLimit : null,
    createdAt: params.createdAt ?? faker.date.past(),
  };
}
