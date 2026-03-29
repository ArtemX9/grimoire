import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { AiSettingsResponse, AdminUserResponse } from './admin.types';

@Injectable()
export class AdminAiService {
  constructor(private prisma: PrismaService) {}

  async getGlobalSettings(): Promise<{ aiEnabled: boolean }> {
    const settings = await this.prisma.aiGlobalSettings.findUnique({ where: { id: 1 } });
    return { aiEnabled: settings?.aiEnabled ?? true };
  }

  async updateSettings(dto: {
    globalEnabled?: boolean;
    userId?: string;
    userEnabled?: boolean;
    userLimit?: number | null;
  }): Promise<AiSettingsResponse> {
    const ops: Promise<unknown>[] = [];

    if (dto.globalEnabled !== undefined) {
      ops.push(
        this.prisma.aiGlobalSettings.upsert({
          where: { id: 1 },
          update: { aiEnabled: dto.globalEnabled },
          create: { id: 1, aiEnabled: dto.globalEnabled },
        }),
      );
    }

    let updatedUser: AdminUserResponse | undefined;

    if (dto.userId !== undefined) {
      const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
      if (!user) throw new NotFoundException('User not found');

      const updated = await this.prisma.user.update({
        where: { id: dto.userId },
        data: {
          ...(dto.userEnabled !== undefined ? { aiEnabled: dto.userEnabled } : {}),
          ...(dto.userLimit !== undefined ? { aiRequestsLimit: dto.userLimit } : {}),
        },
        select: {
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
        },
      });

      updatedUser = {
        id: updated.id,
        email: updated.email,
        name: updated.name ?? undefined,
        role: updated.role,
        plan: updated.plan,
        mustChangePassword: updated.mustChangePassword,
        aiEnabled: updated.aiEnabled,
        aiRequestsUsed: updated.aiRequestsUsed,
        aiRequestsLimit: updated.aiRequestsLimit,
        gamesCount: updated._count.games,
        createdAt: updated.createdAt,
      };
    }

    await Promise.all(ops);

    const globalSettings = await this.prisma.aiGlobalSettings.findUnique({ where: { id: 1 } });

    return {
      globalEnabled: globalSettings?.aiEnabled ?? true,
      updatedUser,
    };
  }

  async updateUserAiSettings(
    userId: string,
    dto: { aiEnabled: boolean; aiRequestsLimit: number | null },
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id: userId },
      data: { aiEnabled: dto.aiEnabled, aiRequestsLimit: dto.aiRequestsLimit },
    });
  }
}
