import { GameStatus } from '@grimoire/shared';
import { describe, expect, it } from 'vitest';

import reducer, { resetFilters, setGenreFilter, setSearch, setStatusFilter } from '@/store/filtersSlice';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const initialState = reducer(undefined, { type: '@@INIT' });

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('filtersSlice — initial state', () => {
  it('has null status', () => {
    expect(initialState.status).toBeNull();
  });

  it('has null genre', () => {
    expect(initialState.genre).toBeNull();
  });

  it('has empty search string', () => {
    expect(initialState.search).toBe('');
  });
});

// ---------------------------------------------------------------------------
// setStatusFilter
// ---------------------------------------------------------------------------

describe('filtersSlice — setStatusFilter', () => {
  it('sets a valid status', () => {
    const next = reducer(initialState, setStatusFilter(GameStatus.PLAYING));
    expect(next.status).toBe(GameStatus.PLAYING);
  });

  it('sets every possible status value', () => {
    for (const status of Object.values(GameStatus)) {
      const next = reducer(initialState, setStatusFilter(status));
      expect(next.status).toBe(status);
    }
  });

  it('clears status when payload is null', () => {
    const withStatus = reducer(initialState, setStatusFilter(GameStatus.COMPLETED));
    const next = reducer(withStatus, setStatusFilter(null));
    expect(next.status).toBeNull();
  });

  it('does not affect genre or search', () => {
    const withGenre = reducer(initialState, setGenreFilter('RPG'));
    const withSearch = reducer(withGenre, setSearch('castlevania'));
    const next = reducer(withSearch, setStatusFilter(GameStatus.BACKLOG));

    expect(next.genre).toBe('RPG');
    expect(next.search).toBe('castlevania');
  });
});

// ---------------------------------------------------------------------------
// setGenreFilter
// ---------------------------------------------------------------------------

describe('filtersSlice — setGenreFilter', () => {
  it('sets a genre string', () => {
    const next = reducer(initialState, setGenreFilter('Gothic / Victorian'));
    expect(next.genre).toBe('Gothic / Victorian');
  });

  it('clears genre when payload is null', () => {
    const withGenre = reducer(initialState, setGenreFilter('Action'));
    const next = reducer(withGenre, setGenreFilter(null));
    expect(next.genre).toBeNull();
  });

  it('sets an empty-string genre (treated as "no filter" by the UI, but accepted by the reducer)', () => {
    const next = reducer(initialState, setGenreFilter(''));
    expect(next.genre).toBe('');
  });

  it('does not affect status or search', () => {
    const withStatus = reducer(initialState, setStatusFilter(GameStatus.DROPPED));
    const withSearch = reducer(withStatus, setSearch('hollow'));
    const next = reducer(withSearch, setGenreFilter('Metroidvania'));

    expect(next.status).toBe(GameStatus.DROPPED);
    expect(next.search).toBe('hollow');
  });
});

// ---------------------------------------------------------------------------
// setSearch
// ---------------------------------------------------------------------------

describe('filtersSlice — setSearch', () => {
  it('sets a search string', () => {
    const next = reducer(initialState, setSearch('dark souls'));
    expect(next.search).toBe('dark souls');
  });

  it('sets an empty string (clears search)', () => {
    const withSearch = reducer(initialState, setSearch('hades'));
    const next = reducer(withSearch, setSearch(''));
    expect(next.search).toBe('');
  });

  it('handles whitespace-only strings without trimming (raw storage)', () => {
    const next = reducer(initialState, setSearch('   '));
    expect(next.search).toBe('   ');
  });

  it('handles very long search strings', () => {
    const longString = 'a'.repeat(500);
    const next = reducer(initialState, setSearch(longString));
    expect(next.search).toBe(longString);
  });

  it('does not affect status or genre', () => {
    const withStatus = reducer(initialState, setStatusFilter(GameStatus.WISHLIST));
    const withGenre = reducer(withStatus, setGenreFilter('Horror'));
    const next = reducer(withGenre, setSearch('amnesia'));

    expect(next.status).toBe(GameStatus.WISHLIST);
    expect(next.genre).toBe('Horror');
  });
});

// ---------------------------------------------------------------------------
// resetFilters
// ---------------------------------------------------------------------------

describe('filtersSlice — resetFilters', () => {
  it('resets all fields to initial state', () => {
    const dirty = reducer(
      reducer(reducer(initialState, setStatusFilter(GameStatus.PLAYING)), setGenreFilter('Action')),
      setSearch('sekiro'),
    );

    const next = reducer(dirty, resetFilters());

    expect(next.status).toBeNull();
    expect(next.genre).toBeNull();
    expect(next.search).toBe('');
  });

  it('is safe to call on already-pristine state', () => {
    const next = reducer(initialState, resetFilters());

    expect(next).toEqual(initialState);
  });

  it('is idempotent — double reset equals single reset', () => {
    const dirty = reducer(initialState, setSearch('blasphemous'));
    const first = reducer(dirty, resetFilters());
    const second = reducer(first, resetFilters());

    expect(second).toEqual(first);
  });
});
