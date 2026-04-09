import { BadRequestException, CanActivate, ExecutionContext, INestApplication, NotFoundException } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';

import * as request from 'supertest';

import {Plan, Role} from '@grimoire/shared';

import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { ZodValidationPipe } from '../src/common/pipes/zod-validation.pipe';
import { AdminController } from '../src/modules/admin/admin.controller';
import { AdminAiService } from '../src/modules/admin/admin-ai.service';
import { AdminService } from '../src/modules/admin/admin.service';

// ---------------------------------------------------------------------------
// Test doubles
// ---------------------------------------------------------------------------

/**
 * Injects a user into req.user so @CurrentUser() resolves correctly.
 * Swapped per test via the `activeUser` reference.
 */
const activeUser: { value: Record<string, unknown> | null } = {
  value: { id: 'admin-1', email: 'admin@example.com', role: Role.ADMIN, plan: Plan.LIFETIME, mustChangePassword: false },
};

class FakeAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    if (!activeUser.value) return false;
    req.user = activeUser.value;
    return true;
  }
}

function makeAdminUserResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-2',
    email: 'user@example.com',
    name: undefined,
    role: Role.USER,
    plan: Plan.FREE,
    mustChangePassword: false,
    aiEnabled: true,
    aiRequestsUsed: 0,
    aiRequestsLimit: null,
    gamesCount: 0,
    createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/admin/users/:id/role (e2e)', () => {
  let app: INestApplication;
  let adminService: jest.Mocked<Pick<AdminService, 'updateUserRole'>>;

  beforeAll(async () => {
    const mockAdminService = {
      setupAdmin: jest.fn(),
      listUsers: jest.fn(),
      createUser: jest.fn(),
      deleteUser: jest.fn(),
      updateUserPlan: jest.fn(),
      updateUserRole: jest.fn(),
      getStats: jest.fn(),
    };

    const mockAdminAiService = {
      getGlobalSettings: jest.fn(),
      updateSettings: jest.fn(),
      updateUserAiSettings: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminService, useValue: mockAdminService },
        { provide: AdminAiService, useValue: mockAdminAiService },
        // Replace the global auth guard with the test double so no real
        // better-auth / database calls are made during E2E tests.
        { provide: APP_GUARD, useClass: FakeAuthGuard },
      ],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ZodValidationPipe());
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();

    adminService = module.get(AdminService) as jest.Mocked<Pick<AdminService, 'updateUserRole'>>;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: authenticated admin
    activeUser.value = {
      id: 'admin-1',
      email: 'admin@example.com',
      role: Role.ADMIN,
      plan: Plan,
      mustChangePassword: false,
    };
  });

  // -------------------------------------------------------------------------
  // 200 — happy path
  // -------------------------------------------------------------------------

  it('returns 200 with the updated user when called with a valid Role', async () => {
    const updated = makeAdminUserResponse({ role: Role.ADMIN });
    (adminService.updateUserRole as jest.Mock).mockResolvedValue(updated);

    const res = await request(app.getHttpServer())
      .patch('/api/v1/admin/users/user-2/role')
      .send({ role: Role.ADMIN });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe(Role.ADMIN);
    expect(adminService.updateUserRole).toHaveBeenCalledWith('admin-1', 'user-2', Role.ADMIN);
  });

  it('returns 200 and passes USER role through correctly', async () => {
    const updated = makeAdminUserResponse({ role: Role.USER });
    (adminService.updateUserRole as jest.Mock).mockResolvedValue(updated);

    const res = await request(app.getHttpServer())
      .patch('/api/v1/admin/users/user-2/role')
      .send({ role: Role.USER });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe(Role.USER);
  });

  // -------------------------------------------------------------------------
  // 400 — invalid role value
  // -------------------------------------------------------------------------

  it('returns 400 when role is not a valid Role enum value', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/v1/admin/users/user-2/role')
      .send({ role: 'SUPERADMIN' });

    expect(res.status).toBe(400);
    expect(adminService.updateUserRole).not.toHaveBeenCalled();
  });

  it('returns 400 when role field is missing from the body', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/v1/admin/users/user-2/role')
      .send({});

    expect(res.status).toBe(400);
    expect(adminService.updateUserRole).not.toHaveBeenCalled();
  });

  it('returns 400 when role is an empty string', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/v1/admin/users/user-2/role')
      .send({ role: '' });

    expect(res.status).toBe(400);
  });

  // -------------------------------------------------------------------------
  // 400 — admin targeting their own ID
  // -------------------------------------------------------------------------

  it('returns 400 when admin tries to change their own role', async () => {
    (adminService.updateUserRole as jest.Mock).mockRejectedValue(
      new BadRequestException('Cannot change your own role'),
    );

    const res = await request(app.getHttpServer())
      .patch('/api/v1/admin/users/admin-1/role')
      .send({ role: Role.USER });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Cannot change your own role');
  });

  // -------------------------------------------------------------------------
  // 404 — target user not found
  // -------------------------------------------------------------------------

  it('returns 404 when the target user does not exist', async () => {
    (adminService.updateUserRole as jest.Mock).mockRejectedValue(new NotFoundException('User not found'));

    const res = await request(app.getHttpServer())
      .patch('/api/v1/admin/users/ghost-id/role')
      .send({ role: Role.USER });

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('User not found');
  });

  // -------------------------------------------------------------------------
  // 403 — no admin auth
  // -------------------------------------------------------------------------

  it('returns 403 when the request is made without admin credentials', async () => {
    // Simulate a non-admin authenticated user — AdminGuard will throw
    activeUser.value = {
      id: 'regular-user',
      email: 'user@example.com',
      role: Role.USER,
      plan: Plan.LIFETIME,
      mustChangePassword: false,
    };

    const res = await request(app.getHttpServer())
      .patch('/api/v1/admin/users/user-2/role')
      .send({ role: Role.USER });

    expect(res.status).toBe(403);
    expect(adminService.updateUserRole).not.toHaveBeenCalled();
  });

  it('returns 403 when the request is made without any authentication', async () => {
    activeUser.value = null;

    const res = await request(app.getHttpServer())
      .patch('/api/v1/admin/users/user-2/role')
      .send({ role: Role.USER });

    // FakeAuthGuard returns false when activeUser is null → NestJS sends 403
    expect(res.status).toBe(403);
  });
});
