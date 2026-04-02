import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';

import * as bcryptjs from 'bcryptjs';

import { PrismaService } from '../../prisma/prisma.service';
import { UserResponse } from './users.types';

type PrismaUser = {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  role: string;
  mustChangePassword: boolean;
  aiEnabled: boolean;
  aiRequestsLimit: number | null;
  stripeId: string | null;
  createdAt: Date;
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private _toResponse(user: PrismaUser): UserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name ?? undefined,
      plan: user.plan,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      aiEnabled: user.aiEnabled,
      aiRequestsLimit: user.aiRequestsLimit,
      createdAt: user.createdAt,
    };
  }

  async findById(id: string): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        role: true,
        mustChangePassword: true,
        aiEnabled: true,
        aiRequestsLimit: true,
        stripeId: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return this._toResponse(user);
  }

  async findByEmail(email: string): Promise<UserResponse | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        role: true,
        mustChangePassword: true,
        aiEnabled: true,
        aiRequestsLimit: true,
        stripeId: true,
        createdAt: true,
      },
    });
    return user ? this._toResponse(user) : null;
  }

  async updateProfile(id: string, data: { name?: string }): Promise<UserResponse> {
    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        role: true,
        mustChangePassword: true,
        aiEnabled: true,
        aiRequestsLimit: true,
        stripeId: true,
        createdAt: true,
      },
    });
    return this._toResponse(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, passwordHash: true },
    });
    if (!user) throw new NotFoundException('User not found');

    if (!user.passwordHash || !(await bcryptjs.compare(currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newHash = await bcryptjs.hash(newPassword, 12);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { passwordHash: newHash, mustChangePassword: false },
      });

      // Keep Better Auth credential store in sync
      await tx.account.updateMany({
        where: { userId, providerId: 'credential' },
        data: { password: newHash },
      });
    });
  }
}
