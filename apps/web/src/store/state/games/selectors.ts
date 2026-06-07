import { AsyncStatus, GameStatus } from '@grimoire/shared';
import { createSelector } from 'reselect';

import type { RootState } from '@/store/store';

export const selectGames = (state: RootState) => state.games.games;
export const selectSelectedGame = (state: RootState) => state.games.selectedGame;
export const selectGameStats = (state: RootState) => state.games.stats;
export const selectGamesStatus = (state: RootState) => state.games.gamesStatus;
export const selectSelectedGameStatus = (state: RootState) => state.games.selectedGameStatus;
export const selectStatsStatus = (state: RootState) => state.games.statsStatus;
export const selectGamesMutationStatus = (state: RootState) => state.games.mutationStatus;
export const selectGamesError = (state: RootState) => state.games.error;

export const selectIsGamesLoading = createSelector(selectGamesStatus, (status) => status === AsyncStatus.Loading);

export const selectIsStatsLoading = createSelector(selectStatsStatus, (status) => status === AsyncStatus.Loading);

export const selectIsGameMutating = createSelector(selectGamesMutationStatus, (status) => status === AsyncStatus.Loading);

// Factory selector — returns a selector for a specific game by id
export function selectGameById(id: string) {
  return createSelector(selectGames, (games) => games.find((g) => g.id === id) ?? null);
}

// selectFilteredGames — applies all filter state to the games array client-side
export const selectFilteredGames = createSelector(
  selectGames,
  (state: RootState) => state.filters,
  (games, filters) => {
    let result = games;

    if (filters.status) {
      result = result.filter((g) => g.status === filters.status);
    }

    if (filters.genre) {
      result = result.filter((g) => g.genres.includes(filters.genre!));
    }

    if (filters.platform) {
      result = result.filter((g) => g.platforms.some((p) => p.platformName === filters.platform));
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((g) => g.title.toLowerCase().includes(q));
    }

    if (filters.sortBy) {
      const sortField = filters.sortBy;
      const order = filters.order;
      result = [...result].sort((a, b) => {
        const aVal = a[sortField as keyof typeof a];
        const bVal = b[sortField as keyof typeof b];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  },
);

// selectAiEligibleGames — games in BACKLOG or PLAYING status suitable for AI recommendations
export const selectAiEligibleGames = createSelector(selectGames, (games) =>
  games.filter((g) => g.status === GameStatus.BACKLOG || g.status === GameStatus.PLAYING),
);

// selectAvailablePlatforms — unique platform names across all games
export const selectAvailablePlatforms = createSelector(selectGames, (games) =>
  [...new Set(games.flatMap((g) => g.platforms.map((p) => p.platformName)))].sort((a, b) => (a > b ? 1 : a === b ? 0 : -1)),
);
