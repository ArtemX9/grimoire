import { GameStatus, Genre, Platform, PLATFORM_LABELS, SortableField } from '@grimoire/shared';
import { Search, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';

const STATUS_OPTIONS = Object.values(GameStatus);
const PLATFORM_OPTIONS = Object.values(Platform);

const SORT_OPTIONS: { label: string; value: SortableField }[] = [
  { label: 'Playtime', value: SortableField.playtimeHours },
  { label: 'Rating', value: SortableField.userRating },
  { label: 'Date Added', value: SortableField.addedAt },
  { label: 'Status', value: SortableField.status },
  { label: 'Release', value: SortableField.releaseDate },
];

const PLATFORM_ICONS: Record<Platform, JSX.Element> = {
  [Platform.STEAM]: (
    <svg className='h-3.5 w-3.5' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
      <path d='M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38l3.07-6.3a3.5 3.5 0 0 1-.27-.08 3.5 3.5 0 1 1 4.5-3.35l-6.18 2.95C9.97 19.48 10.97 20 12 20c4.42 0 8-3.58 8-8s-3.58-8-8-8z' />
    </svg>
  ),
  [Platform.PlayStation]: (
    <svg className='h-3.5 w-3.5' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
      <path d='M9 3v13.7l3 1.05V6.28c0-.57.26-.85.67-.71.52.17.78.74.78 1.31v9.86l2.95 1.02V8.45c0-2.27-1.47-4.7-3.73-5.37C10.58 2.5 9 2.7 9 3zm-5 15.25L7.42 20 9 19.4V18l-3.42 1.2L4 18.65v.6zm16-5.5c0 1.7-1.35 3.04-3.05 3.58L13 17.7V19l5.62-1.97C20.6 16.24 22 14.45 22 12.48c0-2.23-2.13-3.6-4.38-2.83l-1.24.43v1.35l1.6-.56c1.17-.4 2 .22 2 1.88z' />
    </svg>
  ),
  [Platform.Xbox]: (
    <svg className='h-3.5 w-3.5' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
      <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.41 14.41L6 11.83l1.41-1.41 3.18 3.17 6.59-6.59L18.59 8.41l-8 8z' />
      <path d='M5.5 5.5c1.7-1.5 4.1-1.5 6.5 0 2.4-1.5 4.8-1.5 6.5 0 1.5 2 1.5 11-6.5 13C4 16.5 4 7.5 5.5 5.5z' />
    </svg>
  ),
  [Platform.PC]: (
    <svg className='h-3.5 w-3.5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
      <rect x='2' y='3' width='20' height='14' rx='2' />
      <path d='M8 21h8M12 17v4' />
    </svg>
  ),
};

interface IFilterBar {
  activeStatus: GameStatus | null;
  activeGenre: Genre | null;
  activePlatform: Platform | null;
  activeSortBy: SortableField | null;
  activeOrder: 'asc' | 'desc';
  search: string;
  onStatusChange: (status: GameStatus | null) => void;
  onGenreChange: (genre: Genre | null) => void;
  onPlatformChange: (platform: Platform | null) => void;
  onSearchChange: (search: string) => void;
  onSortByChange: (sortBy: SortableField | null) => void;
  onOrderChange: (order: 'asc' | 'desc') => void;
}

function FilterBar({
  activeStatus,
  activeGenre,
  activePlatform,
  activeSortBy,
  activeOrder,
  search,
  onStatusChange,
  onGenreChange,
  onPlatformChange,
  onSearchChange,
  onSortByChange,
  onOrderChange,
}: IFilterBar) {
  return (
    <div className='flex flex-col gap-3'>
      {renderSearch()}
      {renderStatusFilters()}
      {renderPlatformFilters()}
      {renderSortFilters()}
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

  function renderPlatformFilters() {
    return (
      <div className='flex flex-wrap gap-1.5'>
        {PLATFORM_OPTIONS.map((platform) => (
          <button
            key={platform}
            onClick={() => onPlatformChange(activePlatform === platform ? null : platform)}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-3 py-1 font-sans text-xs transition-colors',
              activePlatform === platform
                ? 'border-grimoire-gold bg-grimoire-gold/10 text-grimoire-gold'
                : 'border-grimoire-border text-grimoire-muted hover:border-grimoire-border-lg hover:text-grimoire-ink',
            )}
          >
            {PLATFORM_ICONS[platform]}
            {PLATFORM_LABELS[platform]}
          </button>
        ))}
      </div>
    );
  }

  function renderSortFilters() {
    return (
      <div className='flex flex-wrap items-center gap-1.5'>
        {SORT_OPTIONS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => onSortByChange(activeSortBy === value ? null : value)}
            className={cn(
              'rounded-full border px-3 py-1 font-sans text-xs transition-colors',
              activeSortBy === value
                ? 'border-grimoire-gold bg-grimoire-gold/10 text-grimoire-gold'
                : 'border-grimoire-border text-grimoire-muted hover:border-grimoire-border-lg hover:text-grimoire-ink',
            )}
          >
            {label}
          </button>
        ))}
        <div className='ml-1 flex gap-1'>
          <button
            onClick={() => onOrderChange('asc')}
            className={cn(
              'rounded-full border px-3 py-1 font-sans text-xs transition-colors',
              activeOrder === 'asc'
                ? 'border-grimoire-gold bg-grimoire-gold/10 text-grimoire-gold'
                : 'border-grimoire-border text-grimoire-muted hover:border-grimoire-border-lg hover:text-grimoire-ink',
            )}
          >
            ↑ Asc
          </button>
          <button
            onClick={() => onOrderChange('desc')}
            className={cn(
              'rounded-full border px-3 py-1 font-sans text-xs transition-colors',
              activeOrder === 'desc'
                ? 'border-grimoire-gold bg-grimoire-gold/10 text-grimoire-gold'
                : 'border-grimoire-border text-grimoire-muted hover:border-grimoire-border-lg hover:text-grimoire-ink',
            )}
          >
            ↓ Desc
          </button>
        </div>
      </div>
    );
  }

  function renderGenreFilters() {
    return (
      <div className='flex flex-wrap gap-1.5'>
        {Object.values(Genre).map((genre) => (
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
