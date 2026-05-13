import { Platform } from '@grimoire/shared';
import { AlertCircle, CheckCircle2, Loader2, LogOut, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useSignOut } from '@/api/auth';
import { useConnectSteam, useGetSteamStatus, useSyncSteam } from '@/api/steam';
import { useGetMe, useUpdateMe } from '@/api/users';
import PlatformIcon from '@/components/PlatformIcon/PlatformIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/utils/cn';

import PSNRow from './components/PSNRow';
import XboxRow from './components/XboxRow';

const steamIDRegex = /^\d{17}$/;

export function SettingsPage() {
  return (
    <ScrollArea className='h-full'>
      <div className='mx-auto max-w-2xl p-5'>
        <h1 className='font-grimoire text-xl text-grimoire-ink'>Settings</h1>
        <p className='mt-1 font-sans text-sm text-grimoire-muted'>Manage your profile and platform connections</p>

        <div className='mt-6 flex flex-col gap-6'>
          <ProfileSection />
          <PlatformsSection />
        </div>
      </div>
    </ScrollArea>
  );
}

function ProfileSection() {
  const navigate = useNavigate();

  const { data: user, isLoading } = useGetMe();
  const updateMeMutation = useUpdateMe();
  const isUpdating = updateMeMutation.isPending;
  const signOutMutation = useSignOut();
  const isSigningOut = signOutMutation.isPending;

  const [nameValue, setNameValue] = useState('');
  const [editing, setEditing] = useState(false);

  function handleStartEdit() {
    setNameValue(user?.name ?? '');
    setEditing(true);
  }

  async function handleSave() {
    try {
      await updateMeMutation.mutateAsync({ name: nameValue });
      toast({ title: 'Profile updated' });
      setEditing(false);
    } catch {
      toast({ title: 'Failed to update profile', variant: 'destructive' });
    }
  }

  async function handleSignOut() {
    try {
      await signOutMutation.mutateAsync();
    } catch {
      // session may already be gone — proceed regardless
    }
    navigate(ROUTES.LOGIN, { replace: true });
  }

  return (
    <section>
      <h2 className='mb-3 font-sans text-xs font-medium uppercase tracking-wide text-grimoire-muted'>Profile</h2>
      <div className='rounded-lg border border-grimoire-border bg-grimoire-card p-4'>{isLoading ? renderSkeleton() : renderContent()}</div>
    </section>
  );

  function renderSkeleton() {
    return (
      <div className='flex flex-col gap-2'>
        <Skeleton className='h-4 w-32 rounded' />
        <Skeleton className='h-4 w-48 rounded' />
      </div>
    );
  }

  function renderContent() {
    return (
      <div className='flex flex-col gap-3'>
        {renderIdentityRow()}
        {editing && renderEditForm()}
        {renderPlanBadge()}
        {renderSignOut()}
      </div>
    );
  }

  function renderIdentityRow() {
    return (
      <div className='flex items-center justify-between'>
        <div>
          <p className='font-sans text-sm text-grimoire-ink'>{user?.name ?? '—'}</p>
          <p className='font-sans text-xs text-grimoire-muted'>{user?.email}</p>
        </div>
        {!editing && (
          <button onClick={handleStartEdit} className='font-sans text-xs text-grimoire-muted transition-colors hover:text-grimoire-ink'>
            Edit
          </button>
        )}
      </div>
    );
  }

  function renderEditForm() {
    return (
      <div className='flex flex-col gap-2'>
        <div className='flex flex-col gap-1'>
          <label className='font-sans text-xs text-grimoire-muted'>Display name</label>
          <Input value={nameValue} onChange={(e) => setNameValue(e.target.value)} placeholder='Your name' autoFocus />
        </div>
        <div className='flex justify-end gap-2'>
          <Button variant='ghost' size='sm' onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <Button size='sm' onClick={handleSave} disabled={isUpdating}>
            Save
          </Button>
        </div>
      </div>
    );
  }

  function renderPlanBadge() {
    if (!user?.plan) return null;
    return (
      <div className='flex items-center gap-2'>
        <span className='font-sans text-xs text-grimoire-muted'>Plan:</span>
        <span className='rounded-full border border-grimoire-gold-dim bg-grimoire-gold/10 px-2 py-0.5 font-sans text-xs text-grimoire-gold'>
          {user.plan}
        </span>
      </div>
    );
  }

  function renderSignOut() {
    return (
      <div className='border-t border-grimoire-border pt-3'>
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className='flex items-center gap-1.5 font-sans text-xs text-grimoire-muted transition-colors hover:text-grimoire-status-dropped-text disabled:opacity-50'
        >
          <LogOut className='h-3.5 w-3.5' />
          {isSigningOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    );
  }
}

function PlatformsSection() {
  return (
    <section>
      <h2 className='mb-3 font-sans text-xs font-medium uppercase tracking-wide text-grimoire-muted'>Platform connections</h2>
      <div className='flex flex-col divide-y divide-grimoire-border rounded-lg border border-grimoire-border bg-grimoire-card'>
        <SteamRow />
        <PSNRow />
        <XboxRow />
        <InactivePlatformRow label='Epic Games' />
      </div>
    </section>
  );
}

function SteamRow() {
  const { data: status, isLoading } = useGetSteamStatus();
  const connectSteamMutation = useConnectSteam();
  const isConnecting = connectSteamMutation.isPending;
  const syncSteamMutation = useSyncSteam();
  const isSyncing = syncSteamMutation.isPending;
  const [steamIdInput, setSteamIdInput] = useState('');
  const [showInput, setShowInput] = useState(false);

  const connected = status?.connected ?? false;

  async function handleConnect() {
    if (!steamIdInput.trim()) return;

    if (!steamIDRegex.test(steamIdInput)) {
      return;
    }

    try {
      await connectSteamMutation.mutateAsync({ steamId: steamIdInput.trim() });
      toast({ title: 'Steam account connected' });
      setShowInput(false);
      setSteamIdInput('');
    } catch {
      toast({ title: 'Failed to connect Steam', variant: 'destructive' });
    }
  }

  async function handleSync() {
    try {
      await syncSteamMutation.mutateAsync();
      toast({ title: 'Steam sync started — this may take a moment' });
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
          <PlatformIcon platform={Platform.STEAM} className='h-4 w-4' />
          <span className='font-sans text-sm text-grimoire-ink'>Steam</span>
          {renderConnectionStatus()}
        </div>
        <div className='flex items-center gap-2'>{renderActions()}</div>
      </div>
    );
  }

  function renderConnectionStatus() {
    if (isLoading) return <Skeleton className='h-4 w-16 rounded' />;
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
          value={steamIdInput}
          onChange={(e) => setSteamIdInput(e.target.value)}
          placeholder='Your Steam ID (e.g. 76561198…)'
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
        />
        <Button size='sm' onClick={handleConnect} disabled={isConnecting || !steamIdInput.trim()}>
          {isConnecting ? 'Connecting…' : 'Save'}
        </Button>
        <Button variant='ghost' size='sm' onClick={() => setShowInput(false)}>
          Cancel
        </Button>
      </div>
    );
  }
}

interface IInactivePlatformRow {
  label: string;
  platform?: Platform;
}

function InactivePlatformRow({ label, platform }: IInactivePlatformRow) {
  return (
    <div className='flex items-center justify-between px-4 py-4'>
      <div className='flex items-center gap-2'>
        {platform && <PlatformIcon platform={platform} className='h-4 w-4' />}
        <span className='font-sans text-sm text-grimoire-ink'>{label}</span>
      </div>
      <span className='font-sans text-xs text-grimoire-faint'>Coming soon</span>
    </div>
  );
}
