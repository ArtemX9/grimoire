import { GameStatus, IgdbGame } from '@grimoire/shared';
import { useState } from 'react';

import { useSearchIgdbQuery } from '@/api/igdbApi';
import { useDebounce } from '@/hooks/useDebounce';
import { useAppSelector } from '@/store/hooks';

import IGDBGameSearchDialog from './IGDBGameSearchDialog';

interface IAddGameDialogContainer {
  open: boolean;
  onGameSelect: (game: IgdbGame, status: GameStatus, onSuccessCallback: () => void, onErrorCallback: () => void) => void;
  onOpenChange: (open: boolean) => void;
}

function IGDBGameSearchDialogContainer({ open, onGameSelect, onOpenChange }: IAddGameDialogContainer) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 1000);

  useSearchIgdbQuery(debouncedQuery, { skip: debouncedQuery.length < 2 });

  const searchResults = useAppSelector((s) => s.igdb.searchResults);
  const isSearching = useAppSelector((s) => s.igdb.isSearchLoading);

  function handleAddGame(game: IgdbGame, status: GameStatus) {
    setIsLoading(true);
    onGameSelect(game, status, () => {
      setIsLoading(false);
      onOpenChange(false);
      setSearchQuery('');
    }, () => {
      setIsLoading(false);
    });
  }

  return (
    <IGDBGameSearchDialog
      open={open}
      searchQuery={searchQuery}
      searchResults={searchResults}
      isSearching={isSearching}
      isLoading={isLoading}
      onOpenChange={onOpenChange}
      onSearchChange={setSearchQuery}
      onAddGame={handleAddGame}
    />
  );
}

export default IGDBGameSearchDialogContainer;
