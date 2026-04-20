import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

import { ROUTES } from '@/constants/routes';

interface IUnresolvedGamesBanner {
  count: number;
}

function UnresolvedGamesBanner({ count }: IUnresolvedGamesBanner) {
  if (count === 0) return null;

  return (
    <div className='flex items-center justify-between border-b border-grimoire-border bg-grimoire-hover px-4 py-2 sm:px-5'>
      <div className='flex items-center gap-2'>
        <AlertTriangle className='h-3.5 w-3.5 shrink-0 text-grimoire-status-wishlist-text' />
        <span className='font-sans text-xs text-grimoire-muted'>
          {count} {count === 1 ? 'game' : 'games'} couldn&apos;t be synced automatically
        </span>
      </div>
      <Link to={ROUTES.UNMAPPED_GAMES} className='font-sans text-xs text-grimoire-gold transition-colors hover:text-grimoire-gold-bright'>
        Review
      </Link>
    </div>
  );
}

export default UnresolvedGamesBanner;
