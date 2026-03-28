import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { UserResponse } from './users.types';

type PrismaUser = {
  id: string;
  email: string;
  name: string | null;
  plan: string;
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
      createdAt: user.createdAt,
    };
  }

  async findById(id: string): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this._toResponse(user);
  }

  async findByEmail(email: string): Promise<UserResponse | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user ? this._toResponse(user) : null;
  }

  async updateProfile(id: string, data: { name?: string }): Promise<UserResponse> {
    const user = await this.prisma.user.update({ where: { id }, data });
    return this._toResponse(user);
  }
}
