import { useGetGamesQuery } from '@/api/gamesApi';
import { useDebounce } from '@/hooks/useDebounce';
import { useAppSelector } from '@/store/hooks';

import GameGrid from './GameGrid';

function GameGridContainer() {
  const filters = useAppSelector((s) => s.filters);
  const debouncedSearch = useDebounce(filters.search, 300);

  const { data, isLoading } = useGetGamesQuery({
    status: filters.status ?? undefined,
    genre: filters.genre ?? undefined,
    search: debouncedSearch || undefined,
  });

  return <GameGrid games={data ?? []} isLoading={isLoading} />;
}

export default GameGridContainer;
