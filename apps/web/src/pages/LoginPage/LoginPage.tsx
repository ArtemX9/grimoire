import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface ILoginPage {
  email: string;
  password: string;
  error: string;
  isPending: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSignIn: (e: React.FormEvent) => void;
}

export function LoginPage({ email, password, error, isPending, onEmailChange, onPasswordChange, onSignIn }: ILoginPage) {
  return (
    <div className='flex min-h-screen items-center justify-center bg-grimoire-deep px-4'>
      <div className='w-full max-w-sm'>
        {renderBranding()}
        {renderCard()}
        {renderDemoHint()}
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
          <CardTitle className='text-base'>Welcome back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSignIn} className='flex flex-col gap-3'>
            {renderEmailField()}
            {renderPasswordField()}
            {error && <p className='font-sans text-xs text-grimoire-status-dropped-text'>{error}</p>}
            <Button type='submit' className='mt-1 w-full' disabled={isPending}>
              {isPending ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  function renderDemoHint() {
    return (
      <p className='mt-4 text-center font-sans text-xs text-grimoire-muted'>
        Want to explore the app? <span className='font-medium'>demo@grimoire.app</span>
        {' / '}
        <span className='font-medium'>demo1234</span>
      </p>
    );
  }

  function renderEmailField() {
    return (
      <div className='flex flex-col gap-1.5'>
        <label htmlFor='login-email' className='font-sans text-xs text-grimoire-muted'>
          Email
        </label>
        <Input
          id='login-email'
          type='email'
          placeholder='you@example.com'
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          required
          autoComplete='email'
        />
      </div>
    );
  }

  function renderPasswordField() {
    return (
      <div className='flex flex-col gap-1.5'>
        <label htmlFor='login-password' className='font-sans text-xs text-grimoire-muted'>
          Password
        </label>
        <Input
          id='login-password'
          type='password'
          placeholder='••••••••'
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          required
          autoComplete='current-password'
        />
      </div>
    );
  }
}
