import { useState } from 'react';

import { CreateUserArgs, useCreateAdminUser } from '@/api/admin';

import { CreateUserDialog } from './CreateUserDialog';

interface ICreateUserDialogContainer {
  open: boolean;
  onClose: () => void;
}

export function CreateUserDialogContainer({ open, onClose }: ICreateUserDialogContainer) {
  const createUserMutation = useCreateAdminUser();
  const isLoading = createUserMutation.isPending;
  const [error, setError] = useState('');

  async function handleSubmit(args: CreateUserArgs) {
    setError('');
    try {
      await createUserMutation.mutateAsync(args);
      onClose();
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 409) {
        setError('A user with this email already exists.');
      } else {
        setError('Could not create user. Please try again.');
      }
    }
  }

  return <CreateUserDialog open={open} isLoading={isLoading} error={error} onClose={onClose} onSubmit={handleSubmit} />;
}
