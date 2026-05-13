import { useGetGames } from '@/api/games';
import { useDebounce } from '@/hooks/useDebounce';
import { useAppSelector } from '@/store/hooks';

import GameGrid from './GameGrid';

function GameGridContainer() {
  const filters = useAppSelector((s) => s.filters);
  const highlightedGameID = useAppSelector((s) => s.ui.highlightedGameID);
  const debouncedSearch = useDebounce(filters.search, 300);

  const params = {
    status: filters.status ?? undefined,
    genre: filters.genre ?? undefined,
    platform: filters.platform ?? undefined,
    search: debouncedSearch || undefined,
    sortBy: filters.sortBy ?? undefined,
    order: filters.order,
  };

  const { data: games = [], isLoading } = useGetGames(params);

  return <GameGrid games={games} isLoading={isLoading} highlightedGameID={highlightedGameID} />;
}

export default GameGridContainer;
