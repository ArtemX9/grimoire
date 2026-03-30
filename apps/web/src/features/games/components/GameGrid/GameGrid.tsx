import { UserGame } from '@grimoire/shared';

import GameCard from '@/features/games/components/GameCard/GameCard';
import { Skeleton } from '@/shared/components/ui/skeleton';

interface IGameGrid {
  games: UserGame[];
  isLoading: boolean;
}

function GameGrid({ games, isLoading }: IGameGrid) {
  if (isLoading) {
    return renderSkeletons();
  }

  if (!games || games.length === 0) {
    return renderEmpty();
  }

  return (
    <div className='grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );

  function renderSkeletons() {
    return (
      <div className='grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className='flex flex-col gap-2'>
            <Skeleton className='aspect-[3/4] w-full rounded-lg' />
            <Skeleton className='h-3 w-3/4 rounded' />
            <Skeleton className='h-2.5 w-1/2 rounded' />
          </div>
        ))}
      </div>
    );
  }

  function renderEmpty() {
    return (
      <div className='flex flex-col items-center justify-center py-20 text-center'>
        <p className='font-grimoire text-lg text-grimoire-muted'>Your library is empty</p>
        <p className='mt-1 font-sans text-sm text-grimoire-faint'>Add games manually or connect Steam to get started</p>
      </div>
    );
  }
}

export default GameGrid;
