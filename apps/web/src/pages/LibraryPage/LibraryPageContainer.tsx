import { LibraryPage } from '@/pages/LibraryPage/LibraryPage';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useState } from 'react';
import { useCreateGameMutation, useGetGameStatsQuery } from '@/api/gamesApi';
import { GameStatus, Genre, IgdbGame } from '@grimoire/shared';
import { setGenreFilter, setSearch, setStatusFilter } from '@/store/filtersSlice';
import { toggleAIDrawer } from '@/store/uiSlice';
import { toast } from '@/components/ui/use-toast';

export function LibraryPageContainer() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.filters);
  const {
    stats,
    isStatsLoading
  } = useAppSelector((s) => s.games);
  const isAIDrawerOpen = useAppSelector((s) => s.ui.isAIDrawerOpen);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [createGame] = useCreateGameMutation();

  // Trigger the RTK Query fetch so onQueryStarted populates the slice.
  useGetGameStatsQuery();


  async function handleAddGame(game: IgdbGame, status: GameStatus, onSuccessCallback: () => void, onErrorCallback: () => void) {
    try {
      await createGame({
        igdbId: game.id,
        title: game.name,
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

  function handleSearchChange(search: string) {
    dispatch(setSearch(search));
  }

  return <LibraryPage
    addDialogOpen={addDialogOpen}
    aiDrawerOpen={isAIDrawerOpen}
    stats={stats}
    filters={filters}
    isStatsLoading={isStatsLoading}
    onAddDialogOpen={setAddDialogOpen}
    onAIDrawerOpen={() => dispatch(toggleAIDrawer())}
    onStatusChange={handleStatusChange}
    onGenreChange={handleGenreChange}
    onSearchChange={handleSearchChange}
    onGameSelect={handleAddGame}
  />;
}
