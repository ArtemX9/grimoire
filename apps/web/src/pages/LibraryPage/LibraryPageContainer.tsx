import { GameStatus, Genre, IgdbGame, Platform, SortableField } from '@grimoire/shared';
import { useEffect, useState } from 'react';

import { toast } from '@/components/ui/use-toast';
import { LibraryPage } from '@/pages/LibraryPage/LibraryPage';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setGenreFilter, setOrder, setPlatformFilter, setSearch, setSortBy, setStatusFilter } from '@/store/state/filters/index';
import { selectFilters } from '@/store/state/filters/selectors';
import {
  selectAvailablePlatforms,
  selectGameStats,
  selectGames,
  selectIsGamesLoading,
  selectIsStatsLoading,
} from '@/store/state/games/selectors';
import { setHighlightedGameID, toggleAIDrawer } from '@/store/state/ui/index';
import { selectHighlightedGameID, selectIsAIDrawerOpen } from '@/store/state/ui/selectors';
import { createGame, getGameStats, getGames } from '@/store/thunks/games/index';

// Platform ID 1 represents a manually-added game (no external platform sync)
const MANUAL_PLATFORM_ID = 1;

export function LibraryPageContainer() {
  const dispatch = useAppDispatch();

  const filters = useAppSelector(selectFilters);
  const isAIDrawerOpen = useAppSelector(selectIsAIDrawerOpen);
  const highlightedGameID = useAppSelector(selectHighlightedGameID);
  const games = useAppSelector(selectGames);
  const stats = useAppSelector(selectGameStats);
  const isGamesLoading = useAppSelector(selectIsGamesLoading);
  const isStatsLoading = useAppSelector(selectIsStatsLoading);
  const availablePlatforms = useAppSelector(selectAvailablePlatforms);

  const [addDialogOpen, setAddDialogOpen] = useState(false);

  useEffect(function fetchGamesAndStats() {
    dispatch(getGames());
    dispatch(getGameStats());
  }, []);

  useEffect(function clearHighlightOnUnmount() {
    return () => {
      dispatch(setHighlightedGameID(null));
    };
  }, []);

  async function handleAddGame(game: IgdbGame, status: GameStatus, onSuccessCallback: () => void, onErrorCallback: () => void) {
    try {
      await dispatch(
        createGame({
          igdbId: game.id,
          platformId: MANUAL_PLATFORM_ID,
          title: game.name,
          summary: game.summary ?? game.name,
          storyLine: game.summary ?? game.name,
          releaseDate: game.first_release_date ? new Date(game.first_release_date * 1000) : new Date(0),
          coverUrl: game.cover,
          genres: game.genres?.map((g) => g) ?? [],
          themes: game.themes?.map((t) => t) ?? [],
          status,
          moods: [],
        }),
      );
      dispatch(getGameStats());
      toast({ title: `${game.name} added to your library` });
      onSuccessCallback();
    } catch {
      toast({ title: 'Failed to add game', variant: 'destructive' });
      onErrorCallback();
    }
  }

  function handleStatusChange(status: GameStatus | null) {
    dispatch(setStatusFilter(status));
  }

  function handleGenreChange(genre: Genre | null) {
    dispatch(setGenreFilter(genre));
  }

  function handlePlatformChange(platform: Platform | null) {
    dispatch(setPlatformFilter(platform));
  }

  function handleSearchChange(search: string) {
    dispatch(setSearch(search));
  }

  function handleSortByChange(sortBy: SortableField | null) {
    dispatch(setSortBy(sortBy));
  }

  function handleOrderChange(order: 'asc' | 'desc') {
    dispatch(setOrder(order));
  }

  function handleAIDrawerOpen() {
    dispatch(toggleAIDrawer());
  }

  return (
    <LibraryPage
      addDialogOpen={addDialogOpen}
      aiDrawerOpen={isAIDrawerOpen}
      stats={stats ?? null}
      games={games}
      filters={filters}
      availablePlatforms={availablePlatforms}
      isStatsLoading={isStatsLoading}
      isGamesLoading={isGamesLoading}
      highlightedGameID={highlightedGameID}
      onAddDialogOpen={setAddDialogOpen}
      onAIDrawerOpen={handleAIDrawerOpen}
      onStatusChange={handleStatusChange}
      onGenreChange={handleGenreChange}
      onPlatformChange={handlePlatformChange}
      onSearchChange={handleSearchChange}
      onSortByChange={handleSortByChange}
      onOrderChange={handleOrderChange}
      onGameSelect={handleAddGame}
    />
  );
}
