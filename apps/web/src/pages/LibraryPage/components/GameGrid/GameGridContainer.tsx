import { useGetGamesQuery } from '@/api/gamesApi';
import { useDebounce } from '@/hooks/useDebounce';
import { useSliceSync } from '@/hooks/useSliceSync';
import { gamesLoaded } from '@/store/gamesSlice';
import { useAppSelector } from '@/store/hooks';

import GameGrid from './GameGrid';

function GameGridContainer() {
  const filters = useAppSelector((s) => s.filters);
  const games = useAppSelector((s) => s.games.games);
  const isLoading = useAppSelector((s) => s.games.isGamesLoading);
  const debouncedSearch = useDebounce(filters.search, 300);

  const args = {
    status: filters.status ?? undefined,
    genre: filters.genre ?? undefined,
    platform: filters.platform ?? undefined,
    search: debouncedSearch || undefined,
    sortBy: filters.sortBy ?? undefined,
    order: filters.order,
  };

  useSliceSync(useGetGamesQuery, args, gamesLoaded);

  return <GameGrid games={games} isLoading={isLoading} />;
}

export default GameGridContainer;
