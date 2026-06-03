import { createSelector } from 'reselect';

import type { RootState } from '@/store/store';

export const selectFilters = (state: RootState) => state.filters;

export const selectStatusFilter = (state: RootState) => state.filters.status;
export const selectGenreFilter = (state: RootState) => state.filters.genre;
export const selectPlatformFilter = (state: RootState) => state.filters.platform;
export const selectSearch = (state: RootState) => state.filters.search;
export const selectSortBy = (state: RootState) => state.filters.sortBy;
export const selectOrder = (state: RootState) => state.filters.order;

export const selectHasActiveFilters = createSelector(selectFilters, (filters) => {
  return filters.status !== null || filters.genre !== null || filters.platform !== null || filters.search !== '' || filters.sortBy !== null;
});
