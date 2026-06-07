import { AsyncStatus } from '@grimoire/shared';
import { describe, expect, it } from 'vitest';

import {
  UNMAPPED_GAMES_DELETE_FULFILLED,
  UNMAPPED_GAMES_GET_ALL_FULFILLED,
  UNMAPPED_GAMES_GET_ALL_PENDING,
  UNMAPPED_GAMES_GET_ALL_REJECTED,
  UNMAPPED_GAMES_MAP_FULFILLED,
  unmappedGamesDeleteFulfilled,
  unmappedGamesGetAllFulfilled,
  unmappedGamesGetAllPending,
  unmappedGamesGetAllRejected,
  unmappedGamesMapFulfilled,
} from '@/store/actions/unmappedGames';
import reducer, { UNMAPPED_GAMES_SLICE, UnmappedGamesState } from '@/store/state/unmappedGames/index';
import { selectUnmappedGames, selectUnmappedGamesCount, selectUnmappedGamesFetchStatus } from '@/store/state/unmappedGames/selectors';
import { generateUnmappedGame } from '@/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const initialState = reducer(undefined, { type: '@@INIT' } as never);

function makeRootState(overrides: Partial<UnmappedGamesState> = {}) {
  return { [UNMAPPED_GAMES_SLICE]: { ...initialState, ...overrides } };
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('unmappedGamesSlice — initial state', () => {
  it('has empty games', () => {
    expect(initialState.games).toEqual([]);
  });

  it('has Idle fetchStatus', () => {
    expect(initialState.fetchStatus).toBe(AsyncStatus.Idle);
  });
});

// ---------------------------------------------------------------------------
// Thunk type constants
// ---------------------------------------------------------------------------

describe('unmappedGames action type constants', () => {
  it('getUnmappedGames has correct type strings', () => {
    expect(UNMAPPED_GAMES_GET_ALL_PENDING).toBe('unmappedGames/getAll/pending');
    expect(UNMAPPED_GAMES_GET_ALL_FULFILLED).toBe('unmappedGames/getAll/fulfilled');
    expect(UNMAPPED_GAMES_GET_ALL_REJECTED).toBe('unmappedGames/getAll/rejected');
  });

  it('mapUnmappedGame has correct type strings', () => {
    expect(UNMAPPED_GAMES_MAP_FULFILLED).toBe('unmappedGames/map/fulfilled');
  });

  it('deleteUnmappedGame has correct type strings', () => {
    expect(UNMAPPED_GAMES_DELETE_FULFILLED).toBe('unmappedGames/delete/fulfilled');
  });
});

// ---------------------------------------------------------------------------
// getUnmappedGames lifecycle
// ---------------------------------------------------------------------------

describe('unmappedGamesSlice — getUnmappedGames', () => {
  it('sets fetchStatus Loading on pending', () => {
    const next = reducer(initialState, unmappedGamesGetAllPending());
    expect(next.fetchStatus).toBe(AsyncStatus.Loading);
  });

  it('sets games and Succeeded on fulfilled', () => {
    const games = [generateUnmappedGame(), generateUnmappedGame()];
    const next = reducer(initialState, unmappedGamesGetAllFulfilled(games));
    expect(next.games).toHaveLength(2);
    expect(next.fetchStatus).toBe(AsyncStatus.Succeeded);
  });

  it('sets Failed on rejected', () => {
    const next = reducer(initialState, unmappedGamesGetAllRejected('Server error'));
    expect(next.fetchStatus).toBe(AsyncStatus.Failed);
  });
});

// ---------------------------------------------------------------------------
// mapUnmappedGame lifecycle
// ---------------------------------------------------------------------------

describe('unmappedGamesSlice — mapUnmappedGame', () => {
  it('removes mapped game from state on fulfilled', () => {
    const game = generateUnmappedGame({ id: 'game-1' });
    const withGames = reducer(initialState, unmappedGamesGetAllFulfilled([game]));
    const next = reducer(withGames, unmappedGamesMapFulfilled({ id: 'game-1', body: {} as never }));
    expect(next.games).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// deleteUnmappedGame lifecycle
// ---------------------------------------------------------------------------

describe('unmappedGamesSlice — deleteUnmappedGame', () => {
  it('removes deleted game from state on fulfilled', () => {
    const game = generateUnmappedGame({ id: 'game-del' });
    const withGames = reducer(initialState, unmappedGamesGetAllFulfilled([game]));
    const next = reducer(withGames, unmappedGamesDeleteFulfilled('game-del'));
    expect(next.games).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

describe('unmappedGames selectors', () => {
  it('selectUnmappedGames returns games', () => {
    const game = generateUnmappedGame();
    const state = makeRootState({ games: [game] });
    expect(selectUnmappedGames(state as never)).toHaveLength(1);
  });

  it('selectUnmappedGamesCount returns count', () => {
    const state = makeRootState({ games: [generateUnmappedGame(), generateUnmappedGame()] });
    expect(selectUnmappedGamesCount(state as never)).toBe(2);
  });

  it('selectUnmappedGamesFetchStatus returns fetchStatus', () => {
    const state = makeRootState({ fetchStatus: AsyncStatus.Succeeded });
    expect(selectUnmappedGamesFetchStatus(state as never)).toBe(AsyncStatus.Succeeded);
  });
});
