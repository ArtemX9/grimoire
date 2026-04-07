import { GameStatus } from '@grimoire/shared';
import { Plus, Sparkles, X } from 'lucide-react';
import { useState } from 'react';

import { useGetGameStatsQuery } from '@/api/gamesApi';
import AiPanelContainer from '@/components/AiPanel/AiPanelContainer';
import {
  BottomDrawer,
  BottomDrawerClose,
  BottomDrawerContent,
  BottomDrawerOverlay,
  BottomDrawerPortal,
} from '@/components/ui/bottom-drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import AddGameDialogContainer from '@/pages/LibraryPage/components/AddGameDialog/AddGameDialogContainer';
import FilterBar from '@/pages/LibraryPage/components/FilterBar/FilterBar';
import GameGridContainer from '@/pages/LibraryPage/components/GameGrid/GameGridContainer';
import { setGenreFilter, setSearch, setStatusFilter } from '@/store/filtersSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export function LibraryPage() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.filters);
  const { stats, isStatsLoading } = useAppSelector((s) => s.games);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);

  // Trigger the RTK Query fetch so onQueryStarted populates the slice.
  useGetGameStatsQuery();

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

      <button
        onClick={() => setAiDrawerOpen(true)}
        aria-label='Open AI recommendations'
        className='fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-grimoire-gold text-grimoire-deep shadow-lg transition-colors hover:bg-grimoire-gold-bright lg:hidden'
      >
        <Sparkles className='h-5 w-5' />
      </button>

      <BottomDrawer open={aiDrawerOpen} onOpenChange={setAiDrawerOpen}>
        <BottomDrawerPortal>
          <BottomDrawerOverlay />
          <BottomDrawerContent>
            <div className='rounded-t-xl border-t border-grimoire-border bg-grimoire-card'>
              <div className='flex items-center justify-between border-b border-grimoire-border px-4 py-3'>
                <span className='font-grimoire text-sm text-grimoire-ink'>Tonight&apos;s pick</span>
                <BottomDrawerClose className='rounded p-1 text-grimoire-muted transition-colors hover:text-grimoire-ink'>
                  <X className='h-4 w-4' />
                  <span className='sr-only'>Close</span>
                </BottomDrawerClose>
              </div>
              <ScrollArea className='max-h-[70svh]'>
                <AiPanelContainer />
              </ScrollArea>
            </div>
          </BottomDrawerContent>
        </BottomDrawerPortal>
      </BottomDrawer>

      <AddGameDialogContainer open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  );

  function renderStats() {
    if (isStatsLoading) {
      return (
        <div className='flex items-center gap-3'>
          <Skeleton className='h-4 w-16 rounded' />
          <Skeleton className='h-4 w-16 rounded' />
        </div>
      );
    }

    if (!stats) return null;

    const completedCount = stats.byStatus.find((s: { status: GameStatus }) => s.status === GameStatus.COMPLETED)?._count ?? 0;
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
