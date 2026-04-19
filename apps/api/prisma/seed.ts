import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import * as bcryptjs from 'bcryptjs';
import * as pg from 'pg';
import { GameStatus, Genre, Mood, Plan, Role } from '@grimoire/shared';
import { PlatformTitle } from '../src/generated/prisma/client';

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
  role: Role,
  plan: Plan,
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
  // Seed platform lookup table
  await prisma.platforms.createMany({
    data: Object.values(PlatformTitle).map((platform) => ({ platform })),
    skipDuplicates: true,
  });

  const [regularHash, regular2Hash, adminHash] = await Promise.all([
    bcryptjs.hash(REGULAR_USER.password, 12),
    bcryptjs.hash(REGULAR_USER_2.password, 12),
    bcryptjs.hash(ADMIN_USER.password, 12),
  ]);

  const regularUser = await upsertUser(
    REGULAR_USER.email,
    REGULAR_USER.name,
    regularHash,
    Role.USER,
    Plan.FREE,
    false,
  );

  const regularUser2 = await upsertUser(
    REGULAR_USER_2.email,
    REGULAR_USER_2.name,
    regular2Hash,
    Role.USER,
    Plan.FREE,
    false,
  );

  await upsertUser(
    ADMIN_USER.email,
    ADMIN_USER.name,
    adminHash,
    Role.ADMIN,
    Plan.LIFETIME,
    false,
  );

  // Seed IGDB game records
  const hollowKnightIgdb = await prisma.iGDBGame.upsert({
    where: { igdbId: 1177 },
    update: {},
    create: {
      igdbId: 1177,
      title: 'Hollow Knight',
      coverUrl: '//images.igdb.com/igdb/image/upload/t_cover_big/co1rgi.jpg',
      genres: [Genre.Platformer, Genre.Adventure],
    },
  });

  const celesteIgdb = await prisma.iGDBGame.upsert({
    where: { igdbId: 26765 },
    update: {},
    create: {
      igdbId: 26765,
      title: 'Celeste',
      coverUrl: '//images.igdb.com/igdb/image/upload/t_cover_big/co1tmu.jpg',
      genres: [Genre.Platformer, Genre.Adventure],
    },
  });

  // Seed one game for user 1 so library → detail navigation has a target
  const hollowKnight = await prisma.userGame.upsert({
    where: { userId_igdbGameId: { userId: regularUser.id, igdbGameId: hollowKnightIgdb.id } },
    update: {},
    create: {
      userId: regularUser.id,
      igdbGameId: hollowKnightIgdb.id,
      status: GameStatus.BACKLOG,
      moods: [],
    },
  });

  // Seed a distinct game for user 2 so data-isolation tests can assert cross-user visibility
  const celeste = await prisma.userGame.upsert({
    where: { userId_igdbGameId: { userId: regularUser2.id, igdbGameId: celesteIgdb.id } },
    update: {},
    create: {
      userId: regularUser2.id,
      igdbGameId: celesteIgdb.id,
      status: GameStatus.COMPLETED,
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
        durationMin: 120,
        mood: [Mood.FOCUSED],
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
        durationMin: 90,
        mood: [Mood.Relaxed],
      },
    });
  }

  // Seed UnmappedSyncedGame records for E2E tests (test@grimoire.test)
  const steamPlatform = await prisma.platforms.findFirstOrThrow({ where: { platform: PlatformTitle.STEAM } });

  const syncedGame1 = await prisma.syncedGame.upsert({
    where: { platformId_externalId: { platformId: steamPlatform.id, externalId: '413150' } },
    update: {},
    create: {
      platformId: steamPlatform.id,
      externalId: '413150',
      externalTitle: 'Stardew Valley',
      coverUrl: null,
    },
  });

  const syncedGame2 = await prisma.syncedGame.upsert({
    where: { platformId_externalId: { platformId: steamPlatform.id, externalId: '1145360' } },
    update: {},
    create: {
      platformId: steamPlatform.id,
      externalId: '1145360',
      externalTitle: 'Hades II',
      coverUrl: null,
    },
  });

  // UnmappedSyncedGame 1: NO_MATCH
  const existingUnmapped1 = await prisma.unmappedSyncedGame.findFirst({
    where: { userId: regularUser.id, syncedGameId: syncedGame1.id },
  });
  if (!existingUnmapped1) {
    await prisma.unmappedSyncedGame.create({
      data: {
        userId: regularUser.id,
        syncedGameId: syncedGame1.id,
        reason: 'NO_MATCH',
        playtimeHours: 5,
        isMapped: false,
      },
    });
  }

  // UnmappedSyncedGame 2: LOW_CONFIDENCE
  const existingUnmapped2 = await prisma.unmappedSyncedGame.findFirst({
    where: { userId: regularUser.id, syncedGameId: syncedGame2.id },
  });
  if (!existingUnmapped2) {
    await prisma.unmappedSyncedGame.create({
      data: {
        userId: regularUser.id,
        syncedGameId: syncedGame2.id,
        reason: 'LOW_CONFIDENCE',
        playtimeHours: 10.5,
        isMapped: false,
      },
    });
  }

  console.log('Seed complete:');
  console.log(`  Regular user:   ${REGULAR_USER.email} / ${REGULAR_USER.password}`);
  console.log(`  Regular user 2: ${REGULAR_USER_2.email} / ${REGULAR_USER_2.password}`);
  console.log(`  Admin user:     ${ADMIN_USER.email} / ${ADMIN_USER.password}`);
  console.log('  Unresolved games seeded for test@grimoire.test (Stardew Valley: NO_MATCH, Hades II: LOW_CONFIDENCE)');
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
