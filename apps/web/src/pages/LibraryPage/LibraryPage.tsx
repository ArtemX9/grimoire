import { GameStatus, Genre, IgdbGame, Platform, SortableField } from '@grimoire/shared';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigationType } from 'react-router-dom';

import { GameStats } from '@/api/gamesApi';
import AiPanelContainer from '@/components/AiPanel/AiPanelContainer';
import IGDBGameSearchDialogContainer from '@/components/IGDBGameSearchDialog/IGDBGameSearchDialogContainer';
import UnresolvedGamesBannerContainer from '@/components/UnresolvedGamesBanner/UnresolvedGamesBannerContainer';
import {
  BottomDrawer,
  BottomDrawerClose,
  BottomDrawerContent,
  BottomDrawerOverlay,
  BottomDrawerPortal,
} from '@/components/ui/bottom-drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import FilterBar from '@/pages/LibraryPage/components/FilterBar/FilterBar';
import GameGridContainer from '@/pages/LibraryPage/components/GameGrid/GameGridContainer';
import { FiltersState } from '@/store/filtersSlice';
import { useAppSelector } from '@/store/hooks';

let _savedScrollTop = 0;

interface ILibraryPage {
  addDialogOpen: boolean;
  aiDrawerOpen: boolean;
  isStatsLoading: boolean;
  isGamesLoading: boolean;
  filters: FiltersState;
  stats: GameStats | null;
  availablePlatforms: Platform[];
  onAddDialogOpen: (shouldOpen: boolean) => void;
  onAIDrawerOpen: () => void;
  onStatusChange: (status: GameStatus | null) => void;
  onGenreChange: (genre: Genre | null) => void;
  onPlatformChange: (platform: Platform | null) => void;
  onSearchChange: (search: string) => void;
  onSortByChange: (sortBy: SortableField | null) => void;
  onOrderChange: (order: 'asc' | 'desc') => void;
  onGameSelect: (game: IgdbGame, status: GameStatus, onSuccessCallback: () => void, onErrorCallback: () => void) => void;
}

export function LibraryPage({
  addDialogOpen,
  aiDrawerOpen,
  filters,
  stats,
  availablePlatforms,
  isStatsLoading,
  isGamesLoading,
  onAddDialogOpen,
  onAIDrawerOpen,
  onStatusChange,
  onGenreChange,
  onPlatformChange,
  onSearchChange,
  onSortByChange,
  onOrderChange,
  onGameSelect,
}: ILibraryPage) {
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const hasRestoredScroll = useRef(false);
  const navigationType = useNavigationType();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const highlightedGameID = useAppSelector((s) => s.ui.highlightedGameID);
  const games = useAppSelector((s) => s.games.games);

  useEffect(function resetScrollOnFreshVisit() {
    if (navigationType !== 'POP') {
      _savedScrollTop = 0;
    }
  }, []);

  useLayoutEffect(
    function restoreScrollAfterGamesLoad() {
      if (isGamesLoading) return;
      if (hasRestoredScroll.current) return;
      hasRestoredScroll.current = true;

      if (navigationType !== 'POP' || _savedScrollTop === 0) return;

      const raf = requestAnimationFrame(() => {
        const viewport = scrollRootRef.current?.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]');
        if (viewport) viewport.scrollTop = _savedScrollTop;
      });

      return () => cancelAnimationFrame(raf);
    },
    [isGamesLoading, navigationType],
  );

  useLayoutEffect(
    function scrollToHighlightedGame() {
      if (!highlightedGameID) return;
      if (!games.some((g) => g.id === highlightedGameID)) return;

      const raf = requestAnimationFrame(() => {
        const viewport = scrollRootRef.current?.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]');
        const card = viewport?.querySelector<HTMLElement>(`[data-game-id="${highlightedGameID}"]`);
        card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });

      return () => cancelAnimationFrame(raf);
    },
    [highlightedGameID, games],
  );

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    _savedScrollTop = (event.target as HTMLDivElement).scrollTop;
  }

  return (
    <div className='flex h-full'>
      {renderMainContent()}
      {renderDesktopAiPanel()}
      {renderMobileAiDrawer()}
      {renderAddGameDialog()}
    </div>
  );

  function renderMainContent() {
    return (
      <div className='flex flex-1 flex-col overflow-hidden'>
        {renderHeader()}
        <UnresolvedGamesBannerContainer />
        {renderFilterBar()}
        <ScrollArea ref={scrollRootRef} className='flex-1' onScrollCapture={handleScroll}>
          <div className='p-5'>
            <GameGridContainer />
          </div>
        </ScrollArea>
      </div>
    );
  }

  function renderDesktopAiPanel() {
    return (
      <div className='hidden w-64 shrink-0 lg:block'>
        <AiPanelContainer />
      </div>
    );
  }

  function renderMobileAiDrawer() {
    return (
      <BottomDrawer
        open={aiDrawerOpen}
        onOpenChange={(open) => {
          if (!open) onAIDrawerOpen();
        }}
      >
        <BottomDrawerPortal>
          <BottomDrawerOverlay />
          <BottomDrawerContent>
            <div className='rounded-t-xl border-t border-grimoire-border bg-grimoire-card pb-[env(safe-area-inset-bottom)]'>
              <div className='flex items-center justify-between border-b border-grimoire-border px-4 py-3'>
                <span className='font-grimoire text-sm text-grimoire-ink'>Tonight&apos;s pick</span>
                <BottomDrawerClose className='rounded p-1 text-grimoire-muted transition-colors hover:text-grimoire-ink'>
                  <X className='h-4 w-4' />
                  <span className='sr-only'>Close</span>
                </BottomDrawerClose>
              </div>
              <div className='overflow-y-auto max-h-[80svh]'>
                <AiPanelContainer hideHeader={true} />
              </div>
            </div>
          </BottomDrawerContent>
        </BottomDrawerPortal>
      </BottomDrawer>
    );
  }

  function renderAddGameDialog() {
    return (
      <IGDBGameSearchDialogContainer
        dialogTitle='Add game'
        progressIndicatorText='Adding...'
        actionButtonTitle='Add game'
        gameStatusOptions={Object.values(GameStatus)}
        open={addDialogOpen}
        onOpenChange={onAddDialogOpen}
        onGameSelect={onGameSelect}
      />
    );
  }

  function renderHeader() {
    return (
      <header className='flex flex-col gap-2 border-b border-grimoire-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4'>
        <div className='flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1'>
          <h1 className='font-grimoire text-xl text-grimoire-ink'>My Library</h1>
          {renderStats()}
        </div>
        <div className='flex shrink-0 items-center gap-2'>
          <button
            onClick={() => setFiltersOpen((prev) => !prev)}
            className='sm:hidden flex items-center gap-1.5 rounded border border-grimoire-border bg-grimoire-card px-3 py-1.5 font-sans text-xs text-grimoire-muted transition-colors hover:border-grimoire-border-lg hover:text-grimoire-ink'
          >
            {filtersOpen ? <ChevronUp className='h-3.5 w-3.5' /> : <ChevronDown className='h-3.5 w-3.5' />}
            Filters
          </button>
          <button
            onClick={onAddDialogOpen.bind(null, true)}
            className='flex items-center gap-1.5 rounded border border-grimoire-border bg-grimoire-card px-3 py-1.5 font-sans text-xs text-grimoire-muted transition-colors hover:border-grimoire-border-lg hover:text-grimoire-ink'
          >
            <Plus className='h-3.5 w-3.5' />
            Add game
          </button>
        </div>
      </header>
    );
  }

  function renderFilterBar() {
    return (
      <div className={`border-b border-grimoire-border px-4 py-3 sm:block sm:px-5 ${filtersOpen ? 'block' : 'hidden'}`}>
        <FilterBar
          activeStatus={filters.status}
          activeGenre={filters.genre}
          activePlatform={filters.platform}
          activeSortBy={filters.sortBy}
          activeOrder={filters.order}
          search={filters.search}
          availablePlatforms={availablePlatforms}
          onStatusChange={onStatusChange}
          onGenreChange={onGenreChange}
          onPlatformChange={onPlatformChange}
          onSearchChange={onSearchChange}
          onSortByChange={onSortByChange}
          onOrderChange={onOrderChange}
        />
      </div>
    );
  }

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
