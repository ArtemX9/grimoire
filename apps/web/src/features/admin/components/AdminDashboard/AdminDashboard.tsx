import { AdminUserRow } from '@/features/admin/adminApi'
import { UserRow } from '@/features/admin/components/UserRow/UserRow'
import { CreateUserDialogContainer } from '@/features/admin/components/CreateUserDialog/CreateUserDialogContainer'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/shared/components/ui/table'
import { Switch } from '@/shared/components/ui/switch'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'

interface IAdminDashboard {
  users: AdminUserRow[]
  isLoading: boolean
  globalAiEnabled: boolean
  isCreateDialogOpen: boolean
  onToggleGlobalAi: (enabled: boolean) => void
  onDeleteUser: (id: string) => void
  onAiEnabledChange: (id: string, enabled: boolean) => void
  onAiLimitChange: (id: string, limit: number | null) => void
  onOpenCreateDialog: () => void
  onCloseCreateDialog: () => void
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
  )

  function renderHeader() {
    return (
      <div className='flex items-center justify-between'>
        <h1 className='font-grimoire text-xl text-grimoire-ink'>Admin</h1>
        <Button onClick={onOpenCreateDialog} className='bg-grimoire-gold text-grimoire-deep hover:bg-grimoire-gold-bright'>
          Create user
        </Button>
      </div>
    )
  }

  function renderAiGlobalToggle() {
    return (
      <div className='flex items-center gap-3 rounded border border-grimoire-border bg-grimoire-card px-4 py-3'>
        <span className='flex-1 font-sans text-sm text-grimoire-ink'>AI features</span>
        <span className='font-sans text-xs text-grimoire-muted'>
          {globalAiEnabled ? 'Enabled globally' : 'Disabled globally'}
        </span>
        <Switch checked={globalAiEnabled} onCheckedChange={onToggleGlobalAi} />
      </div>
    )
  }

  function renderTable() {
    return (
      <div className='rounded border border-grimoire-border bg-grimoire-card'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
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
                />
              ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  function renderSkeletonRows() {
    return Array.from({ length: 3 }).map((_, i) => (
      <TableRow key={i}>
        <TableCell><Skeleton className='h-4 w-32 rounded' /></TableCell>
        <TableCell><Skeleton className='h-4 w-12 rounded' /></TableCell>
        <TableCell><Skeleton className='h-4 w-8 rounded' /></TableCell>
        <TableCell><Skeleton className='h-4 w-8 rounded' /></TableCell>
        <TableCell><Skeleton className='h-4 w-8 rounded' /></TableCell>
        <TableCell><Skeleton className='h-4 w-16 rounded' /></TableCell>
        <TableCell><Skeleton className='h-4 w-8 rounded' /></TableCell>
      </TableRow>
    ))
  }

  function renderEmptyState() {
    return (
      <TableRow>
        <TableCell colSpan={7} className='py-8 text-center font-sans text-sm text-grimoire-muted'>
          No users yet.
        </TableCell>
      </TableRow>
    )
  }
}
