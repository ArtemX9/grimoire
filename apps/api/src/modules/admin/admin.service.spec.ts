import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import * as bcryptjs from 'bcryptjs';

import { PrismaService } from '../../prisma/prisma.service';
import { AdminService } from './admin.service';

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  plan: true,
  mustChangePassword: true,
  aiEnabled: true,
  aiRequestsUsed: true,
  aiRequestsLimit: true,
  createdAt: true,
  _count: { select: { games: true } },
};

function makeAdminUserRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'user-1',
    email: 'admin@example.com',
    name: 'Admin',
    role: 'ADMIN',
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

describe('AdminService', () => {
  let service: AdminService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              count: jest.fn(),
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              delete: jest.fn(),
            },
            account: {
              create: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prisma = module.get(PrismaService);
  });

  // ---------------------------------------------------------------------------
  // setupAdmin
  // ---------------------------------------------------------------------------

  describe('setupAdmin', () => {
    it('creates the first admin when no users exist', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(0);

      const createdRow = makeAdminUserRow();
      // $transaction receives a callback — execute it with a tx proxy
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          user: { create: jest.fn().mockResolvedValue(createdRow) },
          account: { create: jest.fn().mockResolvedValue({}) },
        };
        return cb(tx);
      });

      const result = await service.setupAdmin({
        email: 'admin@example.com',
        password: 'password123',
        name: 'Admin',
      });

      expect(result.email).toBe('admin@example.com');
      expect(result.role).toBe('ADMIN');
      expect(result.mustChangePassword).toBe(false);
    });

    it('throws BadRequestException when users already exist', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(1);

      await expect(service.setupAdmin({ email: 'admin@example.com', password: 'password123' })).rejects.toThrow(BadRequestException);
    });
  });

  // ---------------------------------------------------------------------------
  // createUser
  // ---------------------------------------------------------------------------

  describe('createUser', () => {
    it('creates a new user with mustChangePassword=true', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const createdRow = makeAdminUserRow({
        id: 'user-2',
        email: 'newuser@example.com',
        role: 'USER',
        mustChangePassword: true,
      });

      (prisma.$transaction as jest.Mock).mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          user: { create: jest.fn().mockResolvedValue(createdRow) },
          account: { create: jest.fn().mockResolvedValue({}) },
        };
        return cb(tx);
      });

      const result = await service.createUser({
        email: 'newuser@example.com',
        password: 'password123',
      });

      expect(result.email).toBe('newuser@example.com');
      expect(result.role).toBe('USER');
      expect(result.mustChangePassword).toBe(true);
    });

    it('throws ConflictException when email is already in use', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(makeAdminUserRow());

      await expect(service.createUser({ email: 'admin@example.com', password: 'password123' })).rejects.toThrow(ConflictException);
    });
  });

  // ---------------------------------------------------------------------------
  // deleteUser
  // ---------------------------------------------------------------------------

  describe('deleteUser', () => {
    it('throws BadRequestException when admin attempts to delete their own account', async () => {
      await expect(service.deleteUser('admin-id', 'admin-id')).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when target user does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.deleteUser('admin-id', 'other-id')).rejects.toThrow(NotFoundException);
    });

    it('deletes the user successfully when found and is not the admin themselves', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(makeAdminUserRow({ id: 'other-id' }));
      (prisma.user.delete as jest.Mock).mockResolvedValue({});

      await expect(service.deleteUser('admin-id', 'other-id')).resolves.toBeUndefined();
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'other-id' } });
    });
  });
});
