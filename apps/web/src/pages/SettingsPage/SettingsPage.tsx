import { AlertCircle, CheckCircle2, LogOut, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '@/api/api';
import { useSignOutMutation } from '@/api/authApi';
import { useConnectPsnMutation, useGetPsnStatusQuery, useSyncPsnMutation } from '@/api/psnApi';
import { useConnectRaMutation, useGetRaStatusQuery, useSyncRaMutation } from '@/api/retroachievementsApi';
import { useConnectSteamMutation, useGetSteamStatusQuery, useSyncSteamMutation } from '@/api/steamApi';
import { useConnectXboxMutation, useGetXboxStatusQuery, useSyncXboxMutation } from '@/api/xboxApi';
import { useGetMeQuery, useUpdateMeMutation } from '@/api/usersApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { ROUTES } from '@/constants/routes';
import { useAppDispatch } from '@/store/hooks';
import { cn } from '@/utils/cn';

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
  const dispatch = useAppDispatch();

  const { data: user, isLoading } = useGetMeQuery();
  const [updateMe, { isLoading: isUpdating }] = useUpdateMeMutation();
  const [signOut, { isLoading: isSigningOut }] = useSignOutMutation();

  const [nameValue, setNameValue] = useState('');
  const [editing, setEditing] = useState(false);

  function handleStartEdit() {
    setNameValue(user?.name ?? '');
    setEditing(true);
  }

  async function handleSave() {
    try {
      await updateMe({ name: nameValue }).unwrap();
      toast({ title: 'Profile updated' });
      setEditing(false);
    } catch {
      toast({ title: 'Failed to update profile', variant: 'destructive' });
    }
  }

  async function handleSignOut() {
    try {
      await signOut().unwrap();
    } catch {
      // session may already be gone — proceed regardless
    }
    dispatch(api.util.resetApiState());
    navigate(ROUTES.LOGIN, { replace: true });
  }

  return (
    <section>
      <h2 className='mb-3 font-sans text-xs font-medium uppercase tracking-wide text-grimoire-muted'>Profile</h2>
      <div className='rounded-lg border border-grimoire-border bg-grimoire-card p-4'>
        {isLoading ? (
          <div className='flex flex-col gap-2'>
            <Skeleton className='h-4 w-32 rounded' />
            <Skeleton className='h-4 w-48 rounded' />
          </div>
        ) : (
          <div className='flex flex-col gap-3'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='font-sans text-sm text-grimoire-ink'>{user?.name ?? '—'}</p>
                <p className='font-sans text-xs text-grimoire-muted'>{user?.email}</p>
              </div>
              {!editing && (
                <button
                  onClick={handleStartEdit}
                  className='font-sans text-xs text-grimoire-muted transition-colors hover:text-grimoire-ink'
                >
                  Edit
                </button>
              )}
            </div>

            {editing && (
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
            )}

            {user?.plan && (
              <div className='flex items-center gap-2'>
                <span className='font-sans text-xs text-grimoire-muted'>Plan:</span>
                <span className='rounded-full border border-grimoire-gold-dim bg-grimoire-gold/10 px-2 py-0.5 font-sans text-xs text-grimoire-gold'>
                  {user.plan}
                </span>
              </div>
            )}

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
          </div>
        )}
      </div>
    </section>
  );
}

function PlatformsSection() {
  return (
    <section>
      <h2 className='mb-3 font-sans text-xs font-medium uppercase tracking-wide text-grimoire-muted'>Platform connections</h2>
      <div className='flex flex-col divide-y divide-grimoire-border rounded-lg border border-grimoire-border bg-grimoire-card'>
        <SteamRow />
        <PsnRow />
        <XboxRow />
        <RetroAchievementsRow />
        <InactivePlatformRow label='Epic Games' />
      </div>
    </section>
  );
}

// ─── Shared platform row shell ───────────────────────────────────────────────

interface PlatformRowProps {
  label: string;
  isLoading: boolean;
  connected: boolean;
  lastSyncAt?: string;
  isSyncing: boolean;
  onSync: () => void;
  showInput: boolean;
  onShowInput: () => void;
  inputNode: React.ReactNode;
}

function PlatformRow({
  label,
  isLoading,
  connected,
  lastSyncAt,
  isSyncing,
  onSync,
  showInput,
  onShowInput,
  inputNode,
}: PlatformRowProps) {
  return (
    <div className='flex flex-col gap-3 px-4 py-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <span className='font-sans text-sm text-grimoire-ink'>{label}</span>
          {isLoading ? (
            <Skeleton className='h-4 w-16 rounded' />
          ) : connected ? (
            <span className='flex items-center gap-1 font-sans text-xs text-grimoire-status-playing-text'>
              <CheckCircle2 className='h-3 w-3' />
              Connected
            </span>
          ) : (
            <span className='flex items-center gap-1 font-sans text-xs text-grimoire-muted'>
              <AlertCircle className='h-3 w-3' />
              Not connected
            </span>
          )}
        </div>

        <div className='flex items-center gap-2'>
          {connected && (
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
          )}
          {!connected && !showInput && (
            <button
              onClick={onShowInput}
              className='rounded border border-grimoire-border px-3 py-1.5 font-sans text-xs text-grimoire-muted transition-colors hover:border-grimoire-border-lg hover:text-grimoire-ink'
            >
              Connect
            </button>
          )}
        </div>
      </div>

      {lastSyncAt && (
        <p className='font-sans text-xs text-grimoire-muted'>
          Last synced:{' '}
          {new Date(lastSyncAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      )}

      {showInput && inputNode}
    </div>
  );
}

// ─── Steam ───────────────────────────────────────────────────────────────────

function SteamRow() {
  const { data: status, isLoading } = useGetSteamStatusQuery();
  const [connectSteam, { isLoading: isConnecting }] = useConnectSteamMutation();
  const [syncSteam, { isLoading: isSyncing }] = useSyncSteamMutation();
  const [input, setInput] = useState('');
  const [showInput, setShowInput] = useState(false);

  const connected = status?.connected ?? false;

  async function handleConnect() {
    if (!input.trim()) return;
    try {
      await connectSteam({ steamId: input.trim() }).unwrap();
      toast({ title: 'Steam account connected' });
      setShowInput(false);
      setInput('');
    } catch {
      toast({ title: 'Failed to connect Steam', variant: 'destructive' });
    }
  }

  async function handleSync() {
    try {
      await syncSteam().unwrap();
      toast({ title: 'Steam sync started — this may take a moment' });
    } catch {
      toast({ title: 'Failed to start sync', variant: 'destructive' });
    }
  }

  return (
    <PlatformRow
      label='Steam'
      isLoading={isLoading}
      connected={connected}
      lastSyncAt={status?.lastSyncAt}
      isSyncing={isSyncing}
      onSync={handleSync}
      showInput={showInput}
      onShowInput={() => setShowInput(true)}
      inputNode={
        <div className='flex gap-2'>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Your Steam ID (e.g. 76561198…)'
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
          />
          <Button size='sm' onClick={handleConnect} disabled={isConnecting || !input.trim()}>
            {isConnecting ? 'Connecting…' : 'Save'}
          </Button>
          <Button variant='ghost' size='sm' onClick={() => setShowInput(false)}>
            Cancel
          </Button>
        </div>
      }
    />
  );
}

// ─── PSN ─────────────────────────────────────────────────────────────────────

function PsnRow() {
  const { data: status, isLoading } = useGetPsnStatusQuery();
  const [connectPsn, { isLoading: isConnecting }] = useConnectPsnMutation();
  const [syncPsn, { isLoading: isSyncing }] = useSyncPsnMutation();
  const [input, setInput] = useState('');
  const [showInput, setShowInput] = useState(false);

  const connected = status?.connected ?? false;

  async function handleConnect() {
    if (!input.trim()) return;
    try {
      await connectPsn({ psnUsername: input.trim() }).unwrap();
      toast({ title: 'PlayStation Network account connected' });
      setShowInput(false);
      setInput('');
    } catch {
      toast({ title: 'Failed to connect PSN', variant: 'destructive' });
    }
  }

  async function handleSync() {
    try {
      await syncPsn().unwrap();
      toast({ title: 'PSN sync started — make sure your profile is set to Public' });
    } catch {
      toast({ title: 'Failed to start PSN sync', variant: 'destructive' });
    }
  }

  return (
    <PlatformRow
      label='PlayStation Network'
      isLoading={isLoading}
      connected={connected}
      lastSyncAt={status?.lastSyncAt}
      isSyncing={isSyncing}
      onSync={handleSync}
      showInput={showInput}
      onShowInput={() => setShowInput(true)}
      inputNode={
        <div className='flex flex-col gap-2'>
          <p className='font-sans text-xs text-grimoire-muted'>
            Your PSN profile must be set to <strong>Public</strong> in PlayStation privacy settings.
          </p>
          <div className='flex gap-2'>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Your PSN username'
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            />
            <Button size='sm' onClick={handleConnect} disabled={isConnecting || !input.trim()}>
              {isConnecting ? 'Connecting…' : 'Save'}
            </Button>
            <Button variant='ghost' size='sm' onClick={() => setShowInput(false)}>
              Cancel
            </Button>
          </div>
        </div>
      }
    />
  );
}

// ─── Xbox ─────────────────────────────────────────────────────────────────────

function XboxRow() {
  const { data: status, isLoading } = useGetXboxStatusQuery();
  const [connectXbox, { isLoading: isConnecting }] = useConnectXboxMutation();
  const [syncXbox, { isLoading: isSyncing }] = useSyncXboxMutation();
  const [input, setInput] = useState('');
  const [showInput, setShowInput] = useState(false);

  const connected = status?.connected ?? false;

  async function handleConnect() {
    if (!input.trim()) return;
    try {
      await connectXbox({ gamertag: input.trim() }).unwrap();
      toast({ title: 'Xbox account connected' });
      setShowInput(false);
      setInput('');
    } catch {
      toast({ title: 'Failed to connect Xbox', variant: 'destructive' });
    }
  }

  async function handleSync() {
    try {
      await syncXbox().unwrap();
      toast({ title: 'Xbox sync started — this may take a moment' });
    } catch {
      toast({ title: 'Failed to start Xbox sync', variant: 'destructive' });
    }
  }

  return (
    <PlatformRow
      label='Xbox'
      isLoading={isLoading}
      connected={connected}
      lastSyncAt={status?.lastSyncAt}
      isSyncing={isSyncing}
      onSync={handleSync}
      showInput={showInput}
      onShowInput={() => setShowInput(true)}
      inputNode={
        <div className='flex gap-2'>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Your Xbox gamertag'
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
          />
          <Button size='sm' onClick={handleConnect} disabled={isConnecting || !input.trim()}>
            {isConnecting ? 'Connecting…' : 'Save'}
          </Button>
          <Button variant='ghost' size='sm' onClick={() => setShowInput(false)}>
            Cancel
          </Button>
        </div>
      }
    />
  );
}

// ─── RetroAchievements ────────────────────────────────────────────────────────

function RetroAchievementsRow() {
  const { data: status, isLoading } = useGetRaStatusQuery();
  const [connectRa, { isLoading: isConnecting }] = useConnectRaMutation();
  const [syncRa, { isLoading: isSyncing }] = useSyncRaMutation();
  const [input, setInput] = useState('');
  const [showInput, setShowInput] = useState(false);

  const connected = status?.connected ?? false;

  async function handleConnect() {
    if (!input.trim()) return;
    try {
      await connectRa({ raUsername: input.trim() }).unwrap();
      toast({ title: 'RetroAchievements account connected' });
      setShowInput(false);
      setInput('');
    } catch {
      toast({ title: 'Failed to connect RetroAchievements', variant: 'destructive' });
    }
  }

  async function handleSync() {
    try {
      await syncRa().unwrap();
      toast({ title: 'RetroAchievements sync started' });
    } catch {
      toast({ title: 'Failed to start RetroAchievements sync', variant: 'destructive' });
    }
  }

  return (
    <PlatformRow
      label='RetroAchievements'
      isLoading={isLoading}
      connected={connected}
      lastSyncAt={status?.lastSyncAt}
      isSyncing={isSyncing}
      onSync={handleSync}
      showInput={showInput}
      onShowInput={() => setShowInput(true)}
      inputNode={
        <div className='flex gap-2'>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Your RetroAchievements username'
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
          />
          <Button size='sm' onClick={handleConnect} disabled={isConnecting || !input.trim()}>
            {isConnecting ? 'Connecting…' : 'Save'}
          </Button>
          <Button variant='ghost' size='sm' onClick={() => setShowInput(false)}>
            Cancel
          </Button>
        </div>
      }
    />
  );
}

// ─── Inactive (coming soon) ───────────────────────────────────────────────────

interface IInactivePlatformRow {
  label: string;
}

function InactivePlatformRow({ label }: IInactivePlatformRow) {
  return (
    <div className='flex items-center justify-between px-4 py-4'>
      <span className='font-sans text-sm text-grimoire-ink'>{label}</span>
      <span className='font-sans text-xs text-grimoire-faint'>Coming soon</span>
    </div>
  );
}
