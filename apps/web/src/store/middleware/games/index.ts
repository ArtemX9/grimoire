import type { Middleware } from 'redux';

import { GAMES_CREATE_FULFILLED, GAMES_DELETE_FULFILLED, GAMES_UPDATE_FULFILLED } from '@/store/actions/games';

const TRACKED_ACTIONS: Set<string> = new Set([GAMES_CREATE_FULFILLED, GAMES_UPDATE_FULFILLED, GAMES_DELETE_FULFILLED]);

export const gamesMiddleware: Middleware = (_store) => (next) => (action) => {
  const result = next(action);

  if (typeof action === 'object' && action !== null && 'type' in action) {
    const typedAction = action as { type: string };
    if (TRACKED_ACTIONS.has(typedAction.type)) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[games]', typedAction.type);
      }
    }
  }

  return result;
};
