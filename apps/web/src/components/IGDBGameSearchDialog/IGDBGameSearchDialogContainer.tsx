import { AsyncStatus, GameStatus, IgdbGame } from '@grimoire/shared';
import { useEffect, useState } from 'react';

import { useDebounce } from '@/hooks/useDebounce';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectIgdbSearchResults, selectIgdbSearchStatus } from '@/store/state/igdb/selectors';
import { searchIgdb } from '@/store/thunks/igdb/index';

import IGDBGameSearchDialog from './IGDBGameSearchDialog';

interface IAddGameDialogContainer {
  dialogTitle: string;
  subtitle?: string;
  progressIndicatorText: string;
  actionButtonTitle: string;
  open: boolean;
  initialSearchQuery?: string;
  gameStatusOptions?: GameStatus[];
  onGameSelect: (game: IgdbGame, status: GameStatus, onSuccessCallback: () => void, onErrorCallback: () => void) => void;
  onOpenChange: (open: boolean) => void;
}

function IGDBGameSearchDialogContainer({
  gameStatusOptions,
  dialogTitle,
  subtitle,
  progressIndicatorText,
  actionButtonTitle,
  open,
  initialSearchQuery,
  onGameSelect,
  onOpenChange,
}: IAddGameDialogContainer) {
  const dispatch = useAppDispatch();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 1000);

  const searchResults = useAppSelector(selectIgdbSearchResults);
  const searchStatus = useAppSelector(selectIgdbSearchStatus);
  const isSearching = searchStatus === AsyncStatus.Loading;

  useEffect(
    function resetOnOpen() {
      if (open) {
        setSearchQuery(initialSearchQuery ?? '');
      }
    },
    [open], // intentionally only [open] — we want to reset on each open, not on every prop change while open
  );

  useEffect(
    function triggerSearch() {
      if (debouncedQuery.length >= 2) {
        dispatch(searchIgdb({ query: debouncedQuery }));
      }
    },
    [debouncedQuery],
  );

  function handleOpenChange(open: boolean) {
    if (!open) {
      setIsLoading(false);
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
      subtitle={subtitle}
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
