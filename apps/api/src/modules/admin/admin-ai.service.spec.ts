import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';
import { AdminAiService } from './admin-ai.service';

function makeUserRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'user-1',
    email: 'user@example.com',
    name: 'User',
    role: 'USER',
    plan: 'FREE',
    mustChangePassword: false,
    aiEnabled: true,
    aiRequestsUsed: 0,
    aiRequestsLimit: null,
    createdAt: new Date('2024-01-01'),
    _count: { games: 0 },
    ...overrides,
  };
}

describe('AdminAiService', () => {
  let service: AdminAiService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAiService,
        {
          provide: PrismaService,
          useValue: {
            aiGlobalSettings: {
              findUnique: jest.fn(),
              upsert: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AdminAiService>(AdminAiService);
    prisma = module.get(PrismaService);
  });

  // ---------------------------------------------------------------------------
  // updateSettings — global toggle
  // ---------------------------------------------------------------------------

  describe('updateSettings', () => {
    it('updates globalEnabled and returns the new state', async () => {
      (prisma.aiGlobalSettings.upsert as jest.Mock).mockResolvedValue({ id: 1, aiEnabled: false });
      (prisma.aiGlobalSettings.findUnique as jest.Mock).mockResolvedValue({ id: 1, aiEnabled: false });

      const result = await service.updateSettings({ globalEnabled: false });

      expect(prisma.aiGlobalSettings.upsert).toHaveBeenCalledWith({
        where: { id: 1 },
        update: { aiEnabled: false },
        create: { id: 1, aiEnabled: false },
      });
      expect(result.globalEnabled).toBe(false);
      expect(result.updatedUser).toBeUndefined();
    });

    it('updates per-user AI enabled flag', async () => {
      const updatedRow = makeUserRow({ aiEnabled: false });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUserRow());
      (prisma.user.update as jest.Mock).mockResolvedValue(updatedRow);
      (prisma.aiGlobalSettings.findUnique as jest.Mock).mockResolvedValue({ id: 1, aiEnabled: true });

      const result = await service.updateSettings({ userId: 'user-1', userEnabled: false });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: expect.objectContaining({ aiEnabled: false }),
        }),
      );
      expect(result.updatedUser?.aiEnabled).toBe(false);
    });

    it('updates per-user AI request limit', async () => {
      const updatedRow = makeUserRow({ aiRequestsLimit: 50 });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUserRow());
      (prisma.user.update as jest.Mock).mockResolvedValue(updatedRow);
      (prisma.aiGlobalSettings.findUnique as jest.Mock).mockResolvedValue({ id: 1, aiEnabled: true });

      const result = await service.updateSettings({ userId: 'user-1', userLimit: 50 });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: expect.objectContaining({ aiRequestsLimit: 50 }),
        }),
      );
      expect(result.updatedUser?.aiRequestsLimit).toBe(50);
    });

    it('throws NotFoundException when userId does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.updateSettings({ userId: 'nonexistent', userEnabled: true })).rejects.toThrow(NotFoundException);
    });
  });
});
