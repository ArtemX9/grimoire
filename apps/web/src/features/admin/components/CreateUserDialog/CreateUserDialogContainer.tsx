import { useState } from 'react'

import { CreateUserArgs, useCreateAdminUserMutation } from '@/features/admin/adminApi'
import { CreateUserDialog } from './CreateUserDialog'

interface ICreateUserDialogContainer {
  open: boolean
  onClose: () => void
}

export function CreateUserDialogContainer({ open, onClose }: ICreateUserDialogContainer) {
  const [createUser, { isLoading }] = useCreateAdminUserMutation()
  const [error, setError] = useState('')

  async function handleSubmit(args: CreateUserArgs) {
    setError('')
    try {
      await createUser(args).unwrap()
      onClose()
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status
      if (status === 409) {
        setError('A user with this email already exists.')
      } else {
        setError('Could not create user. Please try again.')
      }
    }
  }

  return (
    <CreateUserDialog
      open={open}
      isLoading={isLoading}
      error={error}
      onClose={onClose}
      onSubmit={handleSubmit}
    />
  )
}
