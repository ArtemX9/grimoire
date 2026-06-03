import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { toast } from '@/components/ui/use-toast';
import { ROUTES } from '@/constants/routes';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectSession } from '@/store/state/auth/selectors';
import { selectIsSteamConnected, selectIsSteamConnecting, selectIsSteamFetching, selectIsSteamSyncing, selectSteamStatus } from '@/store/state/steam/selectors';
import { selectCurrentUser, selectIsUserLoading, selectIsUserUpdating } from '@/store/state/users/selectors';
import { signOut } from '@/store/thunks/auth/index';
import { connectSteam, getSteamStatus, syncSteam } from '@/store/thunks/steam/index';
import { getMe, updateMe } from '@/store/thunks/users/index';

import { SettingsPage } from './SettingsPage';

const steamIDRegex = /^\d{17}$/;

function SettingsPageContainer() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const user = useAppSelector(selectCurrentUser);
  const isUserLoading = useAppSelector(selectIsUserLoading);
  const isUserUpdating = useAppSelector(selectIsUserUpdating);
  const session = useAppSelector(selectSession);

  const steamStatus = useAppSelector(selectSteamStatus);
  const isSteamLoading = useAppSelector(selectIsSteamFetching);
  const isSteamConnecting = useAppSelector(selectIsSteamConnecting);
  const isSteamSyncing = useAppSelector(selectIsSteamSyncing);
  const isSteamConnected = useAppSelector(selectIsSteamConnected);

  const [nameValue, setNameValue] = useState('');
  const [editing, setEditing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [steamIdInput, setSteamIdInput] = useState('');
  const [showSteamInput, setShowSteamInput] = useState(false);

  useEffect(function fetchUserOnMount() {
    dispatch(getMe());
  }, []);

  function handleStartEdit() {
    setNameValue(user?.name ?? '');
    setEditing(true);
  }

  function handleCancelEdit() {
    setEditing(false);
  }

  async function handleSave() {
    try {
      await dispatch(updateMe({ name: nameValue }));
      toast({ title: 'Profile updated' });
      setEditing(false);
    } catch {
      toast({ title: 'Failed to update profile', variant: 'destructive' });
    }
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await dispatch(signOut());
    } catch {
      // session may already be gone — proceed regardless
    } finally {
      setIsSigningOut(false);
    }
    navigate(ROUTES.LOGIN, { replace: true });
  }

  function handleShowSteamInput() {
    setShowSteamInput(true);
  }

  function handleHideSteamInput() {
    setShowSteamInput(false);
  }

  async function handleSteamConnect() {
    if (!steamIdInput.trim()) return;
    if (!steamIDRegex.test(steamIdInput)) return;
    try {
      await dispatch(connectSteam({ steamId: steamIdInput.trim() }));
      toast({ title: 'Steam account connected' });
      setShowSteamInput(false);
      setSteamIdInput('');
      dispatch(getSteamStatus());
    } catch {
      toast({ title: 'Failed to connect Steam', variant: 'destructive' });
    }
  }

  async function handleSteamSync() {
    try {
      await dispatch(syncSteam());
      toast({ title: 'Steam sync started — this may take a moment' });
    } catch {
      toast({ title: 'Failed to start sync', variant: 'destructive' });
    }
  }

  return (
    <SettingsPage
      user={user}
      session={session}
      isUserLoading={isUserLoading}
      isUserUpdating={isUserUpdating}
      isSigningOut={isSigningOut}
      nameValue={nameValue}
      editing={editing}
      steamStatus={steamStatus}
      isSteamLoading={isSteamLoading}
      isSteamConnecting={isSteamConnecting}
      isSteamSyncing={isSteamSyncing}
      isSteamConnected={isSteamConnected}
      steamIdInput={steamIdInput}
      showSteamInput={showSteamInput}
      onNameChange={setNameValue}
      onStartEdit={handleStartEdit}
      onCancelEdit={handleCancelEdit}
      onSave={handleSave}
      onSignOut={handleSignOut}
      onShowSteamInput={handleShowSteamInput}
      onHideSteamInput={handleHideSteamInput}
      onSteamIdChange={setSteamIdInput}
      onSteamConnect={handleSteamConnect}
      onSteamSync={handleSteamSync}
    />
  );
}

export default SettingsPageContainer;
