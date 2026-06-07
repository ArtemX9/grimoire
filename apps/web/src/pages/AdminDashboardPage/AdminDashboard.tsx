import { Platform, Role } from '@grimoire/shared';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ROUTES } from '@/constants/routes';
import { CreateUserDialogContainer } from '@/pages/AdminDashboardPage/components/CreateUserDialog/CreateUserDialogContainer';
import PlatformRow from '@/pages/AdminDashboardPage/components/PlatformRow/PlatformRow';
import { UserRow } from '@/pages/AdminDashboardPage/components/UserRow/UserRow';
import type { AdminUserRow, PlatformTokenInfo } from '@/store/thunks/admin/types';

interface IAdminDashboard {
  users: AdminUserRow[];
  isLoading: boolean;
  globalAiEnabled: boolean;
  isCreateDialogOpen: boolean;
  currentUserID: string | null;
  platformsTokens?: PlatformTokenInfo;
  onToggleGlobalAi: (enabled: boolean) => void;
  onDeleteUser: (id: string) => void;
  onAiEnabledChange: (id: string, enabled: boolean) => void;
  onAiLimitChange: (id: string, limit: number | null) => void;
  onPlanChange: (id: string, plan: string) => void;
  onRoleChange: (userID: string, role: Role) => void;
  onOpenCreateDialog: () => void;
  onCloseCreateDialog: () => void;
  onPlatformTokenUpdate: (platformID: Platform, newToken: string, newValidityFrame: number) => void;
}

export function AdminDashboard({
  users,
  isLoading,
  globalAiEnabled,
  isCreateDialogOpen,
  currentUserID,
  platformsTokens,
  onToggleGlobalAi,
  onDeleteUser,
  onAiEnabledChange,
  onAiLimitChange,
  onPlanChange,
  onRoleChange,
  onOpenCreateDialog,
  onCloseCreateDialog,
  onPlatformTokenUpdate,
}: IAdminDashboard) {
  return (
    <div className='flex flex-col gap-6 p-6'>
      {renderHeader()}
      {renderAiGlobalToggle()}
      {renderUsers()}
      {renderPlatformsTokens()}
      <CreateUserDialogContainer open={isCreateDialogOpen} onClose={onCloseCreateDialog} />
    </div>
  );

  function renderHeader() {
    return (
      <div className='flex items-center justify-between'>
        <h1 className='font-grimoire text-xl text-grimoire-ink'>Admin</h1>
        <Link to={ROUTES.DEFAULT} className='font-sans text-sm text-grimoire-muted transition-colors hover:text-grimoire-ink'>Dashboard</Link>
      </div>
    );
  }

  function renderAiGlobalToggle() {
    return (
      <div className='flex items-center gap-3 rounded border border-grimoire-border bg-grimoire-card px-4 py-3'>
        <span className='flex-1 font-sans text-sm text-grimoire-ink'>AI features</span>
        <span className='font-sans text-xs text-grimoire-muted'>{globalAiEnabled ? 'Enabled globally' : 'Disabled globally'}</span>
        <Switch checked={globalAiEnabled} onCheckedChange={onToggleGlobalAi} />
      </div>
    );
  }

  function renderUsers() {
    return (
      <div className='rounded border border-grimoire-border bg-grimoire-card'>
        <div className='flex p-2 '>
          <Button onClick={onOpenCreateDialog} className='bg-grimoire-gold text-grimoire-deep hover:bg-grimoire-gold-bright'>
            Create user
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Games</TableHead>
              <TableHead>AI requests</TableHead>
              <TableHead>AI enabled</TableHead>
              <TableHead>Request limit</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && renderSkeletonRows()}
            {!isLoading && users.length === 0 && renderEmptyState()}
            {!isLoading &&
              users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  globalAiEnabled={globalAiEnabled}
                  isSelf={user.id === currentUserID}
                  onDelete={onDeleteUser}
                  onAiEnabledChange={onAiEnabledChange}
                  onAiLimitChange={onAiLimitChange}
                  onPlanChange={onPlanChange}
                  onRoleChange={onRoleChange}
                />
              ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  function renderPlatformsTokens() {
    return (
      <div className='rounded border border-grimoire-border bg-grimoire-card'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Platform</TableHead>
              <TableHead>Is Token Valid</TableHead>
              <TableHead>Days Before Expiry</TableHead>
              <TableHead>Token</TableHead>
              <TableHead>Token Updated Date</TableHead>
              <TableHead>Token Expiration Frame</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && renderSkeletonRows()}
            {!isLoading && (
              <PlatformRow
                key={Platform.PlayStation}
                platformName={Platform.PlayStation}
                exists={!!platformsTokens?.[Platform.PlayStation]}
                isLoading={platformsTokens?.[Platform.PlayStation]?.isLoading ?? false}
                token={platformsTokens?.[Platform.PlayStation]?.token ?? ''}
                tokenUpdateDate={platformsTokens?.[Platform.PlayStation]?.dateSet ?? new Date()}
                tokenValidityFrame={platformsTokens?.[Platform.PlayStation]?.tokenValidityFrame ?? 30}
                onPlatformRowUpdate={onPlatformTokenUpdate.bind(null, Platform.PlayStation)}
              />
            )}
          </TableBody>
        </Table>
      </div>
    );
  }

  function renderSkeletonRows() {
    return Array.from({ length: 3 }).map((_, i) => (
      <TableRow key={i}>
        <TableCell>
          <Skeleton className='h-4 w-32 rounded' />
        </TableCell>
        <TableCell>
          <Skeleton className='h-4 w-12 rounded' />
        </TableCell>
        <TableCell>
          <Skeleton className='h-4 w-16 rounded' />
        </TableCell>
        <TableCell>
          <Skeleton className='h-4 w-8 rounded' />
        </TableCell>
        <TableCell>
          <Skeleton className='h-4 w-8 rounded' />
        </TableCell>
        <TableCell>
          <Skeleton className='h-4 w-8 rounded' />
        </TableCell>
        <TableCell>
          <Skeleton className='h-4 w-16 rounded' />
        </TableCell>
        <TableCell>
          <Skeleton className='h-4 w-8 rounded' />
        </TableCell>
      </TableRow>
    ));
  }

  function renderEmptyState() {
    return (
      <TableRow>
        <TableCell colSpan={8} className='py-8 text-center font-sans text-sm text-grimoire-muted'>
          No users yet.
        </TableCell>
      </TableRow>
    );
  }
}
