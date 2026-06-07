import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ROUTES } from '@/constants/routes';
import { useAppDispatch } from '@/store/hooks';
import { setupAdmin } from '@/store/thunks/admin/index';

import { AdminSetupPage } from './AdminSetupPage';

function AdminSetupPageContainer() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await dispatch(setupAdmin({ email, password, name: name || undefined }));
      navigate(ROUTES.LOGIN, { replace: true });
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 403) {
        navigate(ROUTES.LOGIN, { replace: true });
      } else {
        setError('Could not create admin account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AdminSetupPage
      name={name}
      email={email}
      password={password}
      error={error}
      isLoading={isLoading}
      onNameChange={setName}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
    />
  );
}

export default AdminSetupPageContainer;
