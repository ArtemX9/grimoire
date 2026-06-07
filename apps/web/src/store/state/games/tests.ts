import { AsyncStatus, GameStatus } from '@grimoire/shared';
import { describe, expect, it } from 'vitest';

import {
  GAMES_CREATE_FULFILLED,
  GAMES_DELETE_FULFILLED,
  GAMES_GET_ALL_FULFILLED,
  GAMES_GET_ALL_PENDING,
  GAMES_GET_ALL_REJECTED,
  GAMES_GET_ONE_FULFILLED,
  GAMES_GET_ONE_PENDING,
  GAMES_UPDATE_FULFILLED,
  gamesCreateFulfilled,
  gamesDeleteFulfilled,
  gamesGetAllFulfilled,
  gamesGetAllPending,
  gamesGetAllRejected,
  gamesGetOneFulfilled,
  gamesGetOnePending,
  gamesUpdateFulfilled,
} from '@/store/actions/games';
import reducer, { GAMES_SLICE, GamesState } from '@/store/state/games/index';
import {
  selectAiEligibleGames,
  selectFilteredGames,
  selectGameById,
  selectGames,
  selectGamesStatus,
  selectIsGamesLoading,
} from '@/store/state/games/selectors';
import { generateUserGame } from '@/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const initialState = reducer(undefined, { type: '@@INIT' } as never);

const defaultFilters = {
  status: null,
  genre: null,
  platform: null,
  search: '',
  sortBy: null,
  order: 'asc' as const,
};

function makeRootState(overrides: Partial<GamesState> = {}, filtersOverrides = {}) {
  return {
    [GAMES_SLICE]: { ...initialState, ...overrides },
    filters: { ...defaultFilters, ...filtersOverrides },
  };
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('gamesSlice — initial state', () => {
  it('has empty games array', () => {
    expect(initialState.games).toEqual([]);
  });

  it('has null selectedGame', () => {
    expect(initialState.selectedGame).toBeNull();
  });

  it('has Idle gamesStatus', () => {
    expect(initialState.gamesStatus).toBe(AsyncStatus.Idle);
  });
});

// ---------------------------------------------------------------------------
// Thunk type constants
// ---------------------------------------------------------------------------

describe('games action type constants', () => {
  it('getGames has correct type strings', () => {
    expect(GAMES_GET_ALL_PENDING).toBe('games/getAll/pending');
    expect(GAMES_GET_ALL_FULFILLED).toBe('games/getAll/fulfilled');
    expect(GAMES_GET_ALL_REJECTED).toBe('games/getAll/rejected');
  });

  it('getGame has correct type strings', () => {
    expect(GAMES_GET_ONE_PENDING).toBe('games/getOne/pending');
    expect(GAMES_GET_ONE_FULFILLED).toBe('games/getOne/fulfilled');
  });

  it('createGame has correct type strings', () => {
    expect(GAMES_CREATE_FULFILLED).toBe('games/create/fulfilled');
  });

  it('updateGame has correct type strings', () => {
    expect(GAMES_UPDATE_FULFILLED).toBe('games/update/fulfilled');
  });

  it('deleteGame has correct type strings', () => {
    expect(GAMES_DELETE_FULFILLED).toBe('games/delete/fulfilled');
  });
});

// ---------------------------------------------------------------------------
// getGames lifecycle
// ---------------------------------------------------------------------------

describe('gamesSlice — getGames', () => {
  it('sets gamesStatus Loading on pending', () => {
    const next = reducer(initialState, gamesGetAllPending());
    expect(next.gamesStatus).toBe(AsyncStatus.Loading);
  });

  it('populates games and Succeeded on fulfilled', () => {
    const games = [generateUserGame(), generateUserGame()];
    const next = reducer(initialState, gamesGetAllFulfilled(games));
    expect(next.games).toHaveLength(2);
    expect(next.gamesStatus).toBe(AsyncStatus.Succeeded);
  });

  it('sets Failed on rejected', () => {
    const next = reducer(initialState, gamesGetAllRejected('Not found'));
    expect(next.gamesStatus).toBe(AsyncStatus.Failed);
    expect(next.error).toBe('Not found');
  });
});

// ---------------------------------------------------------------------------
// getGame lifecycle
// ---------------------------------------------------------------------------

describe('gamesSlice — getGame', () => {
  it('sets selectedGameStatus to Loading on pending', () => {
    const next = reducer(initialState, gamesGetOnePending());
    expect(next.selectedGameStatus).toBe(AsyncStatus.Loading);
  });

  it('sets selectedGame on fulfilled', () => {
    const game = generateUserGame();
    const next = reducer(initialState, gamesGetOneFulfilled(game));
    expect(next.selectedGame).toEqual(game);
  });
});

// ---------------------------------------------------------------------------
// createGame lifecycle
// ---------------------------------------------------------------------------

describe('gamesSlice — createGame', () => {
  it('appends new game to games array', () => {
    const existing = generateUserGame();
    const withGames = reducer(initialState, gamesGetAllFulfilled([existing]));
    const newGame = generateUserGame();
    const next = reducer(withGames, gamesCreateFulfilled(newGame));
    expect(next.games).toHaveLength(2);
    expect(next.games[1]).toEqual(newGame);
  });
});

// ---------------------------------------------------------------------------
// updateGame lifecycle
// ---------------------------------------------------------------------------

describe('gamesSlice — updateGame', () => {
  it('replaces game in array on fulfilled', () => {
    const game = generateUserGame({ id: 'game-1', status: GameStatus.BACKLOG });
    const withGame = reducer(initialState, gamesGetAllFulfilled([game]));
    const updated = { ...game, status: GameStatus.PLAYING };
    const next = reducer(withGame, gamesUpdateFulfilled(updated));
    expect(next.games[0].status).toBe(GameStatus.PLAYING);
  });

  it('updates selectedGame if it matches the updated game', () => {
    const game = generateUserGame({ id: 'game-1' });
    let state = reducer(initialState, gamesGetAllFulfilled([game]));
    state = reducer(state, gamesGetOneFulfilled(game));
    const updated = { ...game, status: GameStatus.COMPLETED };
    const next = reducer(state, gamesUpdateFulfilled(updated));
    expect(next.selectedGame?.status).toBe(GameStatus.COMPLETED);
  });
});

// ---------------------------------------------------------------------------
// deleteGame lifecycle
// ---------------------------------------------------------------------------

describe('gamesSlice — deleteGame', () => {
  it('removes game from array on fulfilled', () => {
    const game = generateUserGame({ id: 'game-del' });
    const withGame = reducer(initialState, gamesGetAllFulfilled([game]));
    const next = reducer(withGame, gamesDeleteFulfilled('game-del'));
    expect(next.games).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

describe('selectFilteredGames', () => {
  it('returns all games when no filters active', () => {
    const games = [generateUserGame(), generateUserGame()];
    const state = makeRootState({ games });
    expect(selectFilteredGames(state as never)).toHaveLength(2);
  });

  it('filters by status', () => {
    const playing = generateUserGame({ status: GameStatus.PLAYING });
    const backlog = generateUserGame({ status: GameStatus.BACKLOG });
    const state = makeRootState({ games: [playing, backlog] }, { status: GameStatus.PLAYING });
    const result = selectFilteredGames(state as never);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe(GameStatus.PLAYING);
  });

  it('filters by search', () => {
    const elden = generateUserGame({ title: 'Elden Ring' });
    const doom = generateUserGame({ title: 'DOOM' });
    const state = makeRootState({ games: [elden, doom] }, { search: 'elden' });
    const result = selectFilteredGames(state as never);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Elden Ring');
  });
});

describe('selectAiEligibleGames', () => {
  it('returns only BACKLOG and PLAYING games', () => {
    const backlog = generateUserGame({ status: GameStatus.BACKLOG });
    const playing = generateUserGame({ status: GameStatus.PLAYING });
    const completed = generateUserGame({ status: GameStatus.COMPLETED });
    const dropped = generateUserGame({ status: GameStatus.DROPPED });
    const state = makeRootState({ games: [backlog, playing, completed, dropped] });
    const result = selectAiEligibleGames(state as never);
    expect(result).toHaveLength(2);
    expect(result.every((g) => g.status === GameStatus.BACKLOG || g.status === GameStatus.PLAYING)).toBe(true);
  });
});

describe('selectGameById', () => {
  it('returns the game with the matching id', () => {
    const game = generateUserGame({ id: 'target-game' });
    const state = makeRootState({ games: [game, generateUserGame()] });
    const selector = selectGameById('target-game');
    expect(selector(state as never)?.id).toBe('target-game');
  });

  it('returns null when game not found', () => {
    const state = makeRootState({ games: [generateUserGame()] });
    const selector = selectGameById('nonexistent');
    expect(selector(state as never)).toBeNull();
  });
});

describe('selectGames and selectIsGamesLoading', () => {
  it('selectGames returns games array', () => {
    const game = generateUserGame();
    const state = makeRootState({ games: [game] });
    expect(selectGames(state as never)).toHaveLength(1);
  });

  it('selectIsGamesLoading returns true when loading', () => {
    const state = makeRootState({ gamesStatus: AsyncStatus.Loading });
    expect(selectIsGamesLoading(state as never)).toBe(true);
  });

  it('selectGamesStatus returns gamesStatus', () => {
    const state = makeRootState({ gamesStatus: AsyncStatus.Succeeded });
    expect(selectGamesStatus(state as never)).toBe(AsyncStatus.Succeeded);
  });
});
