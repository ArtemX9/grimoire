import { useEffect, useState } from 'react';

import { toast } from '@/components/ui/use-toast';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectIsPSNConnected,
  selectIsPSNConnecting,
  selectIsPSNSyncing,
  selectPSNFetchStatus,
  selectPSNStatus,
} from '@/store/state/playstation/selectors';
import { connectPSN, getPSNStatus, syncPSN } from '@/store/thunks/playstation/index';

import PSNRow from './PSNRow';

function PSNRowContainer() {
  const dispatch = useAppDispatch();

  const status = useAppSelector(selectPSNStatus);
  const fetchStatus = useAppSelector(selectPSNFetchStatus);
  const isConnecting = useAppSelector(selectIsPSNConnecting);
  const isSyncing = useAppSelector(selectIsPSNSyncing);
  const connected = useAppSelector(selectIsPSNConnected);

  const [usernameInput, setUsernameInput] = useState('');
  const [showInput, setShowInput] = useState(false);

  useEffect(function fetchPSNStatusOnMount() {
    dispatch(getPSNStatus());
  }, []);

  async function handleConnect() {
    if (!usernameInput.trim()) return;
    try {
      await dispatch(connectPSN({ username: usernameInput.trim() }));
      toast({ title: 'PlayStation Network account connected' });
      setShowInput(false);
      setUsernameInput('');
      dispatch(getPSNStatus());
    } catch (error) {
      const backendMessage = (error as { data?: { error?: { message?: string } } })?.data?.error?.message;
      toast({
        title: 'Failed to connect PlayStation Network',
        description: backendMessage ?? 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    }
  }

  async function handleSync() {
    try {
      await dispatch(syncPSN());
      toast({ title: 'PlayStation sync started — this may take a moment' });
    } catch {
      toast({ title: 'Failed to start sync', variant: 'destructive' });
    }
  }

  function handleShowInput() {
    setShowInput(true);
  }

  function handleHideInput() {
    setShowInput(false);
  }

  return (
    <PSNRow
      status={status}
      fetchStatus={fetchStatus}
      isConnecting={isConnecting}
      isSyncing={isSyncing}
      connected={connected}
      usernameInput={usernameInput}
      showInput={showInput}
      onUsernameChange={setUsernameInput}
      onShowInput={handleShowInput}
      onHideInput={handleHideInput}
      onConnect={handleConnect}
      onSync={handleSync}
    />
  );
}

export default PSNRowContainer;
