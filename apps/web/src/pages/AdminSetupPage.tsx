import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useSetupAdminMutation } from '@/features/admin/adminApi'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'

export function AdminSetupPage() {
  const navigate = useNavigate()
  const [setupAdmin, { isLoading }] = useSetupAdminMutation()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await setupAdmin({ email, password, name: name || undefined }).unwrap()
      navigate('/login', { replace: true })
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status
      if (status === 403) {
        navigate('/login', { replace: true })
      } else {
        setError('Could not create admin account. Please try again.')
      }
    }
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-grimoire-deep px-4'>
      <div className='w-full max-w-sm'>
        <div className='mb-8 text-center'>
          <h1 className='font-grimoire text-3xl text-grimoire-ink'>Grimoire</h1>
          <p className='mt-1 font-sans text-sm text-grimoire-muted'>First-time setup</p>
        </div>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-base'>Create admin account</CardTitle>
            <CardDescription>
              No accounts exist yet. Create the first administrator account to get started.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className='flex flex-col gap-3'>
              <div className='flex flex-col gap-1.5'>
                <label htmlFor='setup-name' className='font-sans text-xs text-grimoire-muted'>Name (optional)</label>
                <Input
                  id='setup-name'
                  type='text'
                  placeholder='Your name'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete='name'
                />
              </div>

              <div className='flex flex-col gap-1.5'>
                <label htmlFor='setup-email' className='font-sans text-xs text-grimoire-muted'>Email</label>
                <Input
                  id='setup-email'
                  type='email'
                  placeholder='admin@example.com'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete='email'
                />
              </div>

              <div className='flex flex-col gap-1.5'>
                <label htmlFor='setup-password' className='font-sans text-xs text-grimoire-muted'>Password</label>
                <Input
                  id='setup-password'
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

              <Button type='submit' className='mt-1 w-full' disabled={isLoading}>
                {isLoading ? 'Creating…' : 'Create admin account'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}