import { GameStatus, IgdbGame, UserGame } from '@grimoire/shared';
import { ArrowLeft, Clock, Gamepad2, RefreshCcw, Star, Trash2 } from 'lucide-react';

import IGDBGameSearchDialogContainer from '@/components/IGDBGameSearchDialog/IGDBGameSearchDialogContainer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import GameNotes from '@/pages/GameDetailPage/components/GameNotes/GameNotes';
import LogSessionDialog from '@/pages/GameDetailPage/components/LogSessionDialog';
import { cn } from '@/utils/cn';

const STATUS_STYLES: Record<GameStatus, string> = {
  PLAYING:   'bg-grimoire-status-playing-bg   text-grimoire-status-playing-text',
  BACKLOG:   'bg-grimoire-status-backlog-bg   text-grimoire-status-backlog-text',
  COMPLETED: 'bg-grimoire-status-completed-bg text-grimoire-status-completed-text',
  DROPPED:   'bg-grimoire-status-dropped-bg   text-grimoire-status-dropped-text',
  WISHLIST:  'bg-grimoire-status-wishlist-bg  text-grimoire-status-wishlist-text',
};

const STATUS_LABELS: Record<GameStatus, string> = {
  PLAYING:   'Playing',
  BACKLOG:   'Backlog',
  COMPLETED: 'Completed',
  DROPPED:   'Dropped',
  WISHLIST:  'Wishlist',
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
      <div className='mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8'>

        {/* Back nav */}
        <button
          onClick={onBack}
          className='flex items-center gap-1.5 font-sans text-sm text-grimoire-muted transition-colors hover:text-grimoire-ink'
        >
          <ArrowLeft className='h-4 w-4' />
          Back
        </button>

        <Card>
          <CardContent className='p-6 sm:p-8'>
            <div className='flex flex-col gap-6 sm:flex-row sm:gap-8'>
              {renderCover()}
              {renderHeroDetails()}
            </div>
          </CardContent>
        </Card>

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          <div className='lg:col-span-2'>
            <Card>
              <CardHeader className='pb-3'>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <GameNotes notes={game.notes} isSaving={isUpdating} onSave={onSaveNotes} />
              </CardContent>
            </Card>
          </div>
          <div className='flex flex-col gap-6'>
            {renderRatingCard()}
            {renderSessionsCard()}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={deleteDialogOpen} onOpenChange={onDeleteDialogOpen}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle>Remove from library?</DialogTitle>
          </DialogHeader>
          <p className='font-sans text-sm text-grimoire-muted'>
            This will permanently remove{' '}
            <span className='text-grimoire-ink'>{game.title}</span> and all its sessions.
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
      <div className='mx-auto w-36 shrink-0 sm:mx-0 sm:w-48 lg:w-52'>
        <div className='relative aspect-[3/4] overflow-hidden rounded-lg border border-grimoire-border bg-grimoire-hover shadow-lg'>
          {game?.coverURL ? (
            <img
              src={game.coverURL}
              alt={game.title}
              className='absolute inset-0 h-full w-full object-cover'
            />
          ) : (
            <div className='flex h-full w-full flex-col items-center justify-center gap-2'>
              <Gamepad2 className='h-10 w-10 text-grimoire-faint' />
              <span className='font-grimoire text-2xl text-grimoire-faint select-none'>
                {game!.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderHeroDetails() {
    return (
      <div className='flex flex-1 flex-col gap-5 min-w-0'>

        {/* Title + status + playtime */}
        <div className='flex flex-col gap-3'>
          <h1 className='font-grimoire text-3xl leading-snug text-grimoire-ink sm:text-4xl'>
            {game!.title}
          </h1>

          <div className='flex flex-wrap items-center gap-2'>
            {/* Current status badge */}
            <span
              className={cn(
                'rounded-full px-3 py-0.5 font-sans text-xs font-medium',
                STATUS_STYLES[game!.status],
              )}
            >
              {STATUS_LABELS[game!.status]}
            </span>

            {/* Playtime */}
            <span className='flex items-center gap-1.5 font-sans text-sm text-grimoire-muted'>
              <Clock className='h-3.5 w-3.5' />
              {Math.round(game!.playtimeHours)}h played
            </span>
          </div>

          {/* Genre badges */}
          {game!.genres.length > 0 && (
            <div className='flex flex-wrap gap-1.5'>
              {game!.genres.map((g) => (
                <Badge key={g} variant='secondary'>
                  {g}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Status picker */}
        <div className='flex flex-col gap-1.5'>
          <p className='font-sans text-xs text-grimoire-muted'>Status</p>
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
                {STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className='mt-auto flex flex-wrap items-center gap-2 pt-2'>
          <button
            onClick={() => onLogSessionOpen(true)}
            className='rounded border border-grimoire-gold-dim bg-grimoire-gold/10 px-4 py-2 font-sans text-xs font-medium text-grimoire-gold transition-colors hover:bg-grimoire-gold/20'
          >
            Log session
          </button>
          <button
            onClick={() => onRemapDialogOpen(true)}
            className='flex items-center gap-1.5 rounded border border-grimoire-border px-4 py-2 font-sans text-xs text-grimoire-muted transition-colors hover:border-grimoire-border-lg hover:text-grimoire-ink'
          >
            <RefreshCcw className='h-3.5 w-3.5' />
            Re-map
          </button>
          <button
            onClick={() => onDeleteDialogOpen(true)}
            className='flex items-center gap-1.5 rounded border border-grimoire-status-dropped-text/20 px-4 py-2 font-sans text-xs text-grimoire-status-dropped-text transition-colors hover:bg-grimoire-status-dropped-bg'
          >
            <Trash2 className='h-3.5 w-3.5' />
            Remove
          </button>
        </div>
      </div>
    );
  }

  function renderRatingCard() {
    return (
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle>Your rating</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col gap-3'>
            {game!.userRating ? (
              <p className='font-grimoire text-3xl text-grimoire-gold'>
                {game!.userRating}
                <span className='font-sans text-base text-grimoire-muted'>/10</span>
              </p>
            ) : (
              <p className='font-sans text-sm text-grimoire-faint'>Not rated yet</p>
            )}
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
                        filled
                          ? 'fill-grimoire-gold text-grimoire-gold'
                          : 'fill-transparent text-grimoire-faint hover:text-grimoire-muted',
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderSessionsCard() {
    return (
      <Card>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <CardTitle>Sessions</CardTitle>
            <span className='font-sans text-xs text-grimoire-muted'>
              {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}
            </span>
          </div>
        </CardHeader>
        <CardContent className='pt-0'>
          {sessions.length === 0 ? (
            <p className='py-4 text-center font-sans text-sm text-grimoire-faint'>
              No sessions logged yet
            </p>
          ) : (
            <div className='flex flex-col divide-y divide-grimoire-border'>
              {sessions.map((session) => (
                <div key={session.id} className='flex items-center justify-between py-2.5'>
                  <span className='font-sans text-sm text-grimoire-muted'>
                    {new Date(session.startedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span className='font-sans text-sm text-grimoire-ink'>
                    {session.durationMin ? `${session.durationMin} min` : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
}

function renderSkeleton() {
  const cardCls = 'rounded-lg border border-grimoire-border bg-grimoire-card p-6 sm:p-8';
  return (
    <div className='mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8'>
      <Skeleton className='h-5 w-16 rounded' />
      <div className={cardCls}>
        <div className='flex flex-col gap-6 sm:flex-row sm:gap-8'>
          <Skeleton className='mx-auto aspect-[3/4] w-36 shrink-0 rounded-lg sm:mx-0 sm:w-48' />
          <div className='flex flex-1 flex-col gap-4'>
            <Skeleton className='h-10 w-3/4 rounded' />
            <Skeleton className='h-5 w-32 rounded-full' />
            <div className='flex gap-1.5'>
              <Skeleton className='h-5 w-16 rounded-full' />
              <Skeleton className='h-5 w-20 rounded-full' />
            </div>
            <div className='mt-4 flex gap-2'>
              <Skeleton className='h-8 w-24 rounded' />
              <Skeleton className='h-8 w-20 rounded' />
            </div>
          </div>
        </div>
      </div>
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        <div className='lg:col-span-2'>
          <div className='rounded-lg border border-grimoire-border bg-grimoire-card p-6'>
            <Skeleton className='mb-4 h-4 w-12 rounded' />
            <Skeleton className='h-32 w-full rounded' />
          </div>
        </div>
        <div className='flex flex-col gap-6'>
          <div className='rounded-lg border border-grimoire-border bg-grimoire-card p-6'>
            <Skeleton className='mb-3 h-4 w-20 rounded' />
            <Skeleton className='mb-3 h-8 w-12 rounded' />
            <Skeleton className='h-4 w-full rounded' />
          </div>
          <div className='rounded-lg border border-grimoire-border bg-grimoire-card p-6'>
            <Skeleton className='mb-4 h-4 w-16 rounded' />
            <Skeleton className='h-10 w-full rounded' />
          </div>
        </div>
      </div>
    </div>
  );
}