import { Role } from '@grimoire/shared';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { useGetSessionQuery, useSignInMutation } from '@/features/auth/authApi';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';

export function LoginPage() {
  const navigate = useNavigate();

  const { data: session, isLoading: isSessionLoading } = useGetSessionQuery();
  const [signIn, { isLoading: isSigningIn }] = useSignInMutation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (isSessionLoading) {
    return null;
  }

  if (session) {
    return <Navigate to='/' replace />;
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const result = await signIn({ email, password }).unwrap();
      if (result.user.mustChangePassword) {
        navigate('/change-password', { replace: true });
      } else if (result.user.role === Role.ADMIN) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch {
      setError('Invalid email or password. Please try again.');
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
            <CardTitle className='text-base'>Welcome back</CardTitle>
            <CardDescription>Sign in to your account</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSignIn} className='flex flex-col gap-3'>
              <div className='flex flex-col gap-1.5'>
                <label htmlFor='login-email' className='font-sans text-xs text-grimoire-muted'>
                  Email
                </label>
                <Input
                  id='login-email'
                  type='email'
                  placeholder='you@example.com'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete='email'
                />
              </div>

              <div className='flex flex-col gap-1.5'>
                <label htmlFor='login-password' className='font-sans text-xs text-grimoire-muted'>
                  Password
                </label>
                <Input
                  id='login-password'
                  type='password'
                  placeholder='••••••••'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete='current-password'
                />
              </div>

              {error && <p className='font-sans text-xs text-grimoire-status-dropped-text'>{error}</p>}

              <Button type='submit' className='mt-1 w-full' disabled={isSigningIn}>
                {isSigningIn ? 'Signing in…' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
