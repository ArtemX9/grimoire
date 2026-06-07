import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface IChangePasswordPage {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  error: string;
  isLoading: boolean;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ChangePasswordPage({
  currentPassword,
  newPassword,
  confirmPassword,
  error,
  isLoading,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
}: IChangePasswordPage) {
  return (
    <div className='flex min-h-screen items-center justify-center bg-grimoire-deep px-4'>
      <div className='w-full max-w-sm'>
        {renderBranding()}
        {renderCard()}
      </div>
    </div>
  );

  function renderBranding() {
    return (
      <div className='mb-8 text-center'>
        <h1 className='font-grimoire text-3xl text-grimoire-ink'>Grimoire</h1>
        <p className='mt-1 font-sans text-sm text-grimoire-muted'>Your personal game library</p>
      </div>
    );
  }

  function renderCard() {
    return (
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-base'>Set your password</CardTitle>
          <CardDescription>Your administrator has created this account. Choose a password before continuing.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className='flex flex-col gap-3'>
            {renderCurrentPasswordField()}
            {renderNewPasswordField()}
            {renderConfirmPasswordField()}
            {error && <p className='font-sans text-xs text-grimoire-status-dropped-text'>{error}</p>}
            <Button type='submit' className='mt-1 w-full' disabled={isLoading}>
              {isLoading ? 'Saving…' : 'Set password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  function renderCurrentPasswordField() {
    return (
      <div className='flex flex-col gap-1.5'>
        <label htmlFor='cp-current' className='font-sans text-xs text-grimoire-muted'>
          Current (temporary) password
        </label>
        <Input
          id='cp-current'
          type='password'
          placeholder='••••••••'
          value={currentPassword}
          onChange={(e) => onCurrentPasswordChange(e.target.value)}
          required
          autoComplete='current-password'
        />
      </div>
    );
  }

  function renderNewPasswordField() {
    return (
      <div className='flex flex-col gap-1.5'>
        <label htmlFor='cp-new' className='font-sans text-xs text-grimoire-muted'>
          New password
        </label>
        <Input
          id='cp-new'
          type='password'
          placeholder='••••••••'
          value={newPassword}
          onChange={(e) => onNewPasswordChange(e.target.value)}
          required
          autoComplete='new-password'
          minLength={8}
        />
      </div>
    );
  }

  function renderConfirmPasswordField() {
    return (
      <div className='flex flex-col gap-1.5'>
        <label htmlFor='cp-confirm' className='font-sans text-xs text-grimoire-muted'>
          Confirm new password
        </label>
        <Input
          id='cp-confirm'
          type='password'
          placeholder='••••••••'
          value={confirmPassword}
          onChange={(e) => onConfirmPasswordChange(e.target.value)}
          required
          autoComplete='new-password'
          minLength={8}
        />
      </div>
    );
  }
}
