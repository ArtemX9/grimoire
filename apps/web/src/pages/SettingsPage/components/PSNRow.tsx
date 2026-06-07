import { AsyncStatus, Platform } from '@grimoire/shared';
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';

import PlatformIcon from '@/components/PlatformIcon/PlatformIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
      {renderSyncMeta()}
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
    if (isStatusLoading) {
      return <Skeleton className='h-4 w-20' />;
    }
    if (connected) {
      return (
        <span className='flex items-center gap-1 font-sans text-xs text-grimoire-status-playing-text'>
          <CheckCircle2 className='h-3 w-3' />
          Connected
        </span>
      );
    }
    return (
      <span className='flex items-center gap-1 font-sans text-xs text-grimoire-muted'>
        <AlertCircle className='h-3 w-3' />
        Not connected
      </span>
    );
  }

  function renderActions() {
    if (isStatusLoading) return null;
    if (connected) {
      return (
        <button
          onClick={onSync}
          disabled={isSyncing}
          className={cn(
            'flex items-center gap-1.5 rounded border border-grimoire-border px-3 py-1.5 font-sans text-xs text-grimoire-muted transition-colors hover:border-grimoire-border-lg hover:text-grimoire-ink disabled:opacity-50',
          )}
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isSyncing && 'animate-spin')} />
          {isSyncing ? 'Syncing…' : 'Sync'}
        </button>
      );
    }
    if (!showInput) {
      return (
        <button
          onClick={onShowInput}
          className='rounded border border-grimoire-border px-3 py-1.5 font-sans text-xs text-grimoire-muted transition-colors hover:border-grimoire-border-lg hover:text-grimoire-ink'
        >
          Connect
        </button>
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

  function renderSyncMeta() {
    if (!connected) return null;
    if (status?.isSyncing) {
      return (
        <p className='flex items-center gap-1.5 font-sans text-xs text-grimoire-muted'>
          <Loader2 className='h-3 w-3 animate-spin' />
          Syncing library…
        </p>
      );
    }
    if (!status?.lastSyncAt) return null;
    return (
      <p className='font-sans text-xs text-grimoire-muted'>
        Last synced:{' '}
        {new Date(status.lastSyncAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
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
