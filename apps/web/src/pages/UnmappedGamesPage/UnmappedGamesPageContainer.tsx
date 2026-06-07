import { AsyncStatus, IgdbGame, UnmappedGame } from '@grimoire/shared';
import { useEffect, useState } from 'react';

import { toast } from '@/components/ui/use-toast';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectUnmappedGames,
  selectUnmappedGamesFetchStatus,
  selectUnmappedGamesMutationStatus,
} from '@/store/state/unmappedGames/selectors';
import { deleteUnmappedGame, getUnmappedGames, mapUnmappedGame } from '@/store/thunks/unmappedGames/index';

import UnmappedGamesPage from './UnmappedGamesPage';

function UnmappedGamesPageContainer() {
  const dispatch = useAppDispatch();

  const games = useAppSelector(selectUnmappedGames);
  const fetchStatus = useAppSelector(selectUnmappedGamesFetchStatus);
  const mutationStatus = useAppSelector(selectUnmappedGamesMutationStatus);
  const isLoading = fetchStatus === AsyncStatus.Loading;

  const [mappingGame, setMappingGame] = useState<UnmappedGame | null>(null);

  useEffect(function fetchUnmappedGamesOnMount() {
    dispatch(getUnmappedGames({}));
  }, []);

  function handleMapClick(game: UnmappedGame) {
    setMappingGame(game);
  }

  async function handleDeleteClick(game: UnmappedGame) {
    try {
      await dispatch(deleteUnmappedGame(game.id));
      toast({ title: 'Game deleted' });
    } catch {
      toast({ title: 'Failed to delete game', variant: 'destructive' });
    }
  }

  function handleDialogOpenChange(open: boolean) {
    if (!open) setMappingGame(null);
  }

  async function handleGameSelect(igdbGame: IgdbGame, onSuccessCallback: () => void, onErrorCallback: () => void) {
    if (!mappingGame) return;

    try {
      await dispatch(
        mapUnmappedGame({
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
        }),
      );
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
      onDeleteClick={handleDeleteClick}
      onDialogOpenChange={handleDialogOpenChange}
      onGameSelect={handleGameSelect}
    />
  );
}

export default UnmappedGamesPageContainer;
