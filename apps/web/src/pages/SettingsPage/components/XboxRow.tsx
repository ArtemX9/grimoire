import { AsyncStatus, Platform } from '@grimoire/shared';
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';

import PlatformIcon from '@/components/PlatformIcon/PlatformIcon';
import { Skeleton } from '@/components/ui/skeleton';
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
      {renderSyncMeta()}
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
    return (
      <button
        onClick={onConnect}
        className='rounded border border-grimoire-border px-3 py-1.5 font-sans text-xs text-grimoire-muted transition-colors hover:border-grimoire-border-lg hover:text-grimoire-ink'
      >
        Connect
      </button>
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
}

export default XboxRow;
