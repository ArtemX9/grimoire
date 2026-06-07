import { useEffect } from 'react';

import { toast } from '@/components/ui/use-toast';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectIsXboxConnected, selectIsXboxSyncing, selectXboxFetchStatus, selectXboxStatus } from '@/store/state/xbox/selectors';
import { getXboxStatus, syncXbox } from '@/store/thunks/xbox/index';

import XboxRow from './XboxRow';

const XBOX_CONNECT_URL = '/api/v1/platforms/xbox/connect/redirect';

function XboxRowContainer() {
  const dispatch = useAppDispatch();

  const status = useAppSelector(selectXboxStatus);
  const fetchStatus = useAppSelector(selectXboxFetchStatus);
  const isSyncing = useAppSelector(selectIsXboxSyncing);
  const connected = useAppSelector(selectIsXboxConnected);

  useEffect(function fetchXboxStatusOnMount() {
    dispatch(getXboxStatus());
  }, []);

  function handleConnect() {
    window.location.href = XBOX_CONNECT_URL;
  }

  async function handleSync() {
    try {
      await dispatch(syncXbox());
      toast({ title: 'Xbox sync started — this may take a moment' });
    } catch {
      toast({ title: 'Failed to start sync', variant: 'destructive' });
    }
  }

  return (
    <XboxRow
      status={status}
      fetchStatus={fetchStatus}
      isSyncing={isSyncing}
      connected={connected}
      onConnect={handleConnect}
      onSync={handleSync}
    />
  );
}

export default XboxRowContainer;
