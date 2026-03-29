import { useState } from 'react'
import { Trash2 } from 'lucide-react'

import { AdminUserRow } from '@/features/admin/adminApi'
import { TableRow, TableCell } from '@/shared/components/ui/table'
import { Switch } from '@/shared/components/ui/switch'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/shared/components/ui/alert-dialog'
import { cn } from '@/shared/utils/cn'

const ROLE_STYLES: Record<string, string> = {
  ADMIN: 'border-grimoire-gold/40 bg-grimoire-gold/10 text-grimoire-gold',
  USER: 'border-grimoire-border bg-grimoire-hover text-grimoire-muted',
}

interface IUserRow {
  user: AdminUserRow
  globalAiEnabled: boolean
  onDelete: (id: string) => void
  onAiEnabledChange: (id: string, enabled: boolean) => void
  onAiLimitChange: (id: string, limit: number | null) => void
}

export function UserRow({ user, globalAiEnabled, onDelete, onAiEnabledChange, onAiLimitChange }: IUserRow) {
  const [limitInput, setLimitInput] = useState(
    user.aiRequestsLimit !== null ? String(user.aiRequestsLimit) : '',
  )

  function handleLimitBlur() {
    const trimmed = limitInput.trim()
    if (trimmed === '') {
      onAiLimitChange(user.id, null)
    } else {
      const parsed = parseInt(trimmed, 10)
      if (!isNaN(parsed) && parsed >= 0) {
        onAiLimitChange(user.id, parsed)
      } else {
        setLimitInput(user.aiRequestsLimit !== null ? String(user.aiRequestsLimit) : '')
      }
    }
  }

  const aiControlsDisabled = !globalAiEnabled || !user.aiEnabled

  return (
    <TableRow>
      <TableCell>
        <div className='flex flex-col gap-0.5'>
          <span className='font-grimoire text-sm text-grimoire-ink'>{user.name ?? '—'}</span>
          <span className='font-sans text-xs text-grimoire-muted'>{user.email}</span>
        </div>
      </TableCell>

      <TableCell>
        <span
          className={cn(
            'rounded-full border px-2 py-0.5 font-sans text-xs',
            ROLE_STYLES[user.role] ?? ROLE_STYLES.USER,
          )}
        >
          {user.role}
        </span>
      </TableCell>

      <TableCell className='font-sans text-sm'>{user.gamesCount}</TableCell>

      <TableCell className='font-sans text-sm'>
        {user.aiEnabled && globalAiEnabled ? user.aiRequestsUsed : '—'}
      </TableCell>

      <TableCell>
        <Switch
          checked={user.aiEnabled}
          onCheckedChange={(checked) => onAiEnabledChange(user.id, checked)}
          disabled={!globalAiEnabled}
        />
      </TableCell>

      <TableCell>
        <Input
          type='number'
          min={0}
          placeholder='∞'
          value={limitInput}
          onChange={(e) => setLimitInput(e.target.value)}
          onBlur={handleLimitBlur}
          disabled={aiControlsDisabled}
          className='w-20 font-sans text-xs'
        />
      </TableCell>

      <TableCell>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant='ghost' size='icon' className='text-grimoire-muted hover:text-grimoire-status-dropped-text'>
              <Trash2 className='h-4 w-4' />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete account</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{user.email}</strong>? This will permanently remove their account and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(user.id)}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  )
}