import { AsyncStatus, Platform } from '@grimoire/shared';
import { RefreshCw } from 'lucide-react';

import PlatformIcon from '@/components/PlatformIcon/PlatformIcon';
import PlatformSyncStatus from '@/components/PlatformSyncStatus/PlatformSyncStatus';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

interface IXboxRow {
  status: { connected: boolean; externalID?: string; isSyncing?: boolean; lastSyncAt?: Date | null } | null;
  fetchStatus: AsyncStatus;
  isSyncing: boolean;
  connected: boolean;
  onConnect: () => void;
  onSync: () => void;
}

function XboxRow({ status, fetchStatus, isSyncing, connected, onConnect, onSync }: IXboxRow) {
  const isStatusLoading = fetchStatus === AsyncStatus.Loading;

  return (
    <div className='flex flex-col gap-3 px-4 py-4'>
      {renderHeader()}
      {renderExternalID()}
    </div>
  );

  function renderHeader() {
    return (
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <PlatformIcon platform={Platform.Xbox} className='h-4 w-4' />
          <span className='font-sans text-sm text-grimoire-ink'>Xbox</span>
          {renderConnectionStatus()}
        </div>
        <div className='flex items-center gap-2'>{renderActions()}</div>
      </div>
    );
  }

  function renderConnectionStatus() {
    return (
      <PlatformSyncStatus
        isLoading={isStatusLoading}
        connected={connected}
        isSyncing={Boolean(status?.isSyncing) || isSyncing}
        lastSyncAt={status?.lastSyncAt}
      />
    );
  }
  function renderActions() {
    if (isStatusLoading) return null;
    if (connected) {
      return (
        <Button variant='outline' size='sm' onClick={onSync} disabled={isSyncing}>
          <RefreshCw className={cn('h-3.5 w-3.5', isSyncing && 'animate-spin')} />
          {isSyncing ? 'Syncing…' : 'Sync'}
        </Button>
      );
    }
    return (
      <Button variant='outline' size='sm' onClick={onConnect}>
        Connect
      </Button>
    );
  }

  function renderExternalID() {
    if (!status?.externalID) return null;
    return (
      <p className='font-sans text-xs text-grimoire-muted'>
        Account: <span className='text-grimoire-ink'>{status.externalID}</span>
      </p>
    );
  }
}

export default XboxRow;
