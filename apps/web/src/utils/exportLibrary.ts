import { UserGame } from '@grimoire/shared';

export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
}

const CSV_COLUMNS = [
  'title',
  'status',
  'playtimeHours',
  'userRating',
  'platforms',
  'genres',
  'moods',
  'releaseDate',
  'addedAt',
  'igdbID',
  'notes',
] as const;

type CsvColumn = (typeof CSV_COLUMNS)[number];

function toCsvValue(game: UserGame, column: CsvColumn): string {
  switch (column) {
    case 'platforms':
      return game.platforms.map((p) => p.platformName).join('; ');
    case 'genres':
      return game.genres.join('; ');
    case 'moods':
      return game.moods.join('; ');
    case 'releaseDate':
      return game.releaseDate ? new Date(game.releaseDate).toISOString().slice(0, 10) : '';
    case 'addedAt':
      return new Date(game.addedAt).toISOString();
    default:
      return game[column] === undefined || game[column] === null ? '' : String(game[column]);
  }
}

function escapeCsv(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function buildLibraryCsv(games: UserGame[]): string {
  const header = CSV_COLUMNS.join(',');
  const rows = games.map((game) => CSV_COLUMNS.map((column) => escapeCsv(toCsvValue(game, column))).join(','));
  return [header, ...rows].join('\r\n');
}

export function buildLibraryJson(games: UserGame[], exportedAt: Date = new Date()): string {
  return JSON.stringify({ app: 'grimoire', version: 1, exportedAt: exportedAt.toISOString(), games }, null, 2);
}

export function downloadLibrary(games: UserGame[], format: ExportFormat) {
  const content = format === ExportFormat.CSV ? buildLibraryCsv(games) : buildLibraryJson(games);
  const mime = format === ExportFormat.CSV ? 'text/csv;charset=utf-8' : 'application/json';
  const blob = new Blob([format === ExportFormat.CSV ? '﻿' + content : content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `grimoire-library-${new Date().toISOString().slice(0, 10)}.${format}`;
  link.click();
  URL.revokeObjectURL(url);
}
