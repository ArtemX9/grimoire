import type { RootState } from '@/store/store';

export const selectUnmappedGames = (state: RootState) => state.unmappedGames.games;
export const selectUnmappedGamesFetchStatus = (state: RootState) => state.unmappedGames.fetchStatus;
export const selectUnmappedGamesMutationStatus = (state: RootState) => state.unmappedGames.mutationStatus;
export const selectUnmappedGamesError = (state: RootState) => state.unmappedGames.error;
export const selectUnmappedGamesCount = (state: RootState) => state.unmappedGames.games.length;
