import { GameStatus } from '@grimoire/shared';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { useGetGameStatsQuery } from '@/api/gamesApi';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import AiPanelContainer from '@/components/AiPanel/AiPanelContainer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import AddGameDialogContainer from '@/pages/LibraryPage/components/AddGameDialog/AddGameDialogContainer';
import FilterBar from '@/pages/LibraryPage/components/FilterBar/FilterBar';
import GameGridContainer from '@/pages/LibraryPage/components/GameGrid/GameGridContainer';
import { setGenreFilter, setSearch, setStatusFilter } from '@/store/filtersSlice';

export function LibraryPage() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.filters);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useGetGameStatsQuery();

  function handleStatusChange(status: GameStatus | null) {
    dispatch(setStatusFilter(status));
  }

  function handleGenreChange(genre: string | null) {
    dispatch(setGenreFilter(genre));
  }

  function handleSearchChange(search: string) {
    dispatch(setSearch(search));
  }

  return (
    <div className='flex h-full'>
      <div className='flex flex-1 flex-col overflow-hidden'>
        <header className='flex items-center justify-between border-b border-grimoire-border px-5 py-4'>
          <div className='flex items-baseline gap-4'>
            <h1 className='font-grimoire text-xl text-grimoire-ink'>My Library</h1>
            {renderStats()}
          </div>
          <button
            onClick={() => setAddDialogOpen(true)}
            className='flex items-center gap-1.5 rounded border border-grimoire-border bg-grimoire-card px-3 py-1.5 font-sans text-xs text-grimoire-muted transition-colors hover:border-grimoire-border-lg hover:text-grimoire-ink'
          >
            <Plus className='h-3.5 w-3.5' />
            Add game
          </button>
        </header>

        <div className='border-b border-grimoire-border px-5 py-3'>
          <FilterBar
            activeStatus={filters.status}
            activeGenre={filters.genre}
            search={filters.search}
            onStatusChange={handleStatusChange}
            onGenreChange={handleGenreChange}
            onSearchChange={handleSearchChange}
          />
        </div>

        <ScrollArea className='flex-1'>
          <div className='p-5'>
            <GameGridContainer />
          </div>
        </ScrollArea>
      </div>

      <div className='hidden w-64 shrink-0 lg:block'>
        <AiPanelContainer />
      </div>

      <AddGameDialogContainer open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  );

  function renderStats() {
    if (statsLoading) {
      return (
        <div className='flex items-center gap-3'>
          <Skeleton className='h-4 w-16 rounded' />
          <Skeleton className='h-4 w-16 rounded' />
        </div>
      );
    }

    if (!stats) return null;

    const completedCount = stats.byStatus.find((s) => s.status === GameStatus.COMPLETED)?._count ?? 0;
    const completedPct = stats.total > 0 ? Math.round((completedCount / stats.total) * 100) : 0;

    return (
      <div className='flex items-center gap-4'>
        <span className='font-sans text-sm text-grimoire-muted'>{stats.total} games</span>
        <span className='font-sans text-sm text-grimoire-muted'>{Math.round(stats.totalHours)}h played</span>
        <span className='font-sans text-sm text-grimoire-muted'>{completedPct}% completed</span>
      </div>
    );
  }
}
