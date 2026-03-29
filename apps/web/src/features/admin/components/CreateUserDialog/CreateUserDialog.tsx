import { useState } from 'react'

import { CreateUserArgs } from '@/features/admin/adminApi'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'

interface ICreateUserDialog {
  open: boolean
  isLoading: boolean
  error: string
  onClose: () => void
  onSubmit: (args: CreateUserArgs) => void
}

export function CreateUserDialog({ open, isLoading, error, onClose, onSubmit }: ICreateUserDialog) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({ name: name || undefined, email, password })
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      onClose()
      setName('')
      setEmail('')
      setPassword('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create user account</DialogTitle>
          <DialogDescription>
            The user will be prompted to change their password on first login.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='flex flex-col gap-3'>
          <div className='flex flex-col gap-1.5'>
            <label className='font-sans text-xs text-grimoire-muted'>Name (optional)</label>
            <Input
              type='text'
              placeholder='Their name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete='off'
            />
          </div>

          <div className='flex flex-col gap-1.5'>
            <label className='font-sans text-xs text-grimoire-muted'>Email</label>
            <Input
              type='email'
              placeholder='user@example.com'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete='off'
            />
          </div>

          <div className='flex flex-col gap-1.5'>
            <label className='font-sans text-xs text-grimoire-muted'>Temporary password</label>
            <Input
              type='password'
              placeholder='••••••••'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete='new-password'
              minLength={8}
            />
          </div>

          {error && (
            <p className='font-sans text-xs text-grimoire-status-dropped-text'>{error}</p>
          )}

          <DialogFooter className='mt-2'>
            <Button type='button' variant='outline' onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type='submit' disabled={isLoading}>
              {isLoading ? 'Creating…' : 'Create user'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
