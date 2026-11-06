import { AsyncStatus, Platform } from '@grimoire/shared';
import { RefreshCw } from 'lucide-react';

import PlatformIcon from '@/components/PlatformIcon/PlatformIcon';
import PlatformSyncStatus from '@/components/PlatformSyncStatus/PlatformSyncStatus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';

interface IPSNRow {
  status: { connected: boolean; externalID?: string; isSyncing?: boolean; lastSyncAt?: Date | null } | null;
  fetchStatus: AsyncStatus;
  isConnecting: boolean;
  isSyncing: boolean;
  connected: boolean;
  usernameInput: string;
  showInput: boolean;
  onUsernameChange: (value: string) => void;
  onShowInput: () => void;
  onHideInput: () => void;
  onConnect: () => void;
  onSync: () => void;
}

function PSNRow({
  status,
  fetchStatus,
  isConnecting,
  isSyncing,
  connected,
  usernameInput,
  showInput,
  onUsernameChange,
  onShowInput,
  onHideInput,
  onConnect,
  onSync,
}: IPSNRow) {
  const isStatusLoading = fetchStatus === AsyncStatus.Loading;

  return (
    <div className='flex flex-col gap-3 px-4 py-4'>
      {renderHeader()}
      {renderExternalID()}
      {renderConnectInput()}
    </div>
  );

  function renderHeader() {
    return (
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <PlatformIcon platform={Platform.PlayStation} className='h-4 w-4' />
          <span className='font-sans text-sm text-grimoire-ink'>PlayStation Network</span>
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
    if (!showInput) {
      return (
        <Button variant='outline' size='sm' onClick={onShowInput}>
          Connect
        </Button>
      );
    }
    return null;
  }

  function renderExternalID() {
    if (!status?.externalID) return null;
    return (
      <p className='font-sans text-xs text-grimoire-muted'>
        Account: <span className='text-grimoire-ink'>{status.externalID}</span>
      </p>
    );
  }

  function renderConnectInput() {
    if (!showInput) return null;
    return (
      <div className='flex gap-2'>
        <Input
          value={usernameInput}
          onChange={(e) => onUsernameChange(e.target.value)}
          placeholder='Your PSN username'
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && onConnect()}
        />
        <Button size='sm' onClick={onConnect} disabled={isConnecting || !usernameInput.trim()}>
          {isConnecting ? 'Connecting…' : 'Save'}
        </Button>
        <Button variant='ghost' size='sm' onClick={onHideInput}>
          Cancel
        </Button>
      </div>
    );
  }
}

export default PSNRow;
