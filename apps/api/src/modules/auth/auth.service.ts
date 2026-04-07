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
    const trustedOrigins = (this.config.get<string>('app.cors.origin') ?? 'http://localhost:5173').split(',').map((o) => o.trim());

    this.auth = betterAuth({
      secret: this.config.get<string>('app.auth.secret'),
      baseURL: this.config.get<string>('app.auth.url'),
      trustedOrigins,
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
