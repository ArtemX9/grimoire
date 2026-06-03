import { AsyncStatus } from '@grimoire/shared';
import { describe, expect, it } from 'vitest';

import {
  IGDB_SEARCH_FULFILLED,
  IGDB_SEARCH_PENDING,
  IGDB_SEARCH_REJECTED,
  clearSearchResults,
  igdbSearchFulfilled,
  igdbSearchPending,
  igdbSearchRejected,
} from '@/store/actions/igdb';
import reducer, { IGDB_SLICE, IgdbState } from '@/store/state/igdb/index';
import { selectIgdbSearchResults, selectIgdbSearchStatus } from '@/store/state/igdb/selectors';
import { generateIgdbGame } from '@/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const initialState = reducer(undefined, { type: '@@INIT' } as never);

function makeRootState(overrides: Partial<IgdbState> = {}) {
  return { [IGDB_SLICE]: { ...initialState, ...overrides } };
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('igdbSlice — initial state', () => {
  it('has empty searchResults', () => {
    expect(initialState.searchResults).toEqual([]);
  });

  it('has Idle searchStatus', () => {
    expect(initialState.searchStatus).toBe(AsyncStatus.Idle);
  });

  it('has null error', () => {
    expect(initialState.error).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Thunk type constants
// ---------------------------------------------------------------------------

describe('igdb action type constants', () => {
  it('searchIgdb has correct type strings', () => {
    expect(IGDB_SEARCH_PENDING).toBe('igdb/search/pending');
    expect(IGDB_SEARCH_FULFILLED).toBe('igdb/search/fulfilled');
    expect(IGDB_SEARCH_REJECTED).toBe('igdb/search/rejected');
  });
});

// ---------------------------------------------------------------------------
// searchIgdb lifecycle
// ---------------------------------------------------------------------------

describe('igdbSlice — searchIgdb lifecycle', () => {
  it('sets searchStatus to Loading on pending', () => {
    const next = reducer(initialState, igdbSearchPending());
    expect(next.searchStatus).toBe(AsyncStatus.Loading);
    expect(next.error).toBeNull();
  });

  it('sets searchResults and Succeeded on fulfilled', () => {
    const games = [generateIgdbGame(), generateIgdbGame()];
    const next = reducer(initialState, igdbSearchFulfilled(games));
    expect(next.searchStatus).toBe(AsyncStatus.Succeeded);
    expect(next.searchResults).toHaveLength(2);
  });

  it('sets Failed status and error on rejected', () => {
    const next = reducer(initialState, igdbSearchRejected('Not found'));
    expect(next.searchStatus).toBe(AsyncStatus.Failed);
    expect(next.error).toBe('Not found');
  });
});

// ---------------------------------------------------------------------------
// clearSearchResults
// ---------------------------------------------------------------------------

describe('igdbSlice — clearSearchResults', () => {
  it('resets searchResults and status to Idle', () => {
    const withResults = reducer(initialState, igdbSearchFulfilled([generateIgdbGame()]));
    const next = reducer(withResults, clearSearchResults());
    expect(next.searchResults).toEqual([]);
    expect(next.searchStatus).toBe(AsyncStatus.Idle);
  });
});

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

describe('igdb selectors', () => {
  it('selectIgdbSearchResults returns searchResults', () => {
    const game = generateIgdbGame();
    const state = makeRootState({ searchResults: [game] });
    expect(selectIgdbSearchResults(state as never)).toHaveLength(1);
  });

  it('selectIgdbSearchStatus returns searchStatus', () => {
    const state = makeRootState({ searchStatus: AsyncStatus.Loading });
    expect(selectIgdbSearchStatus(state as never)).toBe(AsyncStatus.Loading);
  });
});
