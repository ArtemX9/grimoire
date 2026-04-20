import { IgdbGame, Platform, UnmappedGame } from '@grimoire/shared';

import IGDBGameSearchDialogContainer from '@/components/IGDBGameSearchDialog/IGDBGameSearchDialogContainer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

import UnmappedGameCard from './components/UnmappedGameCard/UnmappedGameCard';
import UnmappedSteamGameRow from './components/UnmappedSteamGameRow/UnmappedSteamGameRow';

interface IUnmappedGamesPage {
  games: UnmappedGame[];
  isLoading: boolean;
  mappingGame: UnmappedGame | null;
  onMapClick: (game: UnmappedGame) => void;
  onDialogOpenChange: (open: boolean) => void;
  onGameSelect: (game: IgdbGame, onSuccessCallback: () => void, onErrorCallback: () => void) => void;
}

function UnmappedGamesPage({ games, isLoading, mappingGame, onMapClick, onDialogOpenChange, onGameSelect }: IUnmappedGamesPage) {
  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {renderHeader()}
      <ScrollArea className='flex-1'>
        <div className='p-5'>{renderContent()}</div>
      </ScrollArea>
      {renderMapDialog()}
    </div>
  );

  function renderHeader() {
    return (
      <header className='border-b border-grimoire-border px-4 py-3 sm:px-5 sm:py-4'>
        <h1 className='font-grimoire text-xl text-grimoire-ink'>Unresolved Games</h1>
        <p className='font-sans text-sm text-grimoire-muted mt-1'>These games couldn&apos;t be mapped automatically during sync</p>
      </header>
    );
  }

  function renderContent() {
    if (isLoading) return renderSkeleton();
    if (games.length === 0) return renderEmptyState();
    return renderGameList();
  }

  function renderSkeleton() {
    return (
      <div className='flex flex-col gap-3'>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className='h-20 w-full rounded' />
        ))}
      </div>
    );
  }

  function renderEmptyState() {
    return (
      <div className='flex flex-col items-center justify-center py-16 gap-2'>
        <p className='font-grimoire text-base text-grimoire-ink'>All games are mapped</p>
        <p className='font-sans text-sm text-grimoire-muted'>No unresolved games found</p>
      </div>
    );
  }

  function renderGameList() {
    return <div className='flex flex-col gap-3'>{games.map((game) => renderGameRow(game))}</div>;
  }

  function renderGameRow(game: UnmappedGame) {
    switch (game.platform.platform) {
      case Platform.STEAM:
        return <UnmappedSteamGameRow key={game.id} game={game} onMapClick={onMapClick} />;
      default:
        return <UnmappedGameCard key={game.id} game={game} onMapClick={onMapClick} />;
    }
  }

  function renderMapDialog() {
    return (
      <IGDBGameSearchDialogContainer
        dialogTitle='Map game'
        progressIndicatorText='Mapping...'
        actionButtonTitle='Map game'
        initialSearchQuery={mappingGame?.syncedGameTitle ?? ''}
        open={mappingGame !== null}
        onOpenChange={onDialogOpenChange}
        onGameSelect={(game, _status, onSuccessCallback, onErrorCallback) => onGameSelect(game, onSuccessCallback, onErrorCallback)}
      />
    );
  }
}

export default UnmappedGamesPage;
