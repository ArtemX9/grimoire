import { useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { Role } from '@grimoire/shared';

import { ROUTES } from '@/constants/routes';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectIsBootstrapped, selectSession } from '@/store/state/auth/selectors';
import { signIn } from '@/store/thunks/auth/index';

import { LoginPage } from './LoginPage';

function LoginPageContainer() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const isBootstrapped = useAppSelector(selectIsBootstrapped);
  const session = useAppSelector(selectSession);

  const isNavigatingAfterSignIn = useRef(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);

  if (!isBootstrapped) {
    return null;
  }

  if (session && !isNavigatingAfterSignIn.current) {
    return <Navigate to={ROUTES.DEFAULT} replace />;
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsPending(true);
    try {
      isNavigatingAfterSignIn.current = true;
      const result = await dispatch(signIn({ email, password }));
      if (result.user.mustChangePassword) {
        navigate(ROUTES.CHANGE_PASSWORD, { replace: true });
      } else if (result.user.role === Role.ADMIN) {
        navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
      } else {
        navigate(ROUTES.DEFAULT, { replace: true });
      }
    } catch {
      isNavigatingAfterSignIn.current = false;
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <LoginPage
      email={email}
      password={password}
      error={error}
      isPending={isPending}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSignIn={handleSignIn}
    />
  );
}

export default LoginPageContainer;
