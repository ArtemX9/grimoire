import { GameStatus, Genre, Platform, SortableField } from '@grimoire/shared';
import { describe, expect, it } from 'vitest';

import reducer, {
  resetFilters,
  setGenreFilter,
  setOrder,
  setPlatformFilter,
  setSearch,
  setSortBy,
  setStatusFilter,
} from '@/store/filtersSlice';

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

  it('has null sortBy', () => {
    expect(initialState.sortBy).toBeNull();
  });

  it('has asc order', () => {
    expect(initialState.order).toBe('asc');
  });

  it('has null platform', () => {
    expect(initialState.platform).toBeNull();
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
    const withGenre = reducer(initialState, setGenreFilter(Genre.RPG));
    const withSearch = reducer(withGenre, setSearch('castlevania'));
    const next = reducer(withSearch, setStatusFilter(GameStatus.BACKLOG));

    expect(next.genre).toBe(Genre.RPG);
    expect(next.search).toBe('castlevania');
  });
});

// ---------------------------------------------------------------------------
// setGenreFilter
// ---------------------------------------------------------------------------

describe('filtersSlice — setGenreFilter', () => {
  it('sets a genre string', () => {
    const next = reducer(initialState, setGenreFilter(Genre.Action));
    expect(next.genre).toBe(Genre.Action);
  });

  it('clears genre when payload is null', () => {
    const withGenre = reducer(initialState, setGenreFilter(Genre.Action));
    const next = reducer(withGenre, setGenreFilter(null));
    expect(next.genre).toBeNull();
  });

  it('sets a null genre (treated as "no filter" by the UI, but accepted by the reducer)', () => {
    const next = reducer(initialState, setGenreFilter(null));
    expect(next.genre).toBe(null);
  });

  it('does not affect status or search', () => {
    const withStatus = reducer(initialState, setStatusFilter(GameStatus.DROPPED));
    const withSearch = reducer(withStatus, setSearch('hollow'));
    const next = reducer(withSearch, setGenreFilter(Genre.Metroidvania));

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
    const withGenre = reducer(withStatus, setGenreFilter(Genre.Horror));
    const next = reducer(withGenre, setSearch('amnesia'));

    expect(next.status).toBe(GameStatus.WISHLIST);
    expect(next.genre).toBe(Genre.Horror);
  });
});

// ---------------------------------------------------------------------------
// setSortBy
// ---------------------------------------------------------------------------

describe('filtersSlice — setSortBy', () => {
  it('sets a valid sortBy field', () => {
    const next = reducer(initialState, setSortBy(SortableField.playtimeHours));
    expect(next.sortBy).toBe(SortableField.playtimeHours);
  });

  it('sets every possible SortableField value', () => {
    for (const field of Object.values(SortableField)) {
      const next = reducer(initialState, setSortBy(field));
      expect(next.sortBy).toBe(field);
    }
  });

  it('clears sortBy when payload is null', () => {
    const withSort = reducer(initialState, setSortBy(SortableField.userRating));
    const next = reducer(withSort, setSortBy(null));
    expect(next.sortBy).toBeNull();
  });

  it('does not affect status, genre, search, or order', () => {
    const withStatus = reducer(initialState, setStatusFilter(GameStatus.PLAYING));
    const withGenre = reducer(withStatus, setGenreFilter(Genre.RPG));
    const withSearch = reducer(withGenre, setSearch('elden ring'));
    const withOrder = reducer(withSearch, setOrder('desc'));
    const next = reducer(withOrder, setSortBy(SortableField.addedAt));

    expect(next.status).toBe(GameStatus.PLAYING);
    expect(next.genre).toBe(Genre.RPG);
    expect(next.search).toBe('elden ring');
    expect(next.order).toBe('desc');
  });
});

// ---------------------------------------------------------------------------
// setOrder
// ---------------------------------------------------------------------------

describe('filtersSlice — setOrder', () => {
  it('sets order to desc', () => {
    const next = reducer(initialState, setOrder('desc'));
    expect(next.order).toBe('desc');
  });

  it('sets order to asc', () => {
    const withDesc = reducer(initialState, setOrder('desc'));
    const next = reducer(withDesc, setOrder('asc'));
    expect(next.order).toBe('asc');
  });

  it('does not affect status, genre, search, or sortBy', () => {
    const withStatus = reducer(initialState, setStatusFilter(GameStatus.COMPLETED));
    const withGenre = reducer(withStatus, setGenreFilter(Genre.Horror));
    const withSearch = reducer(withGenre, setSearch('soma'));
    const withSort = reducer(withSearch, setSortBy(SortableField.releaseDate));
    const next = reducer(withSort, setOrder('desc'));

    expect(next.status).toBe(GameStatus.COMPLETED);
    expect(next.genre).toBe(Genre.Horror);
    expect(next.search).toBe('soma');
    expect(next.sortBy).toBe(SortableField.releaseDate);
  });
});

// ---------------------------------------------------------------------------
// setPlatformFilter
// ---------------------------------------------------------------------------

describe('filtersSlice — setPlatformFilter', () => {
  it('sets a valid platform', () => {
    const next = reducer(initialState, setPlatformFilter(Platform.STEAM));
    expect(next.platform).toBe(Platform.STEAM);
  });

  it('sets every possible Platform value', () => {
    for (const platform of Object.values(Platform)) {
      const next = reducer(initialState, setPlatformFilter(platform));
      expect(next.platform).toBe(platform);
    }
  });

  it('clears platform when payload is null', () => {
    const withPlatform = reducer(initialState, setPlatformFilter(Platform.PlayStation));
    const next = reducer(withPlatform, setPlatformFilter(null));
    expect(next.platform).toBeNull();
  });

  it('does not affect status, genre, search, sortBy, or order', () => {
    const withStatus = reducer(initialState, setStatusFilter(GameStatus.PLAYING));
    const withGenre = reducer(withStatus, setGenreFilter(Genre.RPG));
    const withSearch = reducer(withGenre, setSearch('elden ring'));
    const withSort = reducer(withSearch, setSortBy(SortableField.playtimeHours));
    const withOrder = reducer(withSort, setOrder('desc'));
    const next = reducer(withOrder, setPlatformFilter(Platform.Xbox));

    expect(next.status).toBe(GameStatus.PLAYING);
    expect(next.genre).toBe(Genre.RPG);
    expect(next.search).toBe('elden ring');
    expect(next.sortBy).toBe(SortableField.playtimeHours);
    expect(next.order).toBe('desc');
  });
});

// ---------------------------------------------------------------------------
// resetFilters
// ---------------------------------------------------------------------------

describe('filtersSlice — resetFilters', () => {
  it('resets all fields to initial state', () => {
    const dirty = reducer(
      reducer(
        reducer(
          reducer(
            reducer(reducer(initialState, setStatusFilter(GameStatus.PLAYING)), setGenreFilter(Genre.Action)),
            setPlatformFilter(Platform.STEAM),
          ),
          setSearch('sekiro'),
        ),
        setSortBy(SortableField.playtimeHours),
      ),
      setOrder('desc'),
    );

    const next = reducer(dirty, resetFilters());

    expect(next.status).toBeNull();
    expect(next.genre).toBeNull();
    expect(next.platform).toBeNull();
    expect(next.search).toBe('');
    expect(next.sortBy).toBeNull();
    expect(next.order).toBe('asc');
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
