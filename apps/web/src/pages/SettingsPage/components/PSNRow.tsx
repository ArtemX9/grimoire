import { Platform } from '@grimoire/shared';
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { useState } from 'react';

import { useConnectPSN, useGetPSNStatus, useSyncPSN } from '@/api/playstation';
import PlatformIcon from '@/components/PlatformIcon/PlatformIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/utils/cn';

export function PSNRow() {
  const { data: status, isLoading: isStatusLoading } = useGetPSNStatus();
  const connectPSNMutation = useConnectPSN();
  const isConnecting = connectPSNMutation.isPending;
  const syncPSNMutation = useSyncPSN();
  const isSyncing = syncPSNMutation.isPending;
  const [usernameInput, setUsernameInput] = useState('');
  const [showInput, setShowInput] = useState(false);

  const connected = status?.connected ?? false;

  async function handleConnect() {
    if (!usernameInput.trim()) return;
    try {
      await connectPSNMutation.mutateAsync({ username: usernameInput.trim() });
      toast({ title: 'PlayStation Network account connected' });
      setShowInput(false);
      setUsernameInput('');
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
      await syncPSNMutation.mutateAsync();
      toast({ title: 'PlayStation sync started — this may take a moment' });
    } catch {
      toast({ title: 'Failed to start sync', variant: 'destructive' });
    }
  }

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
    if (!showInput) {
      return (
        <button
          onClick={() => setShowInput(true)}
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
          onChange={(e) => setUsernameInput(e.target.value)}
          placeholder='Your PSN username'
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
        />
        <Button size='sm' onClick={handleConnect} disabled={isConnecting || !usernameInput.trim()}>
          {isConnecting ? 'Connecting…' : 'Save'}
        </Button>
        <Button variant='ghost' size='sm' onClick={() => setShowInput(false)}>
          Cancel
        </Button>
      </div>
    );
  }
}

export default PSNRow;
