import { GamePlatform, GameStatus, Mood, UserGame } from '@grimoire/shared';
import { Clock, Gamepad2, RefreshCcw, Trash2 } from 'lucide-react';

import PlatformIcon from '@/components/PlatformIcon/PlatformIcon';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/utils/cn';

const STATUS_STYLES: Record<GameStatus, string> = {
  PLAYING: 'bg-grimoire-status-playing-bg   text-grimoire-status-playing-text',
  BACKLOG: 'bg-grimoire-status-backlog-bg   text-grimoire-status-backlog-text',
  COMPLETED: 'bg-grimoire-status-completed-bg text-grimoire-status-completed-text',
  DROPPED: 'bg-grimoire-status-dropped-bg   text-grimoire-status-dropped-text',
  WISHLIST: 'bg-grimoire-status-wishlist-bg  text-grimoire-status-wishlist-text',
};

const STATUS_LABELS: Record<GameStatus, string> = {
  PLAYING: 'Playing',
  BACKLOG: 'Backlog',
  COMPLETED: 'Completed',
  DROPPED: 'Dropped',
  WISHLIST: 'Wishlist',
};

interface IGameDetailHeader {
  game: UserGame;
  isUpdating: boolean;
  onStatusChange: (status: GameStatus) => void;
  onMoodsChange: (moods: Mood[]) => void;
  onLogSessionOpen: (open: boolean) => void;
  onDeleteDialogOpen: (open: boolean) => void;
  onPlatformPickerOpen: (open: boolean) => void;
  onPlatformSelect: (platform: GamePlatform) => void;
  onRemapDialogOpen: (open: boolean) => void;
}

function GameDetailHeader({
  game,
  isUpdating,
  onStatusChange,
  onMoodsChange,
  onLogSessionOpen,
  onDeleteDialogOpen,
  onPlatformPickerOpen,
  onPlatformSelect,
  onRemapDialogOpen,
}: IGameDetailHeader) {
  return (
    <Card>
      <CardContent className='p-6 sm:p-8'>
        <div className='flex flex-col gap-6 sm:flex-row sm:gap-8'>
          {renderCover()}
          {renderHeroDetails()}
        </div>
      </CardContent>
    </Card>
  );

  function renderCover() {
    return (
      <div className='mx-auto w-36 shrink-0 sm:mx-0 sm:w-48 lg:w-52'>
        <div className='relative aspect-[3/4] overflow-hidden rounded-lg border border-grimoire-border bg-grimoire-hover shadow-lg'>
          {game.coverURL ? (
            <img src={game.coverURL} alt={game.title} className='absolute inset-0 h-full w-full object-cover' />
          ) : (
            <div className='flex h-full w-full flex-col items-center justify-center gap-2'>
              <Gamepad2 className='h-10 w-10 text-grimoire-faint' />
              <span className='font-grimoire text-2xl text-grimoire-faint select-none'>{game.title.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderHeroDetails() {
    return (
      <div className='flex flex-1 flex-col gap-5 min-w-0'>
        <div className='flex flex-col gap-3'>
          <h1 className='font-grimoire text-3xl leading-snug text-grimoire-ink sm:text-4xl'>{game.title}</h1>

          <div className='flex flex-wrap items-center gap-2'>
            <span className={cn('rounded-full px-3 py-0.5 font-sans text-xs font-medium', STATUS_STYLES[game.status])}>
              {STATUS_LABELS[game.status]}
            </span>

            {renderPlaytime()}
          </div>

          {renderPlatforms()}

          {renderGenreBadges()}
        </div>

        {renderStatusPicker()}

        {renderMoodPicker()}

        {renderActionButtons()}
      </div>
    );
  }

  function renderPlaytime() {
    return (
      <span className='flex items-center gap-1.5 font-sans text-sm text-grimoire-muted'>
        <Clock className='h-3.5 w-3.5' />
        {Math.round(game.playtimeHours)}h played
      </span>
    );
  }

  function renderPlatforms() {
    if (game.platforms.length === 0) return null;
    return (
      <div className='flex flex-wrap items-center gap-2'>
        <span className='font-sans text-xs text-grimoire-muted'>Owned on</span>
        {game.platforms.map((p) => (
          <span
            key={p.platformID}
            className='flex items-center gap-1 rounded border border-grimoire-border px-2 py-0.5 font-sans text-xs text-grimoire-muted'
          >
            <PlatformIcon platform={p.platformName} />
            {p.platformName}
          </span>
        ))}
      </div>
    );
  }

  function renderGenreBadges() {
    if (game.genres.length === 0) return null;
    return (
      <div className='flex flex-wrap gap-1.5'>
        {game.genres.map((g) => (
          <Badge key={g} variant='secondary'>
            {g}
          </Badge>
        ))}
      </div>
    );
  }

  function renderStatusPicker() {
    return (
      <div className='flex flex-col gap-1.5'>
        <p className='font-sans text-xs text-grimoire-muted'>Status</p>
        <div className='flex flex-wrap gap-1.5'>
          {Object.values(GameStatus).map((status) => (
            <button
              key={status}
              onClick={onStatusChange.bind(null, status)}
              disabled={isUpdating}
              className={cn(
                'rounded-full border px-3 py-1 font-sans text-xs transition-colors disabled:opacity-50',
                game.status === status
                  ? cn(STATUS_STYLES[status], 'border-transparent')
                  : 'border-grimoire-border text-grimoire-muted hover:border-grimoire-border-lg hover:text-grimoire-ink',
              )}
            >
              {STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderMoodPicker() {
    return (
      <div className='flex flex-col gap-1.5'>
        <p className='font-sans text-xs text-grimoire-muted'>Moods</p>
        <div className='flex flex-wrap gap-1.5'>
          {Object.values(Mood).map((mood) => {
            const active = game.moods.includes(mood);
            const nextMoods = active ? game.moods.filter((m) => m !== mood) : [...game.moods, mood];
            return (
              <button
                key={mood}
                onClick={onMoodsChange.bind(null, nextMoods)}
                disabled={isUpdating}
                className={cn(
                  'rounded-full border px-3 py-1 font-sans text-xs transition-colors disabled:opacity-50',
                  active
                    ? 'border-grimoire-border-lg bg-grimoire-hover text-grimoire-ink'
                    : 'border-grimoire-border text-grimoire-muted hover:border-grimoire-border-lg hover:text-grimoire-ink',
                )}
              >
                {mood}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function renderActionButtons() {
    function handleRemapClick() {
      if (game.platforms.length > 1) {
        onPlatformPickerOpen(true);
      } else if (game.platforms.length === 1) {
        onPlatformSelect(game.platforms[0]);
      } else {
        onRemapDialogOpen(true);
      }
    }

    return (
      <div className='mt-auto flex flex-wrap items-center gap-2 pt-2'>
        <button
          onClick={onLogSessionOpen.bind(null, true)}
          className='rounded border border-grimoire-gold-dim bg-grimoire-gold/10 px-4 py-2 font-sans text-xs font-medium text-grimoire-gold transition-colors hover:bg-grimoire-gold/20'
        >
          Log session
        </button>
        <button
          onClick={handleRemapClick}
          className='flex items-center gap-1.5 rounded border border-grimoire-border px-4 py-2 font-sans text-xs text-grimoire-muted transition-colors hover:border-grimoire-border-lg hover:text-grimoire-ink'
        >
          <RefreshCcw className='h-3.5 w-3.5' />
          Re-map
        </button>
        <button
          onClick={onDeleteDialogOpen.bind(null, true)}
          className='flex items-center gap-1.5 rounded border border-grimoire-status-dropped-text/20 px-4 py-2 font-sans text-xs text-grimoire-status-dropped-text transition-colors hover:bg-grimoire-status-dropped-bg'
        >
          <Trash2 className='h-3.5 w-3.5' />
          Remove
        </button>
      </div>
    );
  }
}

export default GameDetailHeader;
