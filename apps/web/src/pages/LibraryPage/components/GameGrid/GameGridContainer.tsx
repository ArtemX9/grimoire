import { useEffect } from 'react';

import { useDebounce } from '@/hooks/useDebounce';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectFilters } from '@/store/state/filters/selectors';
import { selectGames, selectIsGamesLoading } from '@/store/state/games/selectors';
import { selectHighlightedGameID } from '@/store/state/ui/selectors';
import { getGames } from '@/store/thunks/games/index';

import GameGrid from './GameGrid';

function GameGridContainer() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectFilters);
  const highlightedGameID = useAppSelector(selectHighlightedGameID);
  const games = useAppSelector(selectGames);
  const isLoading = useAppSelector(selectIsGamesLoading);
  const debouncedSearch = useDebounce(filters.search, 300);

  useEffect(
    function refetchOnFilterChange() {
      const params = {
        status: filters.status ?? undefined,
        genre: filters.genre ?? undefined,
        platform: filters.platform ?? undefined,
        search: debouncedSearch || undefined,
        sortBy: filters.sortBy ?? undefined,
        order: filters.order,
      };
      dispatch(getGames(params));
    },
    [filters.status, filters.genre, filters.platform, debouncedSearch, filters.sortBy, filters.order],
  );

  return <GameGrid games={games} isLoading={isLoading} highlightedGameID={highlightedGameID} />;
}

export default GameGridContainer;
