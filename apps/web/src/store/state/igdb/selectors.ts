import type { RootState } from '@/store/store';

export const selectIgdbSearchResults = (state: RootState) => state.igdb.searchResults;
export const selectIgdbSelectedGame = (state: RootState) => state.igdb.selectedGame;
export const selectIgdbSearchStatus = (state: RootState) => state.igdb.searchStatus;
export const selectIgdbGetStatus = (state: RootState) => state.igdb.getStatus;
export const selectIgdbError = (state: RootState) => state.igdb.error;
