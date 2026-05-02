import { GameStatus, Genre, IgdbGame, Platform, SortableField } from '@grimoire/shared';
import { useEffect, useMemo, useState } from 'react';

import { useCreateGameMutation, useGetGameStatsQuery } from '@/api/gamesApi';
import { toast } from '@/components/ui/use-toast';
import { LibraryPage } from '@/pages/LibraryPage/LibraryPage';
import { setGenreFilter, setOrder, setPlatformFilter, setSearch, setSortBy, setStatusFilter } from '@/store/filtersSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setHighlightedGameID, toggleAIDrawer } from '@/store/uiSlice';

export function LibraryPageContainer() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.filters);
  const { games, stats, isStatsLoading, isGamesLoading } = useAppSelector((s) => s.games);
  const isAIDrawerOpen = useAppSelector((s) => s.ui.isAIDrawerOpen);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [createGame] = useCreateGameMutation();

  const availablePlatforms = useMemo(
    function deriveAvailablePlatforms() {
      const platformSet = new Set<Platform>();
      for (const game of games) {
        for (const gp of game.platforms) {
          platformSet.add(gp.platformName);
        }
      }
      return Array.from(platformSet);
    },
    [games],
  );

  // Trigger the RTK Query fetch so onQueryStarted populates the slice.
  useGetGameStatsQuery();

  useEffect(() => {
    return () => { dispatch(setHighlightedGameID(null)); };
  }, []);

  async function handleAddGame(game: IgdbGame, status: GameStatus, onSuccessCallback: () => void, onErrorCallback: () => void) {
    try {
      await createGame({
        igdbId: game.id,
        platformId: 1,
        title: game.name,
        summary: game.summary ?? game.name,
        storyLine: game.summary ?? game.name,
        releaseDate: game.first_release_date ? new Date(game.first_release_date * 1000) : new Date(0),
        coverUrl: game.cover,
        genres: game.genres?.map((g) => g) ?? [],
        status,
        moods: [],
      }).unwrap();
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

  return (
    <LibraryPage
      addDialogOpen={addDialogOpen}
      aiDrawerOpen={isAIDrawerOpen}
      stats={stats}
      filters={filters}
      availablePlatforms={availablePlatforms}
      isStatsLoading={isStatsLoading}
      isGamesLoading={isGamesLoading}
      onAddDialogOpen={setAddDialogOpen}
      onAIDrawerOpen={() => dispatch(toggleAIDrawer())}
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
