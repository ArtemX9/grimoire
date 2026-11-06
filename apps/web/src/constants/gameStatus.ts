import { GameStatus } from '@grimoire/shared';

export const GAME_STATUS_STYLES: Record<GameStatus, string> = {
  PLAYING: 'bg-grimoire-status-playing-bg text-grimoire-status-playing-text',
  BACKLOG: 'bg-grimoire-status-backlog-bg text-grimoire-status-backlog-text',
  COMPLETED: 'bg-grimoire-status-completed-bg text-grimoire-status-completed-text',
  DROPPED: 'bg-grimoire-status-dropped-bg text-grimoire-status-dropped-text',
  WISHLIST: 'bg-grimoire-status-wishlist-bg text-grimoire-status-wishlist-text',
};

export const GAME_STATUS_LABELS: Record<GameStatus, string> = {
  PLAYING: 'Playing',
  BACKLOG: 'Backlog',
  COMPLETED: 'Completed',
  DROPPED: 'Dropped',
  WISHLIST: 'Wishlist',
};
