import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useGetSessionQuery, useSignInMutation, useSignUpMutation } from '@/features/auth/authApi'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'

export function AuthPage() {
  const navigate = useNavigate()

  const { data: session, isLoading: isSessionLoading } = useGetSessionQuery()

  const [signIn, { isLoading: isSigningIn }] = useSignInMutation()
  const [signUp, { isLoading: isSigningUp }] = useSignUpMutation()

  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [signInError, setSignInError] = useState('')

  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpName, setSignUpName] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [signUpError, setSignUpError] = useState('')

  if (isSessionLoading) {
    return null
  }

  if (session) {
    return <Navigate to='/' replace />
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setSignInError('')
    try {
      await signIn({ email: signInEmail, password: signInPassword }).unwrap()
      navigate('/', { replace: true })
    } catch {
      setSignInError('Invalid email or password. Please try again.')
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setSignUpError('')
    try {
      await signUp({ email: signUpEmail, name: signUpName, password: signUpPassword }).unwrap()
      navigate('/', { replace: true })
    } catch {
      setSignUpError('Could not create account. The email may already be in use.')
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
            <CardTitle className='text-base'>Welcome</CardTitle>
            <CardDescription>Sign in to your account or create a new one</CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue='sign-in'>
              <TabsList className='w-full'>
                <TabsTrigger value='sign-in' className='flex-1'>
                  Sign In
                </TabsTrigger>
                <TabsTrigger value='sign-up' className='flex-1'>
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value='sign-in'>
                {renderSignInForm()}
              </TabsContent>

              <TabsContent value='sign-up'>
                {renderSignUpForm()}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  function renderSignInForm() {
    return (
      <form onSubmit={handleSignIn} className='flex flex-col gap-3'>
        <div className='flex flex-col gap-1.5'>
          <label className='font-sans text-xs text-grimoire-muted'>Email</label>
          <Input
            type='email'
            placeholder='you@example.com'
            value={signInEmail}
            onChange={(e) => setSignInEmail(e.target.value)}
            required
            autoComplete='email'
          />
        </div>

        <div className='flex flex-col gap-1.5'>
          <label className='font-sans text-xs text-grimoire-muted'>Password</label>
          <Input
            type='password'
            placeholder='••••••••'
            value={signInPassword}
            onChange={(e) => setSignInPassword(e.target.value)}
            required
            autoComplete='current-password'
          />
        </div>

        {signInError && (
          <p className='font-sans text-xs text-grimoire-status-dropped-text'>{signInError}</p>
        )}

        <Button type='submit' className='mt-1 w-full' disabled={isSigningIn}>
          {isSigningIn ? 'Signing in…' : 'Sign In'}
        </Button>
      </form>
    )
  }

  function renderSignUpForm() {
    return (
      <form onSubmit={handleSignUp} className='flex flex-col gap-3'>
        <div className='flex flex-col gap-1.5'>
          <label className='font-sans text-xs text-grimoire-muted'>Name</label>
          <Input
            type='text'
            placeholder='Your name'
            value={signUpName}
            onChange={(e) => setSignUpName(e.target.value)}
            required
            autoComplete='name'
          />
        </div>

        <div className='flex flex-col gap-1.5'>
          <label className='font-sans text-xs text-grimoire-muted'>Email</label>
          <Input
            type='email'
            placeholder='you@example.com'
            value={signUpEmail}
            onChange={(e) => setSignUpEmail(e.target.value)}
            required
            autoComplete='email'
          />
        </div>

        <div className='flex flex-col gap-1.5'>
          <label className='font-sans text-xs text-grimoire-muted'>Password</label>
          <Input
            type='password'
            placeholder='••••••••'
            value={signUpPassword}
            onChange={(e) => setSignUpPassword(e.target.value)}
            required
            autoComplete='new-password'
            minLength={8}
          />
        </div>

        {signUpError && (
          <p className='font-sans text-xs text-grimoire-status-dropped-text'>{signUpError}</p>
        )}

        <Button type='submit' className='mt-1 w-full' disabled={isSigningUp}>
          {isSigningUp ? 'Creating account…' : 'Create Account'}
        </Button>
      </form>
    )
  }
}
