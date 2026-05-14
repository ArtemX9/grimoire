import { GamePlatform, GameStatus, IgdbGame, Mood, UpdateGameDto } from '@grimoire/shared';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useDeleteGame, useGetGame, useRemapGame, useUpdateGame } from '@/api/games';
import { useGetGameSessions } from '@/api/sessions';
import { toast } from '@/components/ui/use-toast';
import { ROUTES, getGameDetailsURL } from '@/constants/routes';

import { GameDetailPage } from './GameDetailPage';

function GameDetailPageContainer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: game, isLoading } = useGetGame(id!);
  const { data: sessions = [] } = useGetGameSessions(id!);

  const updateGameMutation = useUpdateGame();
  const isUpdating = updateGameMutation.isPending;
  const remapGameMutation = useRemapGame();
  const isRemapping = remapGameMutation.isPending;
  const deleteGameMutation = useDeleteGame();
  const isDeleting = deleteGameMutation.isPending;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [logSessionOpen, setLogSessionOpen] = useState(false);
  const [remapDialogOpen, setRemapDialogOpen] = useState(false);
  const [platformPickerOpen, setPlatformPickerOpen] = useState(false);
  const [selectedPlatformForRemap, setSelectedPlatformForRemap] = useState<GamePlatform | null>(null);

  async function handleStatusChange(status: GameStatus) {
    try {
      await updateGameMutation.mutateAsync({ id: game!.id, data: { status } });
    } catch {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    }
  }

  async function handleMoodsChange(moods: Mood[]) {
    try {
      await updateGameMutation.mutateAsync({ id: game!.id, data: { moods } });
    } catch {
      toast({ title: 'Failed to update moods', variant: 'destructive' });
    }
  }

  async function handleRatingChange(rating: number) {
    const next = game!.userRating === rating ? undefined : rating;
    try {
      await updateGameMutation.mutateAsync({ id: game!.id, data: { userRating: next } as UpdateGameDto });
    } catch {
      toast({ title: 'Failed to update rating', variant: 'destructive' });
    }
  }

  async function handleSaveNotes(notes: string) {
    try {
      await updateGameMutation.mutateAsync({ id: game!.id, data: { notes } });
      toast({ title: 'Notes saved' });
    } catch {
      toast({ title: 'Failed to save notes', variant: 'destructive' });
    }
  }

  async function handleDelete() {
    try {
      await deleteGameMutation.mutateAsync(game!.id);
      toast({ title: `${game!.title} removed from library` });
      navigate(ROUTES.DEFAULT);
    } catch {
      toast({ title: 'Failed to delete game', variant: 'destructive' });
    }
  }

  function handlePlatformSelect(platform: GamePlatform) {
    setSelectedPlatformForRemap(platform);
    setPlatformPickerOpen(false);
    setRemapDialogOpen(true);
  }

  async function handleRemapGame(igdbGame: IgdbGame, _status: GameStatus, onSuccessCallback: () => void, onErrorCallback: () => void) {
    try {
      const returnedGame = await remapGameMutation.mutateAsync({
        id: game!.id,
        data: {
          igdbId: igdbGame.id,
          title: igdbGame.name,
          coverUrl: igdbGame.cover,
          genres: igdbGame.genres ?? [],
          summary: igdbGame.summary,
          storyLine: igdbGame.storyline,
          themes: igdbGame.themes ?? [],
          releaseDate: igdbGame.first_release_date ? new Date(igdbGame.first_release_date * 1000) : undefined,
          ...(selectedPlatformForRemap
            ? { platformId: selectedPlatformForRemap.platformID, externalId: selectedPlatformForRemap.externalID }
            : {}),
        },
      });
      setSelectedPlatformForRemap(null);
      if (returnedGame.id !== game!.id) {
        navigate(getGameDetailsURL(returnedGame.id), { replace: true });
      }
      toast({ title: `Re-mapped to "${igdbGame.name}"` });
      onSuccessCallback();
    } catch {
      toast({ title: 'Failed to re-map game', variant: 'destructive' });
      onErrorCallback();
    }
  }

  return (
    <GameDetailPage
      game={game ?? null}
      isLoading={isLoading || isRemapping}
      sessions={sessions}
      isUpdating={isUpdating}
      isDeleting={isDeleting}
      deleteDialogOpen={deleteDialogOpen}
      logSessionOpen={logSessionOpen}
      remapDialogOpen={remapDialogOpen}
      platformPickerOpen={platformPickerOpen}
      selectedPlatformForRemap={selectedPlatformForRemap}
      onDeleteDialogOpen={setDeleteDialogOpen}
      onLogSessionOpen={setLogSessionOpen}
      onRemapDialogOpen={setRemapDialogOpen}
      onPlatformPickerOpen={setPlatformPickerOpen}
      onPlatformSelect={handlePlatformSelect}
      onStatusChange={handleStatusChange}
      onMoodsChange={handleMoodsChange}
      onRatingChange={handleRatingChange}
      onSaveNotes={handleSaveNotes}
      onDelete={handleDelete}
      onRemapGame={handleRemapGame}
      onBack={() => navigate(-1)}
    />
  );
}

export default GameDetailPageContainer;
