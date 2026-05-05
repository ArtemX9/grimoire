import * as fs from 'fs';
import * as path from 'path';

import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import * as pg from 'pg';

import { PrismaClient } from '../src/generated/prisma/client';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
  status: string;
  playtimeHours: number;
  userRating?: number | null;
  notes?: string | null;
  moods: string[];
  sessions?: DemoSession[];
}

const EXCLUDE_EMAILS = ['demo@grimoire.app'];
const EXCLUDE_SUFFIX = '@grimoire.test';

async function main() {
  // Find all non-demo, non-test users with game counts
  const users = await prisma.user.findMany({
    where: {
      AND: [{ email: { notIn: EXCLUDE_EMAILS } }, { email: { not: { endsWith: EXCLUDE_SUFFIX } } }],
    },
    select: {
      id: true,
      email: true,
      _count: { select: { games: true } },
    },
    orderBy: { email: 'asc' },
  });

  if (users.length === 0) {
    console.log('No eligible users found. Nothing to export.');
    return;
  }

  console.log('Eligible users:');
  for (const u of users) {
    console.log(`  ${u.email} — ${u._count.games} game(s)`);
  }

  // Pick the user with the most games
  const target = users.reduce((best, u) => (u._count.games > best._count.games ? u : best), users[0]);
  console.log(`\nExporting library for: ${target.email} (${target._count.games} games)`);

  // Fetch all UserGames with IGDBGame and PlaySessions
  const userGames = await prisma.userGame.findMany({
    where: { userId: target.id },
    include: {
      igdbGame: true,
      sessions: {
        orderBy: { startedAt: 'asc' },
      },
    },
    orderBy: { addedAt: 'asc' },
  });

  const totalSessions = userGames.reduce((sum, g) => sum + g.sessions.length, 0);

  const demoGames: DemoGame[] = userGames.map((ug) => {
    const sessions: DemoSession[] = ug.sessions.map((s) => ({
      startedAt: s.startedAt.toISOString(),
      durationMin: s.durationMin ?? 0,
      mood: s.mood,
      notes: s.notes ?? null,
    }));

    return {
      igdbId: ug.igdbGame.igdbId,
      title: ug.igdbGame.title,
      coverUrl: ug.igdbGame.coverUrl ?? null,
      genres: ug.igdbGame.genres,
      summary: ug.igdbGame.summary ?? null,
      releaseDate: ug.igdbGame.releaseDate ? ug.igdbGame.releaseDate.toISOString() : null,
      status: ug.status,
      playtimeHours: ug.playtimeHours,
      userRating: ug.userRating ?? null,
      notes: ug.notes ?? null,
      moods: ug.moods,
      sessions: sessions.length > 0 ? sessions : undefined,
    };
  });

  const outPath = path.join(__dirname, 'demo-seed-data.json');
  fs.writeFileSync(outPath, JSON.stringify(demoGames, null, 2) + '\n', 'utf-8');

  console.log(`\nExport complete:`);
  console.log(`  User:     ${target.email}`);
  console.log(`  Games:    ${demoGames.length}`);
  console.log(`  Sessions: ${totalSessions}`);
  console.log(`  Output:   ${outPath}`);
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
