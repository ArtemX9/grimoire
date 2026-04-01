import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useChangePasswordMutation } from '@/api/authApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      navigate('/', { replace: true });
    } catch {
      setError('Could not change password. Please check your current password and try again.');
    }
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-grimoire-deep px-4'>
      <div className='w-full max-w-sm'>
        <div className='mb-8 text-center'>
          <h1 className='font-grimoire text-3xl text-grimoire-ink'>Grimoire</h1>
          <p className='mt-1 font-sans text-sm text-grimoire-muted'>Your personal game library</p>
        </div>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-base'>Set your password</CardTitle>
            <CardDescription>Your administrator has created this account. Choose a password before continuing.</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className='flex flex-col gap-3'>
              <div className='flex flex-col gap-1.5'>
                <label htmlFor='cp-current' className='font-sans text-xs text-grimoire-muted'>
                  Current (temporary) password
                </label>
                <Input
                  id='cp-current'
                  type='password'
                  placeholder='••••••••'
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete='current-password'
                />
              </div>

              <div className='flex flex-col gap-1.5'>
                <label htmlFor='cp-new' className='font-sans text-xs text-grimoire-muted'>
                  New password
                </label>
                <Input
                  id='cp-new'
                  type='password'
                  placeholder='••••••••'
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete='new-password'
                  minLength={8}
                />
              </div>

              <div className='flex flex-col gap-1.5'>
                <label htmlFor='cp-confirm' className='font-sans text-xs text-grimoire-muted'>
                  Confirm new password
                </label>
                <Input
                  id='cp-confirm'
                  type='password'
                  placeholder='••••••••'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete='new-password'
                  minLength={8}
                />
              </div>

              {error && <p className='font-sans text-xs text-grimoire-status-dropped-text'>{error}</p>}

              <Button type='submit' className='mt-1 w-full' disabled={isLoading}>
                {isLoading ? 'Saving…' : 'Set password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
