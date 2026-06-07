import { AsyncStatus, Platform, Role } from '@grimoire/shared';
import { useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectAdminPlatformsTokensStatus,
  selectAdminUsers,
  selectAdminUsersStatus,
  selectAiSettings,
  selectGlobalAiEnabled,
  selectPlatformsTokens,
} from '@/store/state/admin/selectors';
import { selectCurrentUserId } from '@/store/state/auth/selectors';
import {
  deleteAdminUser,
  fetchAdminUsers,
  fetchAiGlobalSettings,
  fetchPlatformsTokens,
  updateAiGlobalSettings,
  updatePlatformToken,
  updateUserAiSettings,
  updateUserPlan,
  updateUserRole,
} from '@/store/thunks/admin';

import { AdminDashboard } from './AdminDashboard';

export function AdminDashboardContainer() {
  const dispatch = useAppDispatch();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const users = useAppSelector(selectAdminUsers);
  const usersStatus = useAppSelector(selectAdminUsersStatus);
  const aiSettings = useAppSelector(selectAiSettings);
  const platformsTokens = useAppSelector(selectPlatformsTokens);
  const platformsTokensStatus = useAppSelector(selectAdminPlatformsTokensStatus);
  const currentUserID = useAppSelector(selectCurrentUserId);
  const globalAiEnabled = useAppSelector(selectGlobalAiEnabled);

  const isLoading = usersStatus === AsyncStatus.Loading || platformsTokensStatus === AsyncStatus.Loading;

  useEffect(function fetchAdminDataOnMount() {
    dispatch(fetchAdminUsers());
    dispatch(fetchAiGlobalSettings());
    dispatch(fetchPlatformsTokens());
  }, []);

  async function handleDeleteUser(id: string) {
    await dispatch(deleteAdminUser(id));
  }

  async function handleToggleGlobalAi(enabled: boolean) {
    await dispatch(updateAiGlobalSettings({ aiEnabled: enabled }));
  }

  async function handleAiEnabledChange(id: string, enabled: boolean) {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    await dispatch(updateUserAiSettings({ id, aiEnabled: enabled, aiRequestsLimit: user.aiRequestsLimit }));
  }

  async function handleAiLimitChange(id: string, limit: number | null) {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    await dispatch(updateUserAiSettings({ id, aiEnabled: user.aiEnabled, aiRequestsLimit: limit }));
  }

  async function handlePlanChange(id: string, plan: string) {
    await dispatch(updateUserPlan({ id, plan }));
  }

  async function handleRoleChange(userID: string, role: Role) {
    await dispatch(updateUserRole({ userID, role }));
  }

  async function handlePlatformTokenUpdate(platformID: Platform, newToken: string, newValidityFrame: number) {
    await dispatch(updatePlatformToken({ platformID, token: newToken, tokenValidityFrame: newValidityFrame }));
  }

  return (
    <AdminDashboard
      users={users}
      isLoading={isLoading}
      globalAiEnabled={globalAiEnabled}
      isCreateDialogOpen={isCreateDialogOpen}
      currentUserID={currentUserID}
      platformsTokens={platformsTokens}
      onToggleGlobalAi={handleToggleGlobalAi}
      onDeleteUser={handleDeleteUser}
      onAiEnabledChange={handleAiEnabledChange}
      onAiLimitChange={handleAiLimitChange}
      onPlanChange={handlePlanChange}
      onRoleChange={handleRoleChange}
      onPlatformTokenUpdate={handlePlatformTokenUpdate}
      onOpenCreateDialog={setIsCreateDialogOpen.bind(null, true)}
      onCloseCreateDialog={setIsCreateDialogOpen.bind(null, false)}
    />
  );
}
