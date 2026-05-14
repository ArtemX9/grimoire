import { GameStatus, IgdbGame } from '@grimoire/shared';
import { Loader2, Search } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';

interface IAddGameDialog {
  open: boolean;
  searchQuery: string;
  dialogTitle: string;
  subtitle?: string;
  progressIndicatorText: string;
  actionButtonTitle: string;
  searchResults: IgdbGame[];
  isSearching: boolean;
  isLoading: boolean;
  gameStatusOptions?: GameStatus[];
  onOpenChange: (open: boolean) => void;
  onSearchChange: (q: string) => void;
  onAddGame: (game: IgdbGame, status: GameStatus) => void;
}

function IGDBGameSearchDialog({
  gameStatusOptions,
  open,
  searchQuery,
  searchResults,
  dialogTitle,
  subtitle,
  actionButtonTitle,
  progressIndicatorText,
  isSearching,
  isLoading,
  onOpenChange,
  onSearchChange,
  onAddGame,
}: IAddGameDialog) {
  const [selectedGame, setSelectedGame] = useState<IgdbGame | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<GameStatus>(GameStatus.BACKLOG);

  function handleConfirm() {
    if (!selectedGame) return;
    onAddGame(selectedGame, selectedStatus);
    setSelectedGame(null);
    setSelectedStatus(GameStatus.BACKLOG);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setSelectedGame(null);
      setSelectedStatus(GameStatus.BACKLOG);
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          {subtitle && <p className='font-sans text-xs text-grimoire-muted mt-0.5'>{subtitle}</p>}
        </DialogHeader>

        {renderSearch()}
        {selectedGame ? renderConfirm() : renderResults()}
      </DialogContent>
    </Dialog>
  );

  function renderSearch() {
    return (
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-grimoire-muted' />
        <Input
          value={searchQuery}
          onChange={(e) => {
            onSearchChange(e.target.value);
            setSelectedGame(null);
          }}
          placeholder='Search IGDB…'
          autoFocus
          className='pl-9'
        />
      </div>
    );
  }

  function renderResults() {
    if (isSearching) {
      return (
        <div className='flex flex-col gap-2 mt-1'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className='h-12 w-full rounded-md' />
          ))}
        </div>
      );
    }

    if (!searchQuery) return null;

    if (searchResults.length === 0) {
      return <p className='mt-2 font-sans text-sm text-grimoire-muted text-center py-4'>No results found</p>;
    }

    return (
      <div className='flex flex-col gap-1 mt-1 max-h-96 overflow-y-auto'>
        {searchResults.map((game) => renderResultRow(game))}
      </div>
    );
  }

  function renderResultRow(game: IgdbGame) {
    const releaseYear = game.first_release_date
      ? new Date(game.first_release_date * 1000).getFullYear()
      : null;

    return (
      <button
        key={game.id}
        onClick={setSelectedGame.bind(null, game)}
        className='flex items-center gap-3 rounded p-2 text-left transition-colors hover:bg-grimoire-hover'
      >
        {renderResultCover(game)}
        <div className='flex flex-col min-w-0 gap-0.5'>
          <span className='font-grimoire text-sm sm:text-base text-grimoire-ink truncate'>{game.name}</span>
          <div className='flex flex-wrap items-center gap-x-2 gap-y-0.5'>
            {releaseYear && (
              <span className='font-sans text-xs text-grimoire-muted'>{releaseYear}</span>
            )}
            {game.genres && game.genres.length > 0 && (
              <span className='font-sans text-xs text-grimoire-muted'>
                {game.genres.slice(0, 2).join(', ')}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  }

  function renderResultCover(game: IgdbGame) {
    if (game.cover) {
      return (
        <img
          src={game.cover}
          alt={game.name}
          className='h-20 w-14 sm:h-24 sm:w-16 rounded object-cover shrink-0'
        />
      );
    }

    return (
      <div className='h-20 w-14 sm:h-24 sm:w-16 rounded bg-grimoire-hover shrink-0 flex items-center justify-center'>
        <span className='font-grimoire text-xs text-grimoire-faint'>G</span>
      </div>
    );
  }

  function renderConfirm() {
    if (!selectedGame) return null;

    return (
      <div className='flex flex-col gap-4 mt-1'>
        {renderConfirmGameCard()}
        {renderGameStatus()}
        {renderConfirmActions()}
      </div>
    );
  }

  function renderConfirmGameCard() {
    if (!selectedGame) return null;

    const releaseYear = selectedGame.first_release_date
      ? new Date(selectedGame.first_release_date * 1000).getFullYear()
      : null;

    const genres = selectedGame.genres?.slice(0, 3) ?? [];

    return (
      <div className='flex gap-4 rounded border border-grimoire-border p-3'>
        {renderConfirmCover()}
        <div className='flex flex-col gap-1.5 min-w-0'>
          <span className='font-grimoire text-base sm:text-lg text-grimoire-ink leading-snug'>{selectedGame.name}</span>
          {(releaseYear || genres.length > 0) && (
            <div className='flex flex-wrap items-center gap-x-2 gap-y-0.5'>
              {releaseYear && (
                <span className='font-sans text-xs text-grimoire-muted'>{releaseYear}</span>
              )}
              {genres.length > 0 && (
                <span className='font-sans text-xs text-grimoire-muted'>{genres.join(', ')}</span>
              )}
            </div>
          )}
          {selectedGame.summary && (
            <p className='font-grimoire text-xs sm:text-sm text-grimoire-muted leading-relaxed line-clamp-4 mt-0.5'>
              {selectedGame.summary}
            </p>
          )}
        </div>
      </div>
    );
  }

  function renderConfirmCover() {
    if (!selectedGame) return null;

    if (selectedGame.cover) {
      return (
        <img
          src={selectedGame.cover}
          alt={selectedGame.name}
          className='h-28 w-20 sm:h-36 sm:w-24 rounded object-cover shrink-0'
        />
      );
    }

    return (
      <div className='h-28 w-20 sm:h-36 sm:w-24 rounded bg-grimoire-hover shrink-0 flex items-center justify-center'>
        <span className='font-grimoire text-xs text-grimoire-faint'>G</span>
      </div>
    );
  }

  function renderConfirmActions() {
    return (
      <div className='flex justify-end gap-2'>
        <Button variant='ghost' size='sm' onClick={setSelectedGame.bind(null, null)}>
          Back
        </Button>
        <Button size='sm' onClick={handleConfirm} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className='h-3.5 w-3.5 animate-spin' />
              {progressIndicatorText}
            </>
          ) : (
            actionButtonTitle
          )}
        </Button>
      </div>
    );
  }

  function renderGameStatus() {
    if (!gameStatusOptions) {
      return null;
    }

    return (
      <div className='flex flex-col gap-2'>
        <p className='font-sans text-xs text-grimoire-muted'>Add to list</p>
        <div className='flex flex-wrap gap-1.5'>
          {gameStatusOptions.map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={cn(
                'rounded-full border px-3 py-1 font-sans text-xs transition-colors',
                selectedStatus === status
                  ? 'border-grimoire-gold bg-grimoire-gold/10 text-grimoire-gold'
                  : 'border-grimoire-border text-grimoire-muted hover:border-grimoire-border-lg hover:text-grimoire-ink',
              )}
            >
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>
    );
  }
}

export default IGDBGameSearchDialog;
