import { Platform } from '@grimoire/shared';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

import { useGetXboxStatus, useSyncXbox } from '@/api/xbox';
import PlatformIcon from '@/components/PlatformIcon/PlatformIcon';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/utils/cn';

const XBOX_CONNECT_URL = '/api/v1/platforms/xbox/connect/redirect';

export function XboxRow() {
  const { data: status, isLoading: isStatusLoading } = useGetXboxStatus();
  const syncXboxMutation = useSyncXbox();
  const isSyncing = syncXboxMutation.isPending;

  const connected = status?.connected ?? false;

  function handleConnect() {
    window.location.href = XBOX_CONNECT_URL;
  }

  async function handleSync() {
    try {
      await syncXboxMutation.mutateAsync();
      toast({ title: 'Xbox sync started — this may take a moment' });
    } catch {
      toast({ title: 'Failed to start sync', variant: 'destructive' });
    }
  }

  return (
    <div className='flex flex-col gap-3 px-4 py-4'>
      {renderHeader()}
      {renderLastSynced()}
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
          onClick={handleSync}
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
        onClick={handleConnect}
        className='rounded border border-grimoire-border px-3 py-1.5 font-sans text-xs text-grimoire-muted transition-colors hover:border-grimoire-border-lg hover:text-grimoire-ink'
      >
        Connect
      </button>
    );
  }

  function renderLastSynced() {
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
