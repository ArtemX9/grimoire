import { GameStatus, UserGame } from '@grimoire/shared';
import { Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

import { getGameDetailsURL } from '@/constants/routes';
import { cn } from '@/utils/cn';

const STATUS_STYLES: Record<GameStatus, string> = {
  PLAYING: 'bg-grimoire-status-playing-bg   text-grimoire-status-playing-text',
  BACKLOG: 'bg-grimoire-status-backlog-bg   text-grimoire-status-backlog-text',
  COMPLETED: 'bg-grimoire-status-completed-bg text-grimoire-status-completed-text',
  DROPPED: 'bg-grimoire-status-dropped-bg   text-grimoire-status-dropped-text',
  WISHLIST: 'bg-grimoire-status-wishlist-bg  text-grimoire-status-wishlist-text',
};

interface IGameCard {
  game: UserGame;
}

function GameCard({ game }: IGameCard) {
  return (
    <Link
      to={getGameDetailsURL(game.id)}
      className='group flex flex-col overflow-hidden rounded-lg border border-grimoire-border bg-grimoire-card transition-colors hover:border-grimoire-border-lg hover:bg-grimoire-hover'
    >
      {renderCover()}
      {renderInfo()}
    </Link>
  );

  function renderCover() {
    return (
      <div className='relative aspect-[3/4] w-full overflow-hidden bg-grimoire-hover'>
        {game.coverUrl ? (
          <img
            src={game.coverUrl}
            alt={game.title}
            className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-105'
          />
        ) : (
          <div className='flex h-full w-full items-center justify-center'>
            <span className='font-grimoire text-3xl text-grimoire-faint select-none'>G</span>
          </div>
        )}
        <span
          className={cn('absolute right-2 top-2 rounded-full px-2 py-0.5 font-sans text-[10px] font-medium', STATUS_STYLES[game.status])}
        >
          {game.status}
        </span>
      </div>
    );
  }

  function renderInfo() {
    return (
      <div className='flex flex-col gap-1 p-2.5'>
        <h3 className='font-grimoire text-sm leading-snug text-grimoire-ink line-clamp-2'>{game.title}</h3>
        <div className='flex items-center justify-between'>
          {game.genres[0] ? (
            <span className='font-sans text-[10px] text-grimoire-muted truncate max-w-[70%]'>{game.genres[0]}</span>
          ) : (
            <span />
          )}
          {game.playtimeHours > 0 && (
            <span className='flex items-center gap-0.5 font-sans text-[10px] text-grimoire-muted shrink-0'>
              <Clock className='h-2.5 w-2.5' />
              {Math.round(game.playtimeHours)}h
            </span>
          )}
        </div>
      </div>
    );
  }
}

export default GameCard;
