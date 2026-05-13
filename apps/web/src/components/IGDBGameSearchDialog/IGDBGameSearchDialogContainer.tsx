import { GameStatus, IgdbGame } from '@grimoire/shared';
import { useEffect, useState } from 'react';

import { useSearchIgdb } from '@/api/igdb';
import { useDebounce } from '@/hooks/useDebounce';

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
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 1000);

  useEffect(
    function resetOnOpen() {
      if (open) {
        setSearchQuery(initialSearchQuery ?? '');
      }
    },
    [open], // intentionally only [open] — we want to reset on each open, not on every prop change while open
  );

  const { data: searchResults = [], isFetching: isSearching } = useSearchIgdb(debouncedQuery);

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
