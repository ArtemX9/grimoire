import { GameStatus, Genre, Platform, SortableField } from '@grimoire/shared';
import { describe, expect, it } from 'vitest';

import { resetFilters, setGenreFilter, setOrder, setPlatformFilter, setSearch, setSortBy, setStatusFilter } from '@/store/actions/filters';
import reducer, { FILTERS_SLICE, FiltersState } from '@/store/state/filters/index';
import { selectFilters, selectHasActiveFilters } from '@/store/state/filters/selectors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// @ts-ignore
const initialState = reducer(undefined, { type: '@@INIT' });

function makeRootState(overrides: Partial<FiltersState> = {}) {
  return { [FILTERS_SLICE]: { ...initialState, ...overrides } };
}

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
});

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

describe('selectHasActiveFilters', () => {
  it('returns false when all filters are default', () => {
    const state = makeRootState();
    expect(selectHasActiveFilters(state as never)).toBe(false);
  });

  it('returns true when status is set', () => {
    const state = makeRootState({ status: GameStatus.PLAYING });
    expect(selectHasActiveFilters(state as never)).toBe(true);
  });

  it('returns true when search is set', () => {
    const state = makeRootState({ search: 'elden ring' });
    expect(selectHasActiveFilters(state as never)).toBe(true);
  });

  it('returns false when order is changed but no filter active', () => {
    const state = makeRootState({ order: 'desc' });
    expect(selectHasActiveFilters(state as never)).toBe(false);
  });
});

describe('selectFilters', () => {
  it('returns the filters slice', () => {
    const state = makeRootState({ status: GameStatus.DROPPED });
    expect(selectFilters(state as never).status).toBe(GameStatus.DROPPED);
  });
});
