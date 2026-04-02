import { IgdbGame } from '@grimoire/shared';
import { describe, expect, it } from 'vitest';

import reducer, {
  igdbGameFailed,
  igdbGameLoaded,
  igdbGameLoadingStarted,
  searchCleared,
  searchFailed,
  searchLoaded,
  searchLoadingStarted,
} from '@/store/igdbSlice';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const initialState = reducer(undefined, { type: '@@INIT' });

function makeIgdbGame(overrides: Partial<IgdbGame> = {}): IgdbGame {
  return {
    id: 1,
    name: 'Elden Ring',
    cover: { url: '//images.igdb.com/igdb/image/upload/t_thumb/co4jni.jpg' },
    genres: [{ name: 'Role-playing (RPG)' }],
    summary: 'A dark fantasy action RPG.',
    first_release_date: 1645747200,
    total_rating: 96.4,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('igdbSlice — initial state', () => {
  it('has an empty searchResults array', () => {
    expect(initialState.searchResults).toEqual([]);
  });

  it('has isSearchLoading set to false', () => {
    expect(initialState.isSearchLoading).toBe(false);
  });

  it('has selectedGame set to null', () => {
    expect(initialState.selectedGame).toBeNull();
  });

  it('has isSelectedGameLoading set to false', () => {
    expect(initialState.isSelectedGameLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Search sub-domain — searchLoadingStarted
// ---------------------------------------------------------------------------

describe('igdbSlice — searchLoadingStarted', () => {
  it('sets isSearchLoading to true', () => {
    const next = reducer(initialState, searchLoadingStarted());
    expect(next.isSearchLoading).toBe(true);
  });

  it('does not clear existing searchResults while loading starts', () => {
    const withResults = reducer(initialState, searchLoaded([makeIgdbGame()]));
    const next = reducer(withResults, searchLoadingStarted());
    expect(next.searchResults).toHaveLength(1);
  });

  it('does not affect the selectedGame sub-domain', () => {
    const next = reducer(initialState, searchLoadingStarted());
    expect(next.isSelectedGameLoading).toBe(false);
    expect(next.selectedGame).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Search sub-domain — searchLoaded
// ---------------------------------------------------------------------------

describe('igdbSlice — searchLoaded', () => {
  it('stores the results array and clears isSearchLoading', () => {
    const games = [makeIgdbGame(), makeIgdbGame({ id: 2, name: 'Dark Souls' })];
    const loading = reducer(initialState, searchLoadingStarted());
    const next = reducer(loading, searchLoaded(games));

    expect(next.searchResults).toEqual(games);
    expect(next.isSearchLoading).toBe(false);
  });

  it('stores an empty array when no results are returned', () => {
    const loading = reducer(initialState, searchLoadingStarted());
    const next = reducer(loading, searchLoaded([]));

    expect(next.searchResults).toEqual([]);
    expect(next.isSearchLoading).toBe(false);
  });

  it('replaces the previous results array entirely', () => {
    const first = reducer(initialState, searchLoaded([makeIgdbGame({ id: 1, name: 'Old Result' })]));
    const next = reducer(first, searchLoaded([makeIgdbGame({ id: 2, name: 'New Result' })]));

    expect(next.searchResults).toHaveLength(1);
    expect(next.searchResults[0].name).toBe('New Result');
  });

  it('does not affect the selectedGame sub-domain', () => {
    const withGame = reducer(initialState, igdbGameLoaded(makeIgdbGame({ id: 99, name: 'Bloodborne' })));
    const next = reducer(withGame, searchLoaded([makeIgdbGame()]));

    expect(next.selectedGame?.id).toBe(99);
    expect(next.isSelectedGameLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Search sub-domain — searchFailed
// ---------------------------------------------------------------------------

describe('igdbSlice — searchFailed', () => {
  it('clears isSearchLoading on failure', () => {
    const loading = reducer(initialState, searchLoadingStarted());
    const next = reducer(loading, searchFailed());

    expect(next.isSearchLoading).toBe(false);
  });

  it('does not wipe existing searchResults already in state', () => {
    const withResults = reducer(initialState, searchLoaded([makeIgdbGame()]));
    const loading = reducer(withResults, searchLoadingStarted());
    const next = reducer(loading, searchFailed());

    expect(next.searchResults).toHaveLength(1);
  });

  it('does not affect the selectedGame sub-domain', () => {
    const loading = reducer(initialState, searchLoadingStarted());
    const next = reducer(loading, searchFailed());

    expect(next.isSelectedGameLoading).toBe(false);
    expect(next.selectedGame).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Search sub-domain — searchCleared
// ---------------------------------------------------------------------------

describe('igdbSlice — searchCleared', () => {
  it('empties the searchResults array', () => {
    const withResults = reducer(initialState, searchLoaded([makeIgdbGame(), makeIgdbGame({ id: 2, name: 'Sekiro' })]));
    const next = reducer(withResults, searchCleared());

    expect(next.searchResults).toEqual([]);
  });

  it('resets isSearchLoading to false', () => {
    const loading = reducer(initialState, searchLoadingStarted());
    const next = reducer(loading, searchCleared());

    expect(next.isSearchLoading).toBe(false);
  });

  it('does not affect the selectedGame sub-domain', () => {
    const withGame = reducer(initialState, igdbGameLoaded(makeIgdbGame({ id: 5, name: 'Hollow Knight' })));
    const next = reducer(withGame, searchCleared());

    expect(next.selectedGame?.id).toBe(5);
    expect(next.isSelectedGameLoading).toBe(false);
  });

  it('is safe when searchResults is already empty', () => {
    const next = reducer(initialState, searchCleared());

    expect(next.searchResults).toEqual([]);
    expect(next.isSearchLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Detail sub-domain — igdbGameLoadingStarted
// ---------------------------------------------------------------------------

describe('igdbSlice — igdbGameLoadingStarted', () => {
  it('sets isSelectedGameLoading to true', () => {
    const next = reducer(initialState, igdbGameLoadingStarted());
    expect(next.isSelectedGameLoading).toBe(true);
  });

  it('clears selectedGame to null when loading starts', () => {
    const withGame = reducer(initialState, igdbGameLoaded(makeIgdbGame()));
    const next = reducer(withGame, igdbGameLoadingStarted());

    expect(next.selectedGame).toBeNull();
  });

  it('does not affect the search sub-domain', () => {
    const withResults = reducer(initialState, searchLoaded([makeIgdbGame()]));
    const next = reducer(withResults, igdbGameLoadingStarted());

    expect(next.searchResults).toHaveLength(1);
    expect(next.isSearchLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Detail sub-domain — igdbGameLoaded
// ---------------------------------------------------------------------------

describe('igdbSlice — igdbGameLoaded', () => {
  it('stores the game and clears isSelectedGameLoading', () => {
    const game = makeIgdbGame({ id: 10, name: 'Demon\'s Souls' });
    const loading = reducer(initialState, igdbGameLoadingStarted());
    const next = reducer(loading, igdbGameLoaded(game));

    expect(next.selectedGame).toEqual(game);
    expect(next.isSelectedGameLoading).toBe(false);
  });

  it('overwrites the previously stored selectedGame', () => {
    const first = reducer(initialState, igdbGameLoaded(makeIgdbGame({ id: 1, name: 'First' })));
    const next = reducer(first, igdbGameLoaded(makeIgdbGame({ id: 2, name: 'Second' })));

    expect(next.selectedGame?.id).toBe(2);
    expect(next.selectedGame?.name).toBe('Second');
  });

  it('stores a game that has only the required fields', () => {
    const minimal: IgdbGame = { id: 42, name: 'Minimal Game' };
    const next = reducer(initialState, igdbGameLoaded(minimal));

    expect(next.selectedGame).toEqual(minimal);
    expect(next.isSelectedGameLoading).toBe(false);
  });

  it('does not affect the search sub-domain', () => {
    const withResults = reducer(initialState, searchLoaded([makeIgdbGame()]));
    const next = reducer(withResults, igdbGameLoaded(makeIgdbGame({ id: 99 })));

    expect(next.searchResults).toHaveLength(1);
    expect(next.isSearchLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Detail sub-domain — igdbGameFailed
// ---------------------------------------------------------------------------

describe('igdbSlice — igdbGameFailed', () => {
  it('clears isSelectedGameLoading on failure', () => {
    const loading = reducer(initialState, igdbGameLoadingStarted());
    const next = reducer(loading, igdbGameFailed());

    expect(next.isSelectedGameLoading).toBe(false);
  });

  it('leaves selectedGame as null after a failure (cleared by loadingStarted)', () => {
    const withGame = reducer(initialState, igdbGameLoaded(makeIgdbGame()));
    const loading = reducer(withGame, igdbGameLoadingStarted());
    const next = reducer(loading, igdbGameFailed());

    expect(next.selectedGame).toBeNull();
  });

  it('does not affect the search sub-domain', () => {
    const withResults = reducer(initialState, searchLoaded([makeIgdbGame()]));
    const loading = reducer(withResults, igdbGameLoadingStarted());
    const next = reducer(loading, igdbGameFailed());

    expect(next.searchResults).toHaveLength(1);
    expect(next.isSearchLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Sub-domain independence
// ---------------------------------------------------------------------------

describe('igdbSlice — sub-domain independence', () => {
  it('both sub-domains can be loading simultaneously', () => {
    let state = initialState;
    state = reducer(state, searchLoadingStarted());
    state = reducer(state, igdbGameLoadingStarted());

    expect(state.isSearchLoading).toBe(true);
    expect(state.isSelectedGameLoading).toBe(true);
  });

  it('resolving search does not affect selectedGame loading flag', () => {
    let state = initialState;
    state = reducer(state, searchLoadingStarted());
    state = reducer(state, igdbGameLoadingStarted());
    state = reducer(state, searchLoaded([makeIgdbGame()]));

    expect(state.isSearchLoading).toBe(false);
    expect(state.isSelectedGameLoading).toBe(true);
  });

  it('resolving selectedGame does not affect search loading flag', () => {
    let state = initialState;
    state = reducer(state, searchLoadingStarted());
    state = reducer(state, igdbGameLoadingStarted());
    state = reducer(state, igdbGameLoaded(makeIgdbGame()));

    expect(state.isSelectedGameLoading).toBe(false);
    expect(state.isSearchLoading).toBe(true);
  });

  it('failure in search does not wipe selectedGame data', () => {
    let state = initialState;
    state = reducer(state, igdbGameLoaded(makeIgdbGame({ id: 7, name: 'Returnal' })));
    state = reducer(state, searchLoadingStarted());
    state = reducer(state, searchFailed());

    expect(state.selectedGame?.id).toBe(7);
  });

  it('failure in selectedGame does not wipe searchResults', () => {
    let state = initialState;
    state = reducer(state, searchLoaded([makeIgdbGame(), makeIgdbGame({ id: 3, name: 'Hades' })]));
    state = reducer(state, igdbGameLoadingStarted());
    state = reducer(state, igdbGameFailed());

    expect(state.searchResults).toHaveLength(2);
  });
});
