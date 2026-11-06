import { GameStatus } from '@grimoire/shared';

import { generateUserGame } from '@/test';

import { buildLibraryCsv, buildLibraryJson } from './exportLibrary';

describe('buildLibraryCsv', () => {
  it('writes a header row and one row per game', () => {
    const games = [generateUserGame(), generateUserGame()];
    const lines = buildLibraryCsv(games).split('\r\n');

    expect(lines[0]).toBe('title,status,playtimeHours,userRating,platforms,genres,moods,releaseDate,addedAt,igdbID,notes');
    expect(lines).toHaveLength(3);
  });

  it('quotes values containing commas, quotes or newlines', () => {
    const game = generateUserGame({ title: 'Ratchet, "Clank"', notes: 'line one\nline two', status: GameStatus.PLAYING });
    const row = buildLibraryCsv([game]).split('\r\n').slice(1).join('\r\n');

    expect(row.startsWith('"Ratchet, ""Clank""",PLAYING,')).toBe(true);
    expect(row).toContain('"line one\nline two"');
  });
});

describe('buildLibraryJson', () => {
  it('wraps games with export metadata', () => {
    const games = [generateUserGame()];
    const parsed = JSON.parse(buildLibraryJson(games, new Date('2026-11-04T00:00:00Z')));

    expect(parsed).toMatchObject({ app: 'grimoire', version: 1, exportedAt: '2026-11-04T00:00:00.000Z' });
    expect(parsed.games).toHaveLength(1);
  });
});
