import { AlertCircle, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { formatRelativeTime, isSyncStale } from '@/utils/relativeTime';

interface IPlatformSyncStatus {
  isLoading: boolean;
  connected: boolean;
  isSyncing: boolean;
  lastSyncAt?: Date | string | null;
}

function PlatformSyncStatus({ isLoading, connected, isSyncing, lastSyncAt }: IPlatformSyncStatus) {
  if (isLoading) return <Skeleton className='h-4 w-24 rounded' />;
  if (!connected) return renderNotConnected();
  if (isSyncing) return renderSyncing();
  if (isSyncStale(lastSyncAt)) return renderStale();

  return renderFresh();

  function renderNotConnected() {
    return (
      <span className='flex items-center gap-1 font-sans text-xs text-grimoire-muted'>
        <AlertCircle className='h-3 w-3' />
        Not connected
      </span>
    );
  }

  function renderSyncing() {
    return (
      <span className='flex items-center gap-1 font-sans text-xs text-grimoire-muted'>
        <Loader2 className='h-3 w-3 animate-spin' />
        Syncing library…
      </span>
    );
  }

  function renderStale() {
    const label = lastSyncAt ? `Synced ${formatRelativeTime(lastSyncAt)}` : 'Never synced';

    return (
      <span
        className='flex items-center gap-1 font-sans text-xs text-grimoire-status-wishlist-text'
        title='Last sync is over a week old — the token may have expired. Try Sync; reconnect if it fails.'
      >
        <AlertTriangle className='h-3 w-3' />
        {label}
      </span>
    );
  }

  function renderFresh() {
    return (
      <span
        className='flex items-center gap-1 font-sans text-xs text-grimoire-status-playing-text'
        title={lastSyncAt ? new Date(lastSyncAt).toLocaleString() : undefined}
      >
        <CheckCircle2 className='h-3 w-3' />
        Synced {formatRelativeTime(lastSyncAt!)}
      </span>
    );
  }
}

export default PlatformSyncStatus;
