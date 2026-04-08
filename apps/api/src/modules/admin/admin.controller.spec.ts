import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { Role } from '@grimoire/shared';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AdminAiService } from './admin-ai.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminUserResponse } from './admin.types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeAdminUser(overrides: Partial<RequestUser> = {}): RequestUser {
  return { id: 'admin-1', email: 'admin@example.com', name: 'Admin', role: 'ADMIN', plan: 'LIFETIME', ...overrides };
}

function makeAdminUserResponse(overrides: Partial<AdminUserResponse> = {}): AdminUserResponse {
  return {
    id: 'user-2',
    email: 'user@example.com',
    role: 'USER',
    plan: 'FREE',
    mustChangePassword: false,
    aiEnabled: true,
    aiRequestsUsed: 0,
    aiRequestsLimit: null,
    gamesCount: 0,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}

// Minimal RequestUser shape used by the controller
interface RequestUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  plan: string;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: jest.Mocked<AdminService>;

  beforeEach(async () => {
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
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    adminService = module.get(AdminService);

    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // updateUserRole
  // ---------------------------------------------------------------------------

  describe('updateUserRole', () => {
    it('delegates to adminService.updateUserRole with admin user id, target id, and role', async () => {
      const admin = makeAdminUser();
      const updated = makeAdminUserResponse({ role: 'ADMIN' });
      adminService.updateUserRole.mockResolvedValue(updated);

      const result = await controller.updateUserRole(admin as any, 'user-2', { role: Role.ADMIN });

      expect(adminService.updateUserRole).toHaveBeenCalledWith('admin-1', 'user-2', Role.ADMIN);
      expect(result).toBe(updated);
    });

    it('returns the updated user response from the service', async () => {
      const admin = makeAdminUser();
      const updated = makeAdminUserResponse({ role: 'USER' });
      adminService.updateUserRole.mockResolvedValue(updated);

      const result = await controller.updateUserRole(admin as any, 'user-2', { role: Role.USER });

      expect(result).toEqual(updated);
    });

    it('uses the id from the current user as adminUserID — not any other source', async () => {
      const admin = makeAdminUser({ id: 'admin-99' });
      adminService.updateUserRole.mockResolvedValue(makeAdminUserResponse());

      await controller.updateUserRole(admin as any, 'user-2', { role: Role.USER });

      expect(adminService.updateUserRole).toHaveBeenCalledWith('admin-99', 'user-2', Role.USER);
    });

    it('propagates BadRequestException when admin targets their own id', async () => {
      const admin = makeAdminUser({ id: 'admin-1' });
      adminService.updateUserRole.mockRejectedValue(new BadRequestException('Cannot change your own role'));

      await expect(controller.updateUserRole(admin as any, 'admin-1', { role: Role.USER })).rejects.toThrow(BadRequestException);
    });

    it('propagates NotFoundException when the target user does not exist', async () => {
      const admin = makeAdminUser();
      adminService.updateUserRole.mockRejectedValue(new NotFoundException('User not found'));

      await expect(controller.updateUserRole(admin as any, 'ghost-id', { role: Role.USER })).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // UpdateUserRoleSchema validation (via ZodValidationPipe directly)
  // ---------------------------------------------------------------------------

  describe('UpdateUserRoleSchema validation', () => {
    // Exercise the pipe in isolation — the controller unit test bypasses NestJS
    // guards/pipes, so we instantiate the pipe with the same schema the
    // controller uses and verify that invalid values are rejected.

    // Re-import the schema through the pipe as the controller defines it inline.
    // We reach it via the pipe's own transform method with a reconstructed schema.

    it('accepts a valid Role value via ZodValidationPipe', () => {
      const { z } = require('zod');
      const schema = z.object({ role: z.nativeEnum(Role) });
      const pipe = new ZodValidationPipe(schema);

      expect(() => pipe.transform({ role: 'ADMIN' })).not.toThrow();
      expect(() => pipe.transform({ role: 'USER' })).not.toThrow();
    });

    it('rejects an invalid role string via ZodValidationPipe', () => {
      const { z } = require('zod');
      const schema = z.object({ role: z.nativeEnum(Role) });
      const pipe = new ZodValidationPipe(schema);

      expect(() => pipe.transform({ role: 'SUPERADMIN' })).toThrow(BadRequestException);
      expect(() => pipe.transform({ role: '' })).toThrow(BadRequestException);
      expect(() => pipe.transform({ role: 123 })).toThrow(BadRequestException);
      expect(() => pipe.transform({})).toThrow(BadRequestException);
    });

    it('rejects a missing role field via ZodValidationPipe', () => {
      const { z } = require('zod');
      const schema = z.object({ role: z.nativeEnum(Role) });
      const pipe = new ZodValidationPipe(schema);

      expect(() => pipe.transform({ plan: 'FREE' })).toThrow(BadRequestException);
    });
  });
});
