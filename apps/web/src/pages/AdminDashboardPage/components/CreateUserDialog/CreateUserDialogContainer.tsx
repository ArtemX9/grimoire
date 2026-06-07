import { useState } from 'react';

import { useAppDispatch } from '@/store/hooks';
import { createAdminUser } from '@/store/thunks/admin/index';
import type { CreateUserArgs } from '@/store/thunks/admin/types';

import { CreateUserDialog } from './CreateUserDialog';

interface ICreateUserDialogContainer {
  open: boolean;
  onClose: () => void;
}

export function CreateUserDialogContainer({ open, onClose }: ICreateUserDialogContainer) {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(args: CreateUserArgs) {
    setError('');
    setIsLoading(true);
    try {
      await dispatch(createAdminUser(args));
      onClose();
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 409) {
        setError('A user with this email already exists.');
      } else {
        setError('Could not create user. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return <CreateUserDialog open={open} isLoading={isLoading} error={error} onClose={onClose} onSubmit={handleSubmit} />;
}
