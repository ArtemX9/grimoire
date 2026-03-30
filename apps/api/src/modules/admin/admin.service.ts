import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import * as bcryptjs from 'bcryptjs';

import { PrismaService } from '../../prisma/prisma.service';
import { AdminUserResponse, AdminUserListResponse, AdminStatsResponse } from './admin.types';
import {Role} from '@grimoire/shared';

type PrismaAdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  plan: string;
  mustChangePassword: boolean;
  aiEnabled: boolean;
  aiRequestsUsed: number;
  aiRequestsLimit: number | null;
  createdAt: Date;
  _count: { games: number };
};

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  private _toResponse(user: PrismaAdminUser): AdminUserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name ?? undefined,
      role: user.role,
      plan: user.plan,
      mustChangePassword: user.mustChangePassword,
      aiEnabled: user.aiEnabled,
      aiRequestsUsed: user.aiRequestsUsed,
      aiRequestsLimit: user.aiRequestsLimit,
      gamesCount: user._count.games,
      createdAt: user.createdAt,
    };
  }

  private get userSelect() {
    return {
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
    } as const;
  }

  async setupAdmin(dto: { email: string; password: string; name?: string }): Promise<AdminUserResponse> {
    const count = await this.prisma.user.count();
    if (count > 0) {
      throw new BadRequestException('Setup already completed');
    }

    const hash = await bcryptjs.hash(dto.password, 12);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          role: Role.ADMIN,
          passwordHash: hash,
          mustChangePassword: false,
        },
        select: this.userSelect,
      });

      await tx.account.create({
        data: {
          providerId: 'credential',
          accountId: dto.email,
          password: hash,
          userId: created.id,
        },
      });

      return created;
    });

    return this._toResponse(user);
  }

  async listUsers(page = 1, limit = 20): Promise<AdminUserListResponse> {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        select: this.userSelect,
      }),
      this.prisma.user.count(),
    ]);

    return { data: users.map((u) => this._toResponse(u)), total };
  }

  async createUser(dto: { email: string; password: string; name?: string }): Promise<AdminUserResponse> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const hash = await bcryptjs.hash(dto.password, 12);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          role: Role.ADMIN,
          passwordHash: hash,
          mustChangePassword: true,
        },
        select: this.userSelect,
      });

      await tx.account.create({
        data: {
          providerId: 'credential',
          accountId: dto.email,
          password: hash,
          userId: created.id,
        },
      });

      return created;
    });

    return this._toResponse(user);
  }

  async deleteUser(adminId: string, targetId: string): Promise<void> {
    if (adminId === targetId) {
      throw new BadRequestException('Cannot delete your own account');
    }

    const user = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.delete({ where: { id: targetId } });
  }

  async getStats(): Promise<AdminStatsResponse> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        aiRequestsUsed: true,
        aiRequestsLimit: true,
        _count: { select: { games: true, sessions: true } },
      },
    });

    return {
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name ?? undefined,
        gamesCount: u._count.games,
        sessionsCount: u._count.sessions,
        aiRequestsUsed: u.aiRequestsUsed,
        aiRequestsLimit: u.aiRequestsLimit,
      })),
    };
  }
}
