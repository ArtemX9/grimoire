import { Role } from '@grimoire/shared';
import { useState } from 'react';

import {
  useDeleteAdminUser,
  useGetAiGlobalSettings,
  useListAdminUsers,
  useUpdateAiGlobalSettings,
  useUpdateUserAiSettings,
  useUpdateUserPlan,
  useUpdateUserRole,
} from '@/api/admin';
import { useSession } from '@/api/auth';

import { AdminDashboard } from './AdminDashboard';

export function AdminDashboardContainer() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: usersResponse, isLoading: isUsersLoading } = useListAdminUsers();
  const { data: aiSettings, isLoading: isAiSettingsLoading } = useGetAiGlobalSettings();
  const sessionQuery = useSession();
  const currentUserID = sessionQuery.data?.user.id ?? null;

  const users = usersResponse?.data ?? [];

  const deleteUserMutation = useDeleteAdminUser();
  const updateAiGlobalMutation = useUpdateAiGlobalSettings();
  const updateUserAiMutation = useUpdateUserAiSettings();
  const updateUserPlanMutation = useUpdateUserPlan();
  const updateUserRoleMutation = useUpdateUserRole();

  const globalAiEnabled = aiSettings?.aiEnabled ?? true;
  const isLoading = isUsersLoading || isAiSettingsLoading;

  async function handleDeleteUser(id: string) {
    await deleteUserMutation.mutateAsync(id);
  }

  async function handleToggleGlobalAi(enabled: boolean) {
    await updateAiGlobalMutation.mutateAsync({ aiEnabled: enabled });
  }

  async function handleAiEnabledChange(id: string, enabled: boolean) {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    await updateUserAiMutation.mutateAsync({ id, aiEnabled: enabled, aiRequestsLimit: user.aiRequestsLimit });
  }

  async function handleAiLimitChange(id: string, limit: number | null) {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    await updateUserAiMutation.mutateAsync({ id, aiEnabled: user.aiEnabled, aiRequestsLimit: limit });
  }

  async function handlePlanChange(id: string, plan: string) {
    await updateUserPlanMutation.mutateAsync({ id, plan });
  }

  async function handleRoleChange(userID: string, role: Role) {
    await updateUserRoleMutation.mutateAsync({ userID, role });
  }

  return (
    <AdminDashboard
      users={users}
      isLoading={isLoading}
      globalAiEnabled={globalAiEnabled}
      isCreateDialogOpen={isCreateDialogOpen}
      currentUserID={currentUserID}
      onToggleGlobalAi={handleToggleGlobalAi}
      onDeleteUser={handleDeleteUser}
      onAiEnabledChange={handleAiEnabledChange}
      onAiLimitChange={handleAiLimitChange}
      onPlanChange={handlePlanChange}
      onRoleChange={handleRoleChange}
      onOpenCreateDialog={() => setIsCreateDialogOpen(true)}
      onCloseCreateDialog={() => setIsCreateDialogOpen(false)}
    />
  );
}
