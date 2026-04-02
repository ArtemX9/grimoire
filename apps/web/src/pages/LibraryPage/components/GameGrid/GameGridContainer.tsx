import { useGetGamesQuery } from '@/api/gamesApi';
import { useDebounce } from '@/hooks/useDebounce';
import { useAppSelector } from '@/store/hooks';

import GameGrid from './GameGrid';

function GameGridContainer() {
  const filters = useAppSelector((s) => s.filters);
  const games = useAppSelector((s) => s.games.games);
  const isLoading = useAppSelector((s) => s.games.isGamesLoading);
  const debouncedSearch = useDebounce(filters.search, 300);

  // Trigger the RTK Query fetch so onQueryStarted populates the slice.
  useGetGamesQuery({
    status: filters.status ?? undefined,
    genre: filters.genre ?? undefined,
    search: debouncedSearch || undefined,
  });

  return <GameGrid games={games} isLoading={isLoading} />;
}

export default GameGridContainer;
