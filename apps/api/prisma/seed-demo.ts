import { PrismaPg } from '@prisma/adapter-pg';
import * as bcryptjs from 'bcryptjs';
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import * as pg from 'pg';

import { GameStatus, Plan, Role } from '@grimoire/shared';

import { PlatformTitle, PrismaClient } from '../src/generated/prisma/client';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DEMO_EMAIL = 'demo@grimoire.app';
const DEMO_PASSWORD = 'demo1234';
const DEMO_NAME = 'Demo User';

interface DemoSession {
  startedAt: string;
  durationMin: number;
  mood: string[];
  notes?: string | null;
}

interface DemoGame {
  igdbId: number;
  title: string;
  coverUrl?: string | null;
  genres: string[];
  summary?: string | null;
  releaseDate?: string | null;
  status: GameStatus;
  playtimeHours: number;
  userRating?: number | null;
  notes?: string | null;
  moods: string[];
  sessions?: DemoSession[];
}

async function main() {
  // Ensure platform lookup table exists
  await prisma.platforms.createMany({
    data: Object.values(PlatformTitle).map((platform) => ({ platform })),
    skipDuplicates: true,
  });

  // Upsert the demo user
  const passwordHash = await bcryptjs.hash(DEMO_PASSWORD, 12);

  const demo = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL,
      name: DEMO_NAME,
      role: Role.USER,
      plan: Plan.PRO,
      isDemo: true,
      passwordHash,
      emailVerified: true,
      aiEnabled: true,
      aiRequestsLimit: null,
    },
  });

  await prisma.account.upsert({
    where: { providerId_accountId: { providerId: 'credential', accountId: DEMO_EMAIL } },
    update: {},
    create: {
      providerId: 'credential',
      accountId: DEMO_EMAIL,
      password: passwordHash,
      userId: demo.id,
    },
  });

  // Clear existing library and sessions (sessions cascade via UserGame)
  await prisma.userGame.deleteMany({ where: { userId: demo.id } });
  await prisma.unmappedSyncedGame.deleteMany({ where: { userId: demo.id } });
  await prisma.userPlatform.deleteMany({ where: { userId: demo.id } });

  // Reset AI usage counter
  await prisma.user.update({
    where: { id: demo.id },
    data: { aiRequestsUsed: 0 },
  });

  // Load snapshot
  const dataPath = path.join(__dirname, '../scripts/demo-seed-data.json');
  const games: DemoGame[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  if (games.length === 0) {
    console.log('demo-seed-data.json is empty — skipping game import.');
    console.log(`  Demo user created: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
    return;
  }

  for (const game of games) {
    // Upsert IGDB game record
    const igdbGame = await prisma.iGDBGame.upsert({
      where: { igdbId: game.igdbId },
      update: {
        title: game.title,
        coverUrl: game.coverUrl ?? null,
        genres: game.genres,
        summary: game.summary ?? null,
        releaseDate: game.releaseDate ? new Date(game.releaseDate) : null,
      },
      create: {
        igdbId: game.igdbId,
        title: game.title,
        coverUrl: game.coverUrl ?? null,
        genres: game.genres,
        summary: game.summary ?? null,
        releaseDate: game.releaseDate ? new Date(game.releaseDate) : null,
      },
    });

    // Create UserGame (library is wiped above so no conflict)
    const userGame = await prisma.userGame.create({
      data: {
        userId: demo.id,
        igdbGameId: igdbGame.id,
        status: game.status,
        playtimeHours: game.playtimeHours,
        userRating: game.userRating ?? null,
        notes: game.notes ?? null,
        moods: game.moods,
      },
    });

    // Create play sessions
    for (const session of game.sessions ?? []) {
      await prisma.playSession.create({
        data: {
          userId: demo.id,
          gameId: userGame.id,
          startedAt: new Date(session.startedAt),
          durationMin: session.durationMin,
          mood: session.mood,
          notes: session.notes ?? null,
        },
      });
    }
  }

  console.log(`Seeded ${games.length} games for demo account.`);
  console.log(`  Demo user: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
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
