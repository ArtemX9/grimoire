import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import * as bcryptjs from 'bcryptjs';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  public readonly auth: ReturnType<typeof betterAuth>;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.auth = betterAuth({
      secret: this.config.get<string>('app.auth.secret'),
      database: prismaAdapter(this.prisma, { provider: 'postgresql' }),
      emailAndPassword: {
        enabled: true,
        password: {
          hash: doHashing,
          verify: doVerify,
        },
      },
      socialProviders: {},
    }) as ReturnType<typeof betterAuth>;
  }
}

function doHashing(password: string): Promise<string> {
  return bcryptjs.hash(password, 12);
}

function doVerify(data: { hash: string; password: string }): Promise<boolean> {
  return bcryptjs.compare(data.password, data.hash);
}
