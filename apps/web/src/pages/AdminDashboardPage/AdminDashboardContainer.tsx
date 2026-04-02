import { useState } from 'react';

import {
  useDeleteAdminUserMutation,
  useGetAiGlobalSettingsQuery,
  useListAdminUsersQuery,
  useUpdateAiGlobalSettingsMutation,
  useUpdateUserAiSettingsMutation,
  useUpdateUserPlanMutation,
} from '@/api/adminApi';
import { useAppSelector } from '@/store/hooks';

import { AdminDashboard } from './AdminDashboard';

export function AdminDashboardContainer() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useListAdminUsersQuery();
  useGetAiGlobalSettingsQuery();

  const users = useAppSelector((s) => s.admin.users);
  const isUsersLoading = useAppSelector((s) => s.admin.isUsersLoading);
  const aiSettings = useAppSelector((s) => s.admin.aiSettings);
  const isAiSettingsLoading = useAppSelector((s) => s.admin.isAiSettingsLoading);

  const [deleteUser] = useDeleteAdminUserMutation();
  const [updateAiGlobal] = useUpdateAiGlobalSettingsMutation();
  const [updateUserAi] = useUpdateUserAiSettingsMutation();
  const [updateUserPlan] = useUpdateUserPlanMutation();

  const globalAiEnabled = aiSettings?.aiEnabled ?? true;
  const isLoading = isUsersLoading || isAiSettingsLoading;

  async function handleDeleteUser(id: string) {
    await deleteUser(id);
  }

  async function handleToggleGlobalAi(enabled: boolean) {
    await updateAiGlobal({ aiEnabled: enabled });
  }

  async function handleAiEnabledChange(id: string, enabled: boolean) {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    await updateUserAi({ id, aiEnabled: enabled, aiRequestsLimit: user.aiRequestsLimit });
  }

  async function handleAiLimitChange(id: string, limit: number | null) {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    await updateUserAi({ id, aiEnabled: user.aiEnabled, aiRequestsLimit: limit });
  }

  async function handlePlanChange(id: string, plan: string) {
    await updateUserPlan({ id, plan });
  }

  return (
    <AdminDashboard
      users={users}
      isLoading={isLoading}
      globalAiEnabled={globalAiEnabled}
      isCreateDialogOpen={isCreateDialogOpen}
      onToggleGlobalAi={handleToggleGlobalAi}
      onDeleteUser={handleDeleteUser}
      onAiEnabledChange={handleAiEnabledChange}
      onAiLimitChange={handleAiLimitChange}
      onPlanChange={handlePlanChange}
      onOpenCreateDialog={() => setIsCreateDialogOpen(true)}
      onCloseCreateDialog={() => setIsCreateDialogOpen(false)}
    />
  );
}
