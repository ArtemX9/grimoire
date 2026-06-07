import { Star } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/utils/cn';

interface IGameDetailRating {
  userRating?: number | null;
  isUpdating: boolean;
  onRatingChange: (rating: number) => void;
}

function GameDetailRating({ userRating, isUpdating, onRatingChange }: IGameDetailRating) {
  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle>Your rating</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='flex flex-col gap-3'>
          {renderRatingDisplay()}
          {renderStars()}
        </div>
      </CardContent>
    </Card>
  );

  function renderRatingDisplay() {
    if (userRating) {
      return (
        <p className='font-grimoire text-3xl text-grimoire-ink'>
          {userRating}
          <span className='font-sans text-base text-grimoire-muted'>/10</span>
        </p>
      );
    }
    return <p className='font-sans text-sm text-grimoire-faint'>Not rated yet</p>;
  }

  function renderStars() {
    return (
      <div className='flex items-center gap-1'>
        {Array.from({ length: 10 }).map((_, i) => {
          const rating = i + 1;
          const filled = userRating !== undefined && userRating !== null && rating <= userRating;
          return (
            <button
              key={rating}
              onClick={onRatingChange.bind(null, rating)}
              disabled={isUpdating}
              aria-label={`Rate ${rating}`}
              className='transition-transform hover:scale-110 disabled:opacity-50'
            >
              <Star
                className={cn(
                  'h-4 w-4',
                  filled
                    ? 'fill-grimoire-gold-dim text-grimoire-gold-dim'
                    : 'fill-transparent text-grimoire-faint hover:text-grimoire-muted',
                )}
              />
            </button>
          );
        })}
      </div>
    );
  }
}

export default GameDetailRating;
