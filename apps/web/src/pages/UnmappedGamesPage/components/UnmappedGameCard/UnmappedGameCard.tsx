import { UnmappedGame, UnmappedReasons } from '@grimoire/shared';
import { Wrench } from 'lucide-react';

import { PlatformIcon } from '@/components/PlatformIcon/PlatformIcon';
import { cn } from '@/utils/cn';
import { formatPlaytime } from '@/utils/formatPlaytime';

interface IUnmappedGameCard {
  game: UnmappedGame;
  onMapClick: (game: UnmappedGame) => void;
}

const REASON_STYLES: Record<UnmappedReasons, string> = {
  [UnmappedReasons.NO_MATCH]: 'bg-grimoire-status-dropped-bg text-grimoire-status-dropped-text',
  [UnmappedReasons.LOW_CONFIDENCE]: 'bg-grimoire-status-wishlist-bg text-grimoire-status-wishlist-text',
  [UnmappedReasons.DUPLICATE_MATCH]: 'bg-grimoire-status-completed-bg text-grimoire-status-completed-text',
};

const REASON_LABELS: Record<UnmappedReasons, string> = {
  [UnmappedReasons.NO_MATCH]: 'No match',
  [UnmappedReasons.LOW_CONFIDENCE]: 'Low confidence',
  [UnmappedReasons.DUPLICATE_MATCH]: 'Duplicate match',
};

function UnmappedGameCard({ game, onMapClick }: IUnmappedGameCard) {
  const reasonStyle = REASON_STYLES[game.reason as UnmappedReasons] ?? 'bg-grimoire-status-backlog-bg text-grimoire-status-backlog-text';
  const reasonLabel = REASON_LABELS[game.reason as UnmappedReasons] ?? game.reason;

  return (
    <div className='flex items-center justify-between gap-4 rounded border border-grimoire-border bg-grimoire-card p-4 transition-colors hover:border-grimoire-border-lg'>
      {renderInfo()}
      {renderActions()}
    </div>
  );

  function renderInfo() {
    return (
      <div className='flex min-w-0 flex-col gap-1.5'>
        <h3 className='font-grimoire text-base text-grimoire-ink truncate'>{game.syncedGameTitle}</h3>
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
        onClick={() => onMapClick(game)}
        className='flex shrink-0 items-center gap-1.5 rounded border border-grimoire-border bg-grimoire-hover px-3 py-1.5 font-sans text-xs text-grimoire-muted transition-colors hover:border-grimoire-border-lg hover:text-grimoire-ink'
      >
        <Wrench className='h-3.5 w-3.5' />
        Map manually
      </button>
    );
  }
}

export default UnmappedGameCard;
