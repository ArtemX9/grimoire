import { AsyncStatus, Mood } from '@grimoire/shared';

import { toast } from '@/components/ui/use-toast';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectSessionsCreateStatus } from '@/store/state/sessions/selectors';
import { getGameStats, getGames } from '@/store/thunks/games/index';
import { createSession, getGameSessions } from '@/store/thunks/sessions/index';

import LogSessionDialog from './LogSessionDialog';

interface ILogSessionDialogContainer {
  open: boolean;
  gameId: string;
  onOpenChange: (open: boolean) => void;
}

function LogSessionDialogContainer({ open, gameId, onOpenChange }: ILogSessionDialogContainer) {
  const dispatch = useAppDispatch();
  const createStatus = useAppSelector(selectSessionsCreateStatus);
  const isLoading = createStatus === AsyncStatus.Loading;

  async function handleSubmit(durationMin: string, selectedMoods: Mood[], notes: string) {
    try {
      await dispatch(
        createSession({
          gameID: gameId,
          startedAt: new Date(),
          durationMin: durationMin ? parseInt(durationMin, 10) : undefined,
          mood: selectedMoods,
          notes: notes || undefined,
        }),
      );
      dispatch(getGameSessions({ gameId }));
      dispatch(getGames());
      dispatch(getGameStats());
      toast({ title: 'Session logged' });
      onOpenChange(false);
    } catch {
      toast({ title: 'Failed to log session', variant: 'destructive' });
    }
  }

  return (
    <LogSessionDialog
      open={open}
      isLoading={isLoading}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit}
    />
  );
}

export default LogSessionDialogContainer;
