import { faker } from '@faker-js/faker';
import { Plan, Role, User } from '@grimoire/shared';

import type { Session } from '@/store/state/auth/index';
import type { AdminUserRow } from '@/store/thunks/admin/types';

// ---------------------------------------------------------------------------
// User (shared type)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Session (auth state type — the shape returned by /auth/get-session)
// ---------------------------------------------------------------------------

export interface IGenerateSession {
  id?: string;
  email?: string;
  name?: string;
  role?: Role;
  mustChangePassword?: boolean;
  aiEnabled?: boolean;
  aiRequestsLimit?: number | null;
}

export function generateSession(params: IGenerateSession = {}): Session {
  return {
    user: {
      id: params.id ?? faker.string.uuid(),
      email: params.email ?? faker.internet.email(),
      name: params.name ?? faker.person.fullName(),
      role: params.role ?? Role.USER,
      mustChangePassword: params.mustChangePassword ?? false,
      aiEnabled: params.aiEnabled ?? false,
      aiRequestsLimit: params.aiRequestsLimit !== undefined ? params.aiRequestsLimit : null,
    },
  };
}

// ---------------------------------------------------------------------------
// AdminUserRow (admin thunk type — the shape used in the admin dashboard)
// ---------------------------------------------------------------------------

export interface IGenerateAdminUserRow {
  id?: string;
  email?: string;
  name?: string;
  role?: Role;
  plan?: string;
  mustChangePassword?: boolean;
  aiEnabled?: boolean;
  aiRequestsUsed?: number;
  aiRequestsLimit?: number | null;
  gamesCount?: number;
  createdAt?: string;
}

export function generateAdminUserRow(params: IGenerateAdminUserRow = {}): AdminUserRow {
  return {
    id: params.id ?? faker.string.uuid(),
    email: params.email ?? faker.internet.email(),
    name: params.name ?? faker.person.fullName(),
    role: params.role ?? Role.USER,
    plan: params.plan ?? Plan.FREE,
    mustChangePassword: params.mustChangePassword ?? false,
    aiEnabled: params.aiEnabled ?? false,
    aiRequestsUsed: params.aiRequestsUsed ?? 0,
    aiRequestsLimit: params.aiRequestsLimit !== undefined ? params.aiRequestsLimit : null,
    gamesCount: params.gamesCount ?? faker.number.int({ min: 0, max: 100 }),
    createdAt: params.createdAt ?? faker.date.past().toISOString(),
  };
}
