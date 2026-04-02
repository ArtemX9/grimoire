import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import * as bcryptjs from 'bcryptjs';

import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from './users.service';

// bcryptjs is an ESM-compatible CJS module — mock the compare/hash functions
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const mockedBcrypt = bcryptjs as jest.Mocked<typeof bcryptjs>;

function makeUserRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'user-1',
    email: 'user@example.com',
    passwordHash: 'hashed-password',
    ...overrides,
  };
}

describe('UsersService.changePassword', () => {
  let service: UsersService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            account: {
              updateMany: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  it('throws UnauthorizedException when current password is wrong', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUserRow({ passwordHash: 'hashed-old-password' }));
    mockedBcrypt.compare.mockResolvedValue(false as never);

    await expect(service.changePassword('user-1', 'wrong-password', 'new-password-123')).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when the user has no passwordHash', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUserRow({ passwordHash: null }));
    mockedBcrypt.compare.mockResolvedValue(false as never);

    await expect(service.changePassword('user-1', 'any-password', 'new-password-123')).rejects.toThrow(UnauthorizedException);
  });

  it('throws NotFoundException when user does not exist', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.changePassword('nonexistent', 'any-password', 'new-password-123')).rejects.toThrow(NotFoundException);
  });

  it('updates the password and clears mustChangePassword on success', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUserRow({ passwordHash: 'hashed-old' }));
    mockedBcrypt.compare.mockResolvedValue(true as never);
    mockedBcrypt.hash.mockResolvedValue('hashed-new' as never);

    // Capture the tx mock so we can assert against it after the call
    const txUserUpdate = jest.fn().mockResolvedValue({});
    const txAccountUpdateMany = jest.fn().mockResolvedValue({});

    (prisma.$transaction as jest.Mock).mockImplementation(async (cb: (tx: unknown) => Promise<void>) => {
      const tx = {
        user: { update: txUserUpdate },
        account: { updateMany: txAccountUpdateMany },
      };
      await cb(tx);
    });

    await service.changePassword('user-1', 'correct-password', 'new-password-123');

    expect(mockedBcrypt.hash).toHaveBeenCalledWith('new-password-123', 12);

    expect(txUserUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { passwordHash: 'hashed-new', mustChangePassword: false },
    });
    expect(txAccountUpdateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', providerId: 'credential' },
      data: { password: 'hashed-new' },
    });
  });
});
