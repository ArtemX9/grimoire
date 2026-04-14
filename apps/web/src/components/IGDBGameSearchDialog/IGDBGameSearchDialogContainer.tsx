import { GameStatus, IgdbGame } from '@grimoire/shared';
import { useState } from 'react';

import { useSearchIgdbQuery } from '@/api/igdbApi';
import { useDebounce } from '@/hooks/useDebounce';
import { useSliceSync } from '@/hooks/useSliceSync';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { searchCleared, searchLoaded } from '@/store/igdbSlice';

import IGDBGameSearchDialog from './IGDBGameSearchDialog';

interface IAddGameDialogContainer {
  dialogTitle: string;
  progressIndicatorText: string;
  actionButtonTitle: string;
  open: boolean;
  gameStatusOptions?: GameStatus[];
  onGameSelect: (game: IgdbGame, status: GameStatus, onSuccessCallback: () => void, onErrorCallback: () => void) => void;
  onOpenChange: (open: boolean) => void;
}

function IGDBGameSearchDialogContainer({
  gameStatusOptions,
  dialogTitle,
  progressIndicatorText,
  actionButtonTitle,
  open,
  onGameSelect,
  onOpenChange,
}: IAddGameDialogContainer) {
  const dispatch = useAppDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 1000);

  useSliceSync(
    (q) => useSearchIgdbQuery(q, { skip: q.length < 2 }),
    debouncedQuery,
    searchLoaded,
  );

  const searchResults = useAppSelector((s) => s.igdb.searchResults);
  const isSearching = useAppSelector((s) => s.igdb.isSearchLoading);

  function handleOpenChange(open: boolean) {
    if (!open) {
      setSearchQuery('');
      setIsLoading(false);
      dispatch(searchCleared());
    }
    onOpenChange(open);
  }

  function handleAddGame(game: IgdbGame, status: GameStatus) {
    setIsLoading(true);
    onGameSelect(
      game,
      status,
      () => {
        handleOpenChange(false);
      },
      () => {
        setIsLoading(false);
      },
    );
  }

  return (
    <IGDBGameSearchDialog
      gameStatusOptions={gameStatusOptions}
      dialogTitle={dialogTitle}
      progressIndicatorText={progressIndicatorText}
      actionButtonTitle={actionButtonTitle}
      open={open}
      searchQuery={searchQuery}
      searchResults={searchResults}
      isSearching={isSearching}
      isLoading={isLoading}
      onOpenChange={handleOpenChange}
      onSearchChange={setSearchQuery}
      onAddGame={handleAddGame}
    />
  );
}

export default IGDBGameSearchDialogContainer;
