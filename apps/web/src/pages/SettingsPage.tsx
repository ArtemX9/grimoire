import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, CheckCircle2, AlertCircle, LogOut } from 'lucide-react'

import { useSignOutMutation } from '@/features/auth/authApi'
import { useGetMeQuery, useUpdateMeMutation } from '@/features/users/usersApi'
import { useGetSteamStatusQuery, useConnectSteamMutation, useSyncSteamMutation } from '@/features/platforms/steam/steamApi'
import { useAppDispatch } from '@/app/hooks'
import { api } from '@/app/api'
import { cn } from '@/shared/utils/cn'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { toast } from '@/shared/components/ui/use-toast'

export function SettingsPage() {
  return (
    <ScrollArea className='h-full'>
      <div className='mx-auto max-w-2xl p-5'>
        <h1 className='font-grimoire text-xl text-grimoire-ink'>Settings</h1>
        <p className='mt-1 font-sans text-sm text-grimoire-muted'>
          Manage your profile and platform connections
        </p>

        <div className='mt-6 flex flex-col gap-6'>
          <ProfileSection />
          <PlatformsSection />
        </div>
      </div>
    </ScrollArea>
  )
}

function ProfileSection() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const { data: user, isLoading } = useGetMeQuery()
  const [updateMe, { isLoading: isUpdating }] = useUpdateMeMutation()
  const [signOut, { isLoading: isSigningOut }] = useSignOutMutation()

  const [nameValue, setNameValue] = useState('')
  const [editing, setEditing] = useState(false)

  function handleStartEdit() {
    setNameValue(user?.name ?? '')
    setEditing(true)
  }

  async function handleSave() {
    try {
      await updateMe({ name: nameValue }).unwrap()
      toast({ title: 'Profile updated' })
      setEditing(false)
    } catch {
      toast({ title: 'Failed to update profile', variant: 'destructive' })
    }
  }

  async function handleSignOut() {
    try {
      await signOut().unwrap()
    } catch {
      // session may already be gone — proceed regardless
    }
    dispatch(api.util.resetApiState())
    navigate('/auth', { replace: true })
  }

  return (
    <section>
      <h2 className='mb-3 font-sans text-xs font-medium uppercase tracking-wide text-grimoire-muted'>
        Profile
      </h2>
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
                  <Input
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    placeholder='Your name'
                    autoFocus
                  />
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
  )
}

function PlatformsSection() {
  return (
    <section>
      <h2 className='mb-3 font-sans text-xs font-medium uppercase tracking-wide text-grimoire-muted'>
        Platform connections
      </h2>
      <div className='flex flex-col divide-y divide-grimoire-border rounded-lg border border-grimoire-border bg-grimoire-card'>
        <SteamRow />
        <InactivePlatformRow label='PlayStation Network' />
        <InactivePlatformRow label='Xbox' />
        <InactivePlatformRow label='Epic Games' />
      </div>
    </section>
  )
}

function SteamRow() {
  const { data: status, isLoading } = useGetSteamStatusQuery()
  const [connectSteam, { isLoading: isConnecting }] = useConnectSteamMutation()
  const [syncSteam, { isLoading: isSyncing }] = useSyncSteamMutation()
  const [steamIdInput, setSteamIdInput] = useState('')
  const [showInput, setShowInput] = useState(false)

  const connected = status?.connected ?? false

  async function handleConnect() {
    if (!steamIdInput.trim()) return
    try {
      await connectSteam({ steamId: steamIdInput.trim() }).unwrap()
      toast({ title: 'Steam account connected' })
      setShowInput(false)
      setSteamIdInput('')
    } catch {
      toast({ title: 'Failed to connect Steam', variant: 'destructive' })
    }
  }

  async function handleSync() {
    try {
      await syncSteam().unwrap()
      toast({ title: 'Steam sync started — this may take a moment' })
    } catch {
      toast({ title: 'Failed to start sync', variant: 'destructive' })
    }
  }

  return (
    <div className='flex flex-col gap-3 px-4 py-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <span className='font-sans text-sm text-grimoire-ink'>Steam</span>
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
              onClick={handleSync}
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
              onClick={() => setShowInput(true)}
              className='rounded border border-grimoire-border px-3 py-1.5 font-sans text-xs text-grimoire-muted transition-colors hover:border-grimoire-border-lg hover:text-grimoire-ink'
            >
              Connect
            </button>
          )}
        </div>
      </div>

      {status?.lastSyncAt && (
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
      )}

      {showInput && (
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
      )}
    </div>
  )
}

interface IInactivePlatformRow {
  label: string
}

function InactivePlatformRow({ label }: IInactivePlatformRow) {
  return (
    <div className='flex items-center justify-between px-4 py-4'>
      <span className='font-sans text-sm text-grimoire-ink'>{label}</span>
      <span className='font-sans text-xs text-grimoire-faint'>Coming soon</span>
    </div>
  )
}

