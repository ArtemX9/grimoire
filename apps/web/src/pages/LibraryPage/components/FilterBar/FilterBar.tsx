import { GameStatus, Genre, Platform, PLATFORM_LABELS, SortableField } from '@grimoire/shared';
import { Search, X } from 'lucide-react';

import PlatformIcon from '@/components/PlatformIcon/PlatformIcon';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';

const STATUS_OPTIONS = Object.values(GameStatus);

const SORT_OPTIONS: { label: string; value: SortableField }[] = [
  { label: 'Playtime', value: SortableField.playtimeHours },
  { label: 'Rating', value: SortableField.userRating },
  { label: 'Date Added', value: SortableField.addedAt },
  { label: 'Status', value: SortableField.status },
  { label: 'Release', value: SortableField.releaseDate },
];

interface IFilterBar {
  activeStatus: GameStatus | null;
  activeGenre: Genre | null;
  activePlatform: Platform | null;
  activeSortBy: SortableField | null;
  activeOrder: 'asc' | 'desc';
  search: string;
  availablePlatforms: Platform[];
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
  availablePlatforms,
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
      {availablePlatforms.length >= 2 && renderPlatformFilters()}
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
        {availablePlatforms.map((platform) => (
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
            <PlatformIcon platform={platform} />
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
