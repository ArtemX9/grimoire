import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcryptjs from 'bcryptjs';
import * as pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const REGULAR_USER = { email: 'test@grimoire.test', password: 'password123', name: 'Test User' };
const REGULAR_USER_2 = { email: 'test2@grimoire.test', password: 'password123', name: 'Test User 2' };
const ADMIN_USER = { email: 'admin@grimoire.test', password: 'password123', name: 'Admin User' };

async function upsertUser(
  email: string,
  name: string,
  passwordHash: string,
  role: 'USER' | 'ADMIN',
  plan: 'FREE' | 'LIFETIME',
  mustChangePassword: boolean,
) {
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name,
      role,
      plan,
      passwordHash,
      mustChangePassword,
    },
  });

  await prisma.account.upsert({
    where: { providerId_accountId: { providerId: 'credential', accountId: email } },
    update: {},
    create: {
      providerId: 'credential',
      accountId: email,
      password: passwordHash,
      userId: user.id,
    },
  });

  return user;
}

async function main() {
  const [regularHash, regular2Hash, adminHash] = await Promise.all([
    bcryptjs.hash(REGULAR_USER.password, 12),
    bcryptjs.hash(REGULAR_USER_2.password, 12),
    bcryptjs.hash(ADMIN_USER.password, 12),
  ]);

  const regularUser = await upsertUser(
    REGULAR_USER.email,
    REGULAR_USER.name,
    regularHash,
    'USER',
    'FREE',
    false,
  );

  const regularUser2 = await upsertUser(
    REGULAR_USER_2.email,
    REGULAR_USER_2.name,
    regular2Hash,
    'USER',
    'FREE',
    false,
  );

  await upsertUser(
    ADMIN_USER.email,
    ADMIN_USER.name,
    adminHash,
    'ADMIN',
    'LIFETIME',
    false,
  );

  // Seed one game for user 1 so library → detail navigation has a target
  const hollowKnight = await prisma.userGame.upsert({
    where: { userId_igdbId: { userId: regularUser.id, igdbId: 1177 } },
    update: {},
    create: {
      userId: regularUser.id,
      igdbId: 1177,
      title: 'Hollow Knight',
      coverUrl: '//images.igdb.com/igdb/image/upload/t_cover_big/co1rgi.jpg',
      genres: ['Platformer', 'Adventure'],
      status: 'BACKLOG',
      moods: [],
    },
  });

  // Seed a distinct game for user 2 so data-isolation tests can assert cross-user visibility
  const celeste = await prisma.userGame.upsert({
    where: { userId_igdbId: { userId: regularUser2.id, igdbId: 26765 } },
    update: {},
    create: {
      userId: regularUser2.id,
      igdbId: 26765,
      title: 'Celeste',
      coverUrl: '//images.igdb.com/igdb/image/upload/t_cover_big/co1tmu.jpg',
      genres: ['Platformer', 'Adventure'],
      status: 'COMPLETED',
      moods: [],
    },
  });

  // Seed a PlaySession for user 1 (Hollow Knight) — idempotent via findFirst guard
  const existingSession1 = await prisma.playSession.findFirst({
    where: { userId: regularUser.id, gameId: hollowKnight.id },
  });
  if (!existingSession1) {
    await prisma.playSession.create({
      data: {
        userId: regularUser.id,
        gameId: hollowKnight.id,
        startedAt: new Date('2024-01-15T10:00:00Z'),
        endedAt: new Date('2024-01-15T12:00:00Z'),
        durationMin: 120,
        mood: ['focused'],
      },
    });
  }

  // Seed a PlaySession for user 2 (Celeste) — different date and mood for clear distinction
  const existingSession2 = await prisma.playSession.findFirst({
    where: { userId: regularUser2.id, gameId: celeste.id },
  });
  if (!existingSession2) {
    await prisma.playSession.create({
      data: {
        userId: regularUser2.id,
        gameId: celeste.id,
        startedAt: new Date('2024-02-20T18:00:00Z'),
        endedAt: new Date('2024-02-20T19:30:00Z'),
        durationMin: 90,
        mood: ['relaxed'],
      },
    });
  }

  console.log('Seed complete:');
  console.log(`  Regular user:   ${REGULAR_USER.email} / ${REGULAR_USER.password}`);
  console.log(`  Regular user 2: ${REGULAR_USER_2.email} / ${REGULAR_USER_2.password}`);
  console.log(`  Admin user:     ${ADMIN_USER.email} / ${ADMIN_USER.password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
