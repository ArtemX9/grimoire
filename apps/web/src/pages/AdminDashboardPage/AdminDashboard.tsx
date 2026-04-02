import { AdminUserRow } from '@/api/adminApi';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreateUserDialogContainer } from '@/pages/AdminDashboardPage/components/CreateUserDialog/CreateUserDialogContainer';
import { UserRow } from '@/pages/AdminDashboardPage/components/UserRow/UserRow';

interface IAdminDashboard {
  users: AdminUserRow[];
  isLoading: boolean;
  globalAiEnabled: boolean;
  isCreateDialogOpen: boolean;
  onToggleGlobalAi: (enabled: boolean) => void;
  onDeleteUser: (id: string) => void;
  onAiEnabledChange: (id: string, enabled: boolean) => void;
  onAiLimitChange: (id: string, limit: number | null) => void;
  onPlanChange: (id: string, plan: string) => void;
  onOpenCreateDialog: () => void;
  onCloseCreateDialog: () => void;
}

export function AdminDashboard({
  users,
  isLoading,
  globalAiEnabled,
  isCreateDialogOpen,
  onToggleGlobalAi,
  onDeleteUser,
  onAiEnabledChange,
  onAiLimitChange,
  onPlanChange,
  onOpenCreateDialog,
  onCloseCreateDialog,
}: IAdminDashboard) {
  return (
    <div className='flex flex-col gap-6 p-6'>
      {renderHeader()}
      {renderAiGlobalToggle()}
      {renderTable()}
      <CreateUserDialogContainer open={isCreateDialogOpen} onClose={onCloseCreateDialog} />
    </div>
  );

  function renderHeader() {
    return (
      <div className='flex items-center justify-between'>
        <h1 className='font-grimoire text-xl text-grimoire-ink'>Admin</h1>
        <Button onClick={onOpenCreateDialog} className='bg-grimoire-gold text-grimoire-deep hover:bg-grimoire-gold-bright'>
          Create user
        </Button>
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

  function renderTable() {
    return (
      <div className='rounded border border-grimoire-border bg-grimoire-card'>
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
                  onDelete={onDeleteUser}
                  onAiEnabledChange={onAiEnabledChange}
                  onAiLimitChange={onAiLimitChange}
                  onPlanChange={onPlanChange}
                />
              ))}
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
