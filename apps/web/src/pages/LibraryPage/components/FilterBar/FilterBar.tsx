import { GENRES, GameStatus } from '@grimoire/shared';
import { Search, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';

const STATUS_OPTIONS = Object.values(GameStatus);

interface IFilterBar {
  activeStatus: GameStatus | null;
  activeGenre: string | null;
  search: string;
  onStatusChange: (status: GameStatus | null) => void;
  onGenreChange: (genre: string | null) => void;
  onSearchChange: (search: string) => void;
}

function FilterBar({ activeStatus, activeGenre, search, onStatusChange, onGenreChange, onSearchChange }: IFilterBar) {
  return (
    <div className='flex flex-col gap-3'>
      {renderSearch()}
      {renderStatusFilters()}
      {renderGenreFilters()}
    </div>
  );

  function renderSearch() {
    return (
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-grimoire-muted' />
        <Input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder='Search games…' className='pl-9 pr-8' />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className='absolute right-3 top-1/2 -translate-y-1/2 text-grimoire-muted hover:text-grimoire-ink transition-colors'
          >
            <X className='h-3.5 w-3.5' />
          </button>
        )}
      </div>
    );
  }

  function renderStatusFilters() {
    return (
      <div className='flex flex-wrap gap-1.5'>
        <button
          onClick={() => onStatusChange(null)}
          className={cn(
            'rounded-full border px-3 py-1 font-sans text-xs transition-colors',
            activeStatus === null
              ? 'border-grimoire-gold bg-grimoire-gold/10 text-grimoire-gold'
              : 'border-grimoire-border text-grimoire-muted hover:border-grimoire-border-lg hover:text-grimoire-ink',
          )}
        >
          All
        </button>
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            onClick={() => onStatusChange(status === activeStatus ? null : status)}
            className={cn(
              'rounded-full border px-3 py-1 font-sans text-xs transition-colors',
              activeStatus === status
                ? 'border-grimoire-gold bg-grimoire-gold/10 text-grimoire-gold'
                : 'border-grimoire-border text-grimoire-muted hover:border-grimoire-border-lg hover:text-grimoire-ink',
            )}
          >
            {status.charAt(0) + status.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
    );
  }

  function renderGenreFilters() {
    return (
      <div className='flex flex-wrap gap-1.5'>
        {GENRES.map((genre) => (
          <button
            key={genre}
            onClick={() => onGenreChange(activeGenre === genre ? null : genre)}
            className={cn(
              'rounded border px-2.5 py-0.5 font-sans text-xs transition-colors',
              activeGenre === genre
                ? 'border-grimoire-gold-dim bg-grimoire-gold/10 text-grimoire-gold'
                : 'border-grimoire-border text-grimoire-faint hover:border-grimoire-border-lg hover:text-grimoire-muted',
            )}
          >
            {genre}
          </button>
        ))}
      </div>
    );
  }
}

export default FilterBar;
