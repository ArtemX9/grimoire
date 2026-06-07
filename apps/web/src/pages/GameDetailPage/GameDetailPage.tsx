import { GamePlatform, GameStatus, IgdbGame, Mood, UserGame } from '@grimoire/shared';
import { ArrowLeft } from 'lucide-react';

import IGDBGameSearchDialogContainer from '@/components/IGDBGameSearchDialog/IGDBGameSearchDialogContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import GameDetailAbout from '@/pages/GameDetailPage/components/GameDetailAbout/GameDetailAbout';
import GameDetailDeleteDialog from '@/pages/GameDetailPage/components/GameDetailDeleteDialog/GameDetailDeleteDialog';
import GameDetailHeader from '@/pages/GameDetailPage/components/GameDetailHeader/GameDetailHeader';
import GameDetailPlatformPicker from '@/pages/GameDetailPage/components/GameDetailPlatformPicker/GameDetailPlatformPicker';
import GameDetailRating from '@/pages/GameDetailPage/components/GameDetailRating/GameDetailRating';
import GameDetailSessions from '@/pages/GameDetailPage/components/GameDetailSessions/GameDetailSessions';
import GameNotes from '@/pages/GameDetailPage/components/GameNotes/GameNotes';
import LogSessionDialogContainer from '@/pages/GameDetailPage/components/LogSessionDialogContainer';

type GameSession = {
  id: string;
  startedAt: string | Date;
  durationMin?: number | null;
};

interface IGameDetailPage {
  game: UserGame | null;
  isLoading: boolean;
  sessions: GameSession[];
  isUpdating: boolean;
  isDeleting: boolean;
  deleteDialogOpen: boolean;
  logSessionOpen: boolean;
  remapDialogOpen: boolean;
  platformPickerOpen: boolean;
  selectedPlatformForRemap: GamePlatform | null;
  onDeleteDialogOpen: (open: boolean) => void;
  onLogSessionOpen: (open: boolean) => void;
  onRemapDialogOpen: (open: boolean) => void;
  onPlatformPickerOpen: (open: boolean) => void;
  onPlatformSelect: (platform: GamePlatform) => void;
  onStatusChange: (status: GameStatus) => void;
  onMoodsChange: (moods: Mood[]) => void;
  onRatingChange: (rating: number) => void;
  onSaveNotes: (notes: string) => void;
  onDelete: () => void;
  onRemapGame: (game: IgdbGame, status: GameStatus, onSuccess: () => void, onError: () => void) => void;
  onBack: () => void;
}

function buildRemapSubtitle(platforms: GamePlatform[], selected: GamePlatform | null): string | undefined {
  if (selected) return `Originally titled "${selected.externalTitle}" on ${selected.platformName}`;
  if (platforms.length === 0) return undefined;
  return platforms.map((p) => `Originally titled "${p.externalTitle}" on ${p.platformName}`).join(' · ');
}

export function GameDetailPage({
  game,
  isLoading,
  sessions,
  isUpdating,
  isDeleting,
  deleteDialogOpen,
  logSessionOpen,
  remapDialogOpen,
  platformPickerOpen,
  selectedPlatformForRemap,
  onDeleteDialogOpen,
  onLogSessionOpen,
  onRemapDialogOpen,
  onPlatformPickerOpen,
  onPlatformSelect,
  onStatusChange,
  onMoodsChange,
  onRatingChange,
  onSaveNotes,
  onDelete,
  onRemapGame,
  onBack,
}: IGameDetailPage) {
  if (isLoading) return renderSkeleton();

  if (!game) {
    return (
      <div className='flex h-full items-center justify-center'>
        <p className='font-grimoire text-lg text-grimoire-muted'>Game not found</p>
      </div>
    );
  }

  return (
    <ScrollArea className='h-full'>
      <div className='mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8'>
        {renderBackNav()}
        {renderHeroCard()}
        {renderContentGrid()}
      </div>
      {renderDialogs()}
    </ScrollArea>
  );

  function renderBackNav() {
    return (
      <button
        onClick={onBack}
        className='flex items-center gap-1.5 font-sans text-sm text-grimoire-muted transition-colors hover:text-grimoire-ink'
      >
        <ArrowLeft className='h-4 w-4' />
        Back
      </button>
    );
  }

  function renderHeroCard() {
    return (
      <GameDetailHeader
        game={game!}
        isUpdating={isUpdating}
        onStatusChange={onStatusChange}
        onMoodsChange={onMoodsChange}
        onLogSessionOpen={onLogSessionOpen}
        onDeleteDialogOpen={onDeleteDialogOpen}
        onPlatformPickerOpen={onPlatformPickerOpen}
        onPlatformSelect={onPlatformSelect}
        onRemapDialogOpen={onRemapDialogOpen}
      />
    );
  }

  function renderContentGrid() {
    return (
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        <div className='flex flex-col gap-6 lg:col-span-2'>
          <GameDetailAbout summary={game!.summary} storyLine={game!.storyLine} />
          {renderNotesCard()}
        </div>
        <div className='flex flex-col gap-6'>
          <GameDetailRating userRating={game!.userRating} isUpdating={isUpdating} onRatingChange={onRatingChange} />
          <GameDetailSessions sessions={sessions} />
        </div>
      </div>
    );
  }

  function renderNotesCard() {
    return (
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <GameNotes notes={game!.notes} isSaving={isUpdating} onSave={onSaveNotes} />
        </CardContent>
      </Card>
    );
  }

  function renderDialogs() {
    return (
      <>
        <GameDetailDeleteDialog
          open={deleteDialogOpen}
          gameTitle={game!.title}
          isDeleting={isDeleting}
          onOpenChange={onDeleteDialogOpen}
          onDelete={onDelete}
        />

        <LogSessionDialogContainer open={logSessionOpen} gameId={game!.id} onOpenChange={onLogSessionOpen} />

        <GameDetailPlatformPicker
          open={platformPickerOpen}
          platforms={game!.platforms}
          onOpenChange={onPlatformPickerOpen}
          onPlatformSelect={onPlatformSelect}
        />

        <IGDBGameSearchDialogContainer
          dialogTitle='Remap game'
          subtitle={buildRemapSubtitle(game!.platforms, selectedPlatformForRemap)}
          progressIndicatorText='Remapping...'
          actionButtonTitle='Remap'
          open={remapDialogOpen}
          onOpenChange={onRemapDialogOpen}
          onGameSelect={onRemapGame}
        />
      </>
    );
  }
}

function renderSkeleton() {
  const cardCls = 'rounded-lg border border-grimoire-border bg-grimoire-card p-6 sm:p-8';
  return (
    <div className='mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8'>
      <Skeleton className='h-5 w-16 rounded' />
      <div className={cardCls}>
        <div className='flex flex-col gap-6 sm:flex-row sm:gap-8'>
          <Skeleton className='mx-auto aspect-[3/4] w-36 shrink-0 rounded-lg sm:mx-0 sm:w-48' />
          <div className='flex flex-1 flex-col gap-4'>
            <Skeleton className='h-10 w-3/4 rounded' />
            <Skeleton className='h-5 w-32 rounded-full' />
            <div className='flex gap-1.5'>
              <Skeleton className='h-5 w-16 rounded-full' />
              <Skeleton className='h-5 w-20 rounded-full' />
            </div>
            <div className='mt-4 flex gap-2'>
              <Skeleton className='h-8 w-24 rounded' />
              <Skeleton className='h-8 w-20 rounded' />
            </div>
          </div>
        </div>
      </div>
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        <div className='lg:col-span-2'>
          <div className='rounded-lg border border-grimoire-border bg-grimoire-card p-6'>
            <Skeleton className='mb-4 h-4 w-12 rounded' />
            <Skeleton className='h-32 w-full rounded' />
          </div>
        </div>
        <div className='flex flex-col gap-6'>
          <div className='rounded-lg border border-grimoire-border bg-grimoire-card p-6'>
            <Skeleton className='mb-3 h-4 w-20 rounded' />
            <Skeleton className='mb-3 h-8 w-12 rounded' />
            <Skeleton className='h-4 w-full rounded' />
          </div>
          <div className='rounded-lg border border-grimoire-border bg-grimoire-card p-6'>
            <Skeleton className='mb-4 h-4 w-16 rounded' />
            <Skeleton className='h-10 w-full rounded' />
          </div>
        </div>
      </div>
    </div>
  );
}
