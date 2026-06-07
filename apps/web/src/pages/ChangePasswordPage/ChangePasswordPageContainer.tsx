import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ROUTES } from '@/constants/routes';
import { useAppDispatch } from '@/store/hooks';
import { changePassword } from '@/store/thunks/users/index';

import { ChangePasswordPage } from './ChangePasswordPage';

function ChangePasswordPageContainer() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await dispatch(changePassword({ currentPassword, newPassword }));
      navigate(ROUTES.DEFAULT, { replace: true });
    } catch {
      setError('Could not change password. Please check your current password and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ChangePasswordPage
      currentPassword={currentPassword}
      newPassword={newPassword}
      confirmPassword={confirmPassword}
      error={error}
      isLoading={isLoading}
      onCurrentPasswordChange={setCurrentPassword}
      onNewPasswordChange={setNewPassword}
      onConfirmPasswordChange={setConfirmPassword}
      onSubmit={handleSubmit}
    />
  );
}

export default ChangePasswordPageContainer;
