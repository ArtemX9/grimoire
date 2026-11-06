import { Platform, User } from '@grimoire/shared';
import { Download, Loader2, LogOut, RefreshCw } from 'lucide-react';

import PlatformIcon from '@/components/PlatformIcon/PlatformIcon';
import PlatformSyncStatus from '@/components/PlatformSyncStatus/PlatformSyncStatus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';
import { ExportFormat } from '@/utils/exportLibrary';

import PSNRowContainer from './components/PSNRowContainer';
import XboxRowContainer from './components/XboxRowContainer';

type SteamStatus = {
  connected: boolean;
  externalID?: string;
  isSyncing?: boolean;
  lastSyncAt?: Date | null;
} | null;

type UserSession = {
  user: { email: string };
} | null;

interface ISettingsPage {
  user: User | null;
  session: UserSession;
  isUserLoading: boolean;
  isUserUpdating: boolean;
  isSigningOut: boolean;
  nameValue: string;
  editing: boolean;
  steamStatus: SteamStatus;
  isSteamLoading: boolean;
  isSteamConnecting: boolean;
  isSteamSyncing: boolean;
  isSteamConnected: boolean;
  steamIdInput: string;
  showSteamInput: boolean;
  onNameChange: (value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onSignOut: () => void;
  onShowSteamInput: () => void;
  onHideSteamInput: () => void;
  onSteamIdChange: (value: string) => void;
  onSteamConnect: () => void;
  onSteamSync: () => void;
  exportingFormat: ExportFormat | null;
  onExport: (format: ExportFormat) => void;
}

export function SettingsPage({
  user,
  session,
  isUserLoading,
  isUserUpdating,
  isSigningOut,
  nameValue,
  editing,
  steamStatus,
  isSteamLoading,
  isSteamConnecting,
  isSteamSyncing,
  isSteamConnected,
  steamIdInput,
  showSteamInput,
  onNameChange,
  onStartEdit,
  onCancelEdit,
  onSave,
  onSignOut,
  onShowSteamInput,
  onHideSteamInput,
  onSteamIdChange,
  onSteamConnect,
  onSteamSync,
  exportingFormat,
  onExport,
}: ISettingsPage) {
  return (
    <ScrollArea className='h-full'>
      <div className='mx-auto max-w-2xl p-5'>
        <h1 className='font-grimoire text-xl text-grimoire-ink'>Settings</h1>
        <p className='mt-1 font-sans text-sm text-grimoire-muted'>Manage your profile and platform connections</p>

        <div className='mt-6 flex flex-col gap-6'>
          {renderProfileSection()}
          {renderPlatformsSection()}
          {renderDataSection()}
        </div>
      </div>
    </ScrollArea>
  );

  function renderProfileSection() {
    return (
      <section>
        <h2 className='mb-3 font-sans text-xs font-medium uppercase tracking-wide text-grimoire-muted'>Profile</h2>
        <div className='rounded-lg border border-grimoire-border bg-grimoire-card p-4'>
          {isUserLoading ? renderProfileSkeleton() : renderProfileContent()}
        </div>
      </section>
    );
  }

  function renderProfileSkeleton() {
    return (
      <div className='flex flex-col gap-2'>
        <Skeleton className='h-4 w-32 rounded' />
        <Skeleton className='h-4 w-48 rounded' />
      </div>
    );
  }

  function renderProfileContent() {
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
          <p className='font-sans text-xs text-grimoire-muted'>{user?.email ?? session?.user.email}</p>
        </div>
        {!editing && (
          <button onClick={onStartEdit} className='font-sans text-xs text-grimoire-muted transition-colors hover:text-grimoire-ink'>
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
          <Input value={nameValue} onChange={(e) => onNameChange(e.target.value)} placeholder='Your name' autoFocus />
        </div>
        <div className='flex justify-end gap-2'>
          <Button variant='ghost' size='sm' onClick={onCancelEdit}>
            Cancel
          </Button>
          <Button size='sm' onClick={onSave} disabled={isUserUpdating}>
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
          onClick={onSignOut}
          disabled={isSigningOut}
          className='flex items-center gap-1.5 font-sans text-xs text-grimoire-muted transition-colors hover:text-grimoire-status-dropped-text disabled:opacity-50'
        >
          <LogOut className='h-3.5 w-3.5' />
          {isSigningOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    );
  }

  function renderDataSection() {
    return (
      <section>
        <h2 className='mb-3 font-sans text-xs font-medium uppercase tracking-wide text-grimoire-muted'>Your data</h2>
        <div className='flex flex-col gap-3 rounded-lg border border-grimoire-border bg-grimoire-card p-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <p className='font-sans text-sm text-grimoire-ink'>Export library</p>
            <p className='font-sans text-xs text-grimoire-muted'>Every game with status, playtime, rating, moods and notes</p>
          </div>
          <div className='flex gap-2'>
            {renderExportButton(ExportFormat.JSON, 'JSON')}
            {renderExportButton(ExportFormat.CSV, 'CSV')}
          </div>
        </div>
      </section>
    );
  }

  function renderExportButton(format: ExportFormat, label: string) {
    const isExporting = exportingFormat === format;

    return (
      <Button variant='outline' size='sm' onClick={onExport.bind(null, format)} disabled={exportingFormat !== null}>
        {isExporting ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <Download className='h-3.5 w-3.5' />}
        {label}
      </Button>
    );
  }

  function renderPlatformsSection() {
    return (
      <section>
        <h2 className='mb-3 font-sans text-xs font-medium uppercase tracking-wide text-grimoire-muted'>Platform connections</h2>
        <div className='flex flex-col divide-y divide-grimoire-border rounded-lg border border-grimoire-border bg-grimoire-card'>
          {renderSteamRow()}
          <PSNRowContainer />
          <XboxRowContainer />
          {renderInactivePlatformRow('Epic Games')}
        </div>
      </section>
    );
  }

  function renderSteamRow() {
    return (
      <div className='flex flex-col gap-3 px-4 py-4'>
        {renderSteamHeader()}
        {renderSteamExternalID()}
        {renderSteamConnectInput()}
      </div>
    );
  }

  function renderSteamHeader() {
    return (
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <PlatformIcon platform={Platform.STEAM} className='h-4 w-4' />
          <span className='font-sans text-sm text-grimoire-ink'>Steam</span>
          {renderSteamConnectionStatus()}
        </div>
        <div className='flex items-center gap-2'>{renderSteamActions()}</div>
      </div>
    );
  }

  function renderSteamConnectionStatus() {
    return (
      <PlatformSyncStatus
        isLoading={isSteamLoading}
        connected={isSteamConnected}
        isSyncing={Boolean(steamStatus?.isSyncing) || isSteamSyncing}
        lastSyncAt={steamStatus?.lastSyncAt}
      />
    );
  }
  function renderSteamActions() {
    if (isSteamConnected) {
      return (
        <Button variant='outline' size='sm' onClick={onSteamSync} disabled={isSteamSyncing}>
          <RefreshCw className={cn('h-3.5 w-3.5', isSteamSyncing && 'animate-spin')} />
          {isSteamSyncing ? 'Syncing…' : 'Sync'}
        </Button>
      );
    }
    if (!showSteamInput) {
      return (
        <Button variant='outline' size='sm' onClick={onShowSteamInput}>
          Connect
        </Button>
      );
    }
    return null;
  }

  function renderSteamExternalID() {
    if (!steamStatus?.externalID) return null;
    return (
      <p className='font-sans text-xs text-grimoire-muted'>
        Account: <span className='text-grimoire-ink'>{steamStatus.externalID}</span>
      </p>
    );
  }

  function renderSteamConnectInput() {
    if (!showSteamInput) return null;
    return (
      <div className='flex gap-2'>
        <Input
          value={steamIdInput}
          onChange={(e) => onSteamIdChange(e.target.value)}
          placeholder='Your Steam ID (e.g. 76561198…)'
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && onSteamConnect()}
        />
        <Button size='sm' onClick={onSteamConnect} disabled={isSteamConnecting || !steamIdInput.trim()}>
          {isSteamConnecting ? 'Connecting…' : 'Save'}
        </Button>
        <Button variant='ghost' size='sm' onClick={onHideSteamInput}>
          Cancel
        </Button>
      </div>
    );
  }

  function renderInactivePlatformRow(label: string, platform?: Platform) {
    return (
      <div className='flex items-center justify-between px-4 py-4'>
        <div className='flex items-center gap-2'>
          {platform && <PlatformIcon platform={platform} className='h-4 w-4' />}
          <span className='font-sans text-sm text-grimoire-ink'>{label}</span>
        </div>
        <span className='font-sans text-xs text-grimoire-muted'>Coming soon</span>
      </div>
    );
  }
}
