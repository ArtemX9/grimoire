import { UnmappedGame, UnmappedReasons } from '@grimoire/shared';
import { ImageOff, Wrench } from 'lucide-react';
import { MouseEvent, useState } from 'react';

import { PlatformIcon } from '@/components/PlatformIcon/PlatformIcon';
import { cn } from '@/utils/cn';
import { formatPlaytime } from '@/utils/formatPlaytime';

interface IUnmappedGameRow {
  game: UnmappedGame;
  hoverImageClassName: string;
  onMapClick: (game: UnmappedGame) => void;
}

interface IHoverPos {
  top: number;
  left: number;
}

const REASON_STYLES: Record<UnmappedReasons, string> = {
  [UnmappedReasons.NO_MATCH]: 'bg-grimoire-status-dropped-bg text-grimoire-status-dropped-text',
  [UnmappedReasons.LOW_CONFIDENCE]: 'bg-grimoire-status-wishlist-bg text-grimoire-status-wishlist-text',
  [UnmappedReasons.DUPLICATE_MATCH]: 'bg-grimoire-status-completed-bg text-grimoire-status-completed-text',
  [UnmappedReasons.USER_DELETED]: 'bg-grimoire-status-backlog-bg text-grimoire-status-backlog-text',
};

const REASON_LABELS: Record<UnmappedReasons, string> = {
  [UnmappedReasons.NO_MATCH]: 'No match',
  [UnmappedReasons.LOW_CONFIDENCE]: 'Low confidence',
  [UnmappedReasons.DUPLICATE_MATCH]: 'Duplicate match',
  [UnmappedReasons.USER_DELETED]: 'User deleted',
};

const THUMBNAIL_SIZE = 32;
const HOVER_GAP = 8;

function UnmappedGameRow({ game, hoverImageClassName, onMapClick }: IUnmappedGameRow) {
  const [hoverPos, setHoverPos] = useState<IHoverPos | null>(null);

  const reasonStyle = REASON_STYLES[game.reason as UnmappedReasons] ?? 'bg-grimoire-status-backlog-bg text-grimoire-status-backlog-text';
  const reasonLabel = REASON_LABELS[game.reason as UnmappedReasons] ?? game.reason;

  function handleThumbnailMouseEnter(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverPos({ top: rect.top + rect.height / 2, left: rect.left + THUMBNAIL_SIZE + HOVER_GAP });
  }

  function handleThumbnailMouseLeave() {
    setHoverPos(null);
  }

  function handleMapClick() {
    onMapClick(game);
  }

  return (
    <div className='flex flex-col gap-3 rounded border border-grimoire-border bg-grimoire-card p-3 transition-colors hover:border-grimoire-border-lg sm:flex-row sm:items-center'>
      <div className='flex min-w-0 flex-1 items-center gap-3'>
        {renderCover()}
        {renderInfo()}
      </div>
      {renderActions()}
      {renderHoverCover()}
    </div>
  );

  function renderCover() {
    if (game.coverURL) {
      return (
        <div className='relative h-8 w-8 shrink-0' onMouseEnter={handleThumbnailMouseEnter} onMouseLeave={handleThumbnailMouseLeave}>
          <img src={game.coverURL} alt={game.syncedGameTitle} className='h-8 w-8 rounded object-cover' />
        </div>
      );
    }

    return (
      <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded border border-grimoire-border bg-grimoire-input'>
        <ImageOff className='h-4 w-4 text-grimoire-muted' />
      </div>
    );
  }

  function renderHoverCover() {
    if (!hoverPos || !game.coverURL) return null;

    return (
      <img
        src={game.coverURL}
        alt={game.syncedGameTitle}
        className={cn(
          'pointer-events-none fixed z-50 -translate-y-1/2 rounded border border-grimoire-border-lg object-cover shadow-lg',
          hoverImageClassName,
        )}
        style={{ top: hoverPos.top, left: hoverPos.left }}
      />
    );
  }

  function renderInfo() {
    return (
      <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
        <h3 className='font-grimoire text-base text-grimoire-ink break-words'>{game.syncedGameTitle}</h3>
        {renderBadges()}
        <span className='font-sans text-xs text-grimoire-muted'>{formatPlaytime(game.playtimeHours)} played</span>
      </div>
    );
  }

  function renderBadges() {
    return (
      <div className='flex flex-wrap items-center gap-2'>
        <span className='flex items-center gap-1 font-sans text-xs px-2 py-0.5 rounded bg-grimoire-status-backlog-bg text-grimoire-status-backlog-text'>
          <PlatformIcon platform={game.platform.platform} />
          {game.platform.platform}
        </span>
        <span className={cn('font-sans text-xs px-2 py-0.5 rounded', reasonStyle)}>{reasonLabel}</span>
      </div>
    );
  }

  function renderActions() {
    return (
      <button
        onClick={handleMapClick}
        className='flex w-full shrink-0 items-center justify-center gap-1.5 rounded border border-grimoire-border bg-grimoire-hover px-3 py-1.5 font-sans text-xs text-grimoire-muted transition-colors hover:border-grimoire-border-lg hover:text-grimoire-ink sm:w-auto sm:justify-start'
      >
        <Wrench className='h-3.5 w-3.5' />
        Map manually
      </button>
    );
  }
}

export default UnmappedGameRow;
