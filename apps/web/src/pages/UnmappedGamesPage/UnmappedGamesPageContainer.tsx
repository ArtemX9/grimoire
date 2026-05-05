import { IgdbGame, UnmappedGame } from '@grimoire/shared';
import { useState } from 'react';

import { useGetUnmappedGamesQuery, useMapUnmappedGameMutation } from '@/api/unmappedGamesApi';
import { toast } from '@/components/ui/use-toast';

import UnmappedGamesPage from './UnmappedGamesPage';

function UnmappedGamesPageContainer() {
  const { data: games = [], isLoading } = useGetUnmappedGamesQuery({});
  const [mapUnmappedGame] = useMapUnmappedGameMutation();
  const [mappingGame, setMappingGame] = useState<UnmappedGame | null>(null);

  function handleMapClick(game: UnmappedGame) {
    setMappingGame(game);
  }

  function handleDialogOpenChange(open: boolean) {
    if (!open) setMappingGame(null);
  }

  async function handleGameSelect(igdbGame: IgdbGame, onSuccessCallback: () => void, onErrorCallback: () => void) {
    if (!mappingGame) return;

    try {
      await mapUnmappedGame({
        id: mappingGame.id,
        body: {
          syncedGameID: mappingGame.syncedGameID,
          isMapped: true,
          platformID: mappingGame.platform.id,
          igdbInfo: {
            id: igdbGame.id,
            title: igdbGame.name,
            genres: igdbGame.genres ?? [],
            themes: igdbGame.themes ?? [],
            releaseDate: igdbGame.first_release_date ? new Date(igdbGame.first_release_date * 1000) : new Date(0),
            coverUrl: igdbGame.cover,
            summary: igdbGame.summary,
            storyLine: igdbGame.storyline,
          },
        },
      }).unwrap();
      toast({ title: 'Game mapped successfully' });
      setMappingGame(null);
      onSuccessCallback();
    } catch {
      toast({ title: 'Failed to map game', variant: 'destructive' });
      onErrorCallback();
    }
  }

  return (
    <UnmappedGamesPage
      games={games}
      isLoading={isLoading}
      mappingGame={mappingGame}
      onMapClick={handleMapClick}
      onDialogOpenChange={handleDialogOpenChange}
      onGameSelect={handleGameSelect}
    />
  );
}

export default UnmappedGamesPageContainer;
