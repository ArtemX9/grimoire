import { GameStatus, IgdbGame, UserGame } from '@grimoire/shared';
import { ArrowLeft, Clock, RefreshCcw, Star, Trash2 } from 'lucide-react';

import IGDBGameSearchDialogContainer from '@/components/IGDBGameSearchDialog/IGDBGameSearchDialogContainer';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import GameNotes from '@/pages/GameDetailPage/components/GameNotes/GameNotes';
import LogSessionDialog from '@/pages/GameDetailPage/components/LogSessionDialog';
import { cn } from '@/utils/cn';

const STATUS_STYLES: Record<GameStatus, string> = {
  PLAYING: 'bg-grimoire-status-playing-bg   text-grimoire-status-playing-text',
  BACKLOG: 'bg-grimoire-status-backlog-bg   text-grimoire-status-backlog-text',
  COMPLETED: 'bg-grimoire-status-completed-bg text-grimoire-status-completed-text',
  DROPPED: 'bg-grimoire-status-dropped-bg   text-grimoire-status-dropped-text',
  WISHLIST: 'bg-grimoire-status-wishlist-bg  text-grimoire-status-wishlist-text',
};

type GameSession = {
  id: string;
  startedAt: string | Date;
  durationMin?: number | null;
};

interface IGameDetailPage {
  game: UserGame | null;
  isLoading: boolean;
  sessions: GameSession[];
  isUpdating: boolean;
  isDeleting: boolean;
  deleteDialogOpen: boolean;
  logSessionOpen: boolean;
  remapDialogOpen: boolean;
  onDeleteDialogOpen: (open: boolean) => void;
  onLogSessionOpen: (open: boolean) => void;
  onRemapDialogOpen: (open: boolean) => void;
  onStatusChange: (status: GameStatus) => void;
  onRatingChange: (rating: number) => void;
  onSaveNotes: (notes: string) => void;
  onDelete: () => void;
  onRemapGame: (game: IgdbGame, status: GameStatus, onSuccess: () => void, onError: () => void) => void;
  onBack: () => void;
}

export function GameDetailPage({
  game,
  isLoading,
  sessions,
  isUpdating,
  isDeleting,
  deleteDialogOpen,
  logSessionOpen,
  remapDialogOpen,
  onDeleteDialogOpen,
  onLogSessionOpen,
  onRemapDialogOpen,
  onStatusChange,
  onRatingChange,
  onSaveNotes,
  onDelete,
  onRemapGame,
  onBack,
}: IGameDetailPage) {
  if (isLoading) return renderSkeleton();

  if (!game) {
    return (
      <div className='flex h-full items-center justify-center'>
        <p className='font-grimoire text-lg text-grimoire-muted'>Game not found</p>
      </div>
    );
  }

  return (
    <ScrollArea className='h-full'>
      <div className='mx-auto max-w-3xl p-5'>
        <button
          onClick={onBack}
          className='flex items-center gap-1.5 font-sans text-sm text-grimoire-muted transition-colors hover:text-grimoire-ink'
        >
          <ArrowLeft className='h-4 w-4' />
          Back
        </button>

        <div className='mt-4 flex gap-5 sm:gap-8'>
          {renderCover()}
          {renderDetails()}
        </div>

        <div className='mt-6 grid gap-5 sm:grid-cols-2'>
          <GameNotes notes={game.notes} isSaving={isUpdating} onSave={onSaveNotes} />
          {renderSessionsSection()}
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={onDeleteDialogOpen}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle>Remove from library?</DialogTitle>
          </DialogHeader>
          <p className='font-sans text-sm text-grimoire-muted'>
            This will permanently remove <span className='text-grimoire-ink'>{game.title}</span> and all its sessions.
          </p>
          <DialogFooter>
            <Button variant='ghost' size='sm' onClick={() => onDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant='destructive' size='sm' onClick={onDelete} disabled={isDeleting}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LogSessionDialog open={logSessionOpen} gameId={game.id} onOpenChange={onLogSessionOpen} />

      <IGDBGameSearchDialogContainer
        dialogTitle='Remap game'
        progressIndicatorText='Remapping...'
        actionButtonTitle='Remap'
        open={remapDialogOpen}
        onOpenChange={onRemapDialogOpen}
        onGameSelect={onRemapGame}
      />
    </ScrollArea>
  );

  function renderCover() {
    return (
      <div className='w-28 shrink-0 sm:w-36'>
        <div className='aspect-[3/4] overflow-hidden rounded-lg border border-grimoire-border bg-grimoire-hover'>
          {game?.coverURL ? (
            <img src={game.coverURL} alt={game.title} className='h-full w-full object-cover' />
          ) : (
            <div className='flex h-full w-full items-center justify-center'>
              <span className='font-grimoire text-4xl text-grimoire-faint'>G</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderDetails() {
    return (
      <div className='flex flex-1 flex-col gap-4 min-w-0'>
        <div>
          <h1 className='font-grimoire text-2xl text-grimoire-ink leading-snug'>{game!.title}</h1>
          {game!.genres.length > 0 && (
            <div className='mt-1.5 flex flex-wrap gap-1'>
              {game!.genres.map((g) => (
                <span key={g} className='rounded border border-grimoire-border px-2 py-0.5 font-sans text-xs text-grimoire-muted'>
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className='flex flex-wrap items-center gap-3'>
          <span className='flex items-center gap-1.5 font-sans text-sm text-grimoire-muted'>
            <Clock className='h-3.5 w-3.5' />
            {Math.round(game!.playtimeHours)}h played
          </span>
          {game!.userRating && (
            <span className='flex items-center gap-1 font-sans text-sm text-grimoire-muted'>
              <Star className='h-3.5 w-3.5 fill-grimoire-gold text-grimoire-gold' />
              {game!.userRating}/10
            </span>
          )}
        </div>

        <div className='flex flex-wrap gap-1.5'>
          {Object.values(GameStatus).map((status) => (
            <button
              key={status}
              onClick={() => onStatusChange(status)}
              disabled={isUpdating}
              className={cn(
                'rounded-full border px-3 py-1 font-sans text-xs transition-colors disabled:opacity-50',
                game!.status === status
                  ? cn(STATUS_STYLES[status], 'border-transparent')
                  : 'border-grimoire-border text-grimoire-muted hover:border-grimoire-border-lg hover:text-grimoire-ink',
              )}
            >
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className='flex items-center gap-1'>
          {Array.from({ length: 10 }).map((_, i) => {
            const rating = i + 1;
            const filled = game!.userRating !== undefined && rating <= game!.userRating;
            return (
              <button
                key={rating}
                onClick={() => onRatingChange(rating)}
                disabled={isUpdating}
                aria-label={`Rate ${rating}`}
                className='transition-transform hover:scale-110 disabled:opacity-50'
              >
                <Star
                  className={cn(
                    'h-4 w-4',
                    filled ? 'fill-grimoire-gold text-grimoire-gold' : 'fill-transparent text-grimoire-faint hover:text-grimoire-muted',
                  )}
                />
              </button>
            );
          })}
        </div>

        <div className='flex flex-wrap gap-2'>
          <button
            onClick={() => onLogSessionOpen(true)}
            className='rounded border border-grimoire-border px-3 py-1.5 font-sans text-xs text-grimoire-muted transition-colors hover:border-grimoire-border-lg hover:text-grimoire-ink'
          >
            Log session
          </button>
          <button
            onClick={() => onRemapDialogOpen(true)}
            className='flex items-center gap-1 rounded border border-grimoire-border px-3 py-1.5 font-sans text-xs text-grimoire-muted transition-colors hover:border-grimoire-border-lg hover:text-grimoire-ink'
          >
            <RefreshCcw className='h-3.5 w-3.5' />
            Re-map game
          </button>
          <button
            onClick={() => onDeleteDialogOpen(true)}
            className='flex items-center gap-1 rounded border border-grimoire-status-dropped-text/20 px-3 py-1.5 font-sans text-xs text-grimoire-status-dropped-text transition-colors hover:bg-grimoire-status-dropped-bg'
          >
            <Trash2 className='h-3.5 w-3.5' />
            Remove
          </button>
        </div>
      </div>
    );
  }

  function renderSessionsSection() {
    return (
      <div className='flex flex-col gap-2'>
        <h2 className='font-sans text-xs font-medium uppercase tracking-wide text-grimoire-muted'>Sessions</h2>
        {sessions.length === 0 ? (
          <p className='font-sans text-sm text-grimoire-faint py-2'>No sessions logged yet</p>
        ) : (
          <div className='flex flex-col divide-y divide-grimoire-border rounded border border-grimoire-border'>
            {sessions.map((session) => (
              <div key={session.id} className='flex items-center justify-between px-3 py-2.5'>
                <span className='font-sans text-sm text-grimoire-muted'>
                  {new Date(session.startedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <span className='font-sans text-sm text-grimoire-ink'>{session.durationMin ? `${session.durationMin} min` : '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}

function renderSkeleton() {
  return (
    <div className='mx-auto max-w-3xl p-5'>
      <Skeleton className='h-5 w-20 rounded' />
      <div className='mt-4 flex gap-5'>
        <Skeleton className='aspect-[3/4] w-28 shrink-0 rounded-lg sm:w-36' />
        <div className='flex flex-1 flex-col gap-3'>
          <Skeleton className='h-7 w-3/4 rounded' />
          <Skeleton className='h-4 w-1/2 rounded' />
          <Skeleton className='h-4 w-1/3 rounded' />
        </div>
      </div>
    </div>
  );
}
