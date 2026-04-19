import { GameStatus, IgdbGame, Mood, UpdateGameDto } from '@grimoire/shared';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useDeleteGameMutation, useGetGameQuery, useRemapGameMutation, useUpdateGameMutation } from '@/api/gamesApi';
import { useGetGameSessionsQuery } from '@/api/sessionsApi';
import { toast } from '@/components/ui/use-toast';
import { ROUTES } from '@/constants/routes';
import { useAppSelector } from '@/store/hooks';

import { GameDetailPage } from './GameDetailPage';

function GameDetailPageContainer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const game = useAppSelector((s) => s.games.selectedGame);
  const isLoading = useAppSelector((s) => s.games.isSelectedGameLoading);

  // Trigger the RTK Query fetch so onQueryStarted populates the slice.
  useGetGameQuery(id!);

  const { data: sessions = [] } = useGetGameSessionsQuery(id!);
  const [updateGame, { isLoading: isUpdating }] = useUpdateGameMutation();
  const [remapGame, { isLoading: isRemapping }] = useRemapGameMutation();
  const [deleteGame, { isLoading: isDeleting }] = useDeleteGameMutation();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [logSessionOpen, setLogSessionOpen] = useState(false);
  const [remapDialogOpen, setRemapDialogOpen] = useState(false);

  async function handleStatusChange(status: GameStatus) {
    try {
      await updateGame({ id: game!.id, data: { status } }).unwrap();
    } catch {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    }
  }

  async function handleMoodsChange(moods: Mood[]) {
    try {
      await updateGame({ id: game!.id, data: { moods } }).unwrap();
    } catch {
      toast({ title: 'Failed to update moods', variant: 'destructive' });
    }
  }

  async function handleRatingChange(rating: number) {
    const next = game!.userRating === rating ? undefined : rating;
    try {
      await updateGame({ id: game!.id, data: { userRating: next } as UpdateGameDto }).unwrap();
    } catch {
      toast({ title: 'Failed to update rating', variant: 'destructive' });
    }
  }

  async function handleSaveNotes(notes: string) {
    try {
      await updateGame({ id: game!.id, data: { notes } }).unwrap();
      toast({ title: 'Notes saved' });
    } catch {
      toast({ title: 'Failed to save notes', variant: 'destructive' });
    }
  }

  async function handleDelete() {
    try {
      await deleteGame(game!.id).unwrap();
      toast({ title: `${game!.title} removed from library` });
      navigate(ROUTES.LIBRARY);
    } catch {
      toast({ title: 'Failed to delete game', variant: 'destructive' });
    }
  }

  async function handleRemapGame(igdbGame: IgdbGame, _status: GameStatus, onSuccessCallback: () => void, onErrorCallback: () => void) {
    try {
      await remapGame({
        id: game!.id,
        data: {
          igdbId: igdbGame.id,
          title: igdbGame.name,
          coverUrl: igdbGame.cover,
          genres: igdbGame.genres ?? [],
          summary: igdbGame.summary,
          storyLine: igdbGame.storyline,
          releaseDate: igdbGame.first_release_date ? new Date(igdbGame.first_release_date * 1000) : undefined,
        },
      }).unwrap();
      toast({ title: `Re-mapped to "${igdbGame.name}"` });
      onSuccessCallback();
    } catch {
      toast({ title: 'Failed to re-map game', variant: 'destructive' });
      onErrorCallback();
    }
  }

  return (
    <GameDetailPage
      game={game}
      isLoading={isLoading || isRemapping}
      sessions={sessions}
      isUpdating={isUpdating}
      isDeleting={isDeleting}
      deleteDialogOpen={deleteDialogOpen}
      logSessionOpen={logSessionOpen}
      remapDialogOpen={remapDialogOpen}
      onDeleteDialogOpen={setDeleteDialogOpen}
      onLogSessionOpen={setLogSessionOpen}
      onRemapDialogOpen={setRemapDialogOpen}
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
