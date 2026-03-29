import { useState } from 'react'

import {
  useListAdminUsersQuery,
  useDeleteAdminUserMutation,
  useGetAiGlobalSettingsQuery,
  useUpdateAiGlobalSettingsMutation,
  useUpdateUserAiSettingsMutation,
} from '@/features/admin/adminApi'
import { AdminDashboard } from './AdminDashboard'

export function AdminDashboardContainer() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const { data: usersData, isLoading: isUsersLoading } = useListAdminUsersQuery()
  const { data: aiSettings, isLoading: isAiLoading } = useGetAiGlobalSettingsQuery()

  const [deleteUser] = useDeleteAdminUserMutation()
  const [updateAiGlobal] = useUpdateAiGlobalSettingsMutation()
  const [updateUserAi] = useUpdateUserAiSettingsMutation()

  const users = usersData?.data ?? []
  const globalAiEnabled = aiSettings?.aiEnabled ?? true
  const isLoading = isUsersLoading || isAiLoading

  async function handleDeleteUser(id: string) {
    await deleteUser(id)
  }

  async function handleToggleGlobalAi(enabled: boolean) {
    await updateAiGlobal({ aiEnabled: enabled })
  }

  async function handleAiEnabledChange(id: string, enabled: boolean) {
    const user = users.find((u) => u.id === id)
    if (!user) return
    await updateUserAi({ id, aiEnabled: enabled, aiRequestsLimit: user.aiRequestsLimit })
  }

  async function handleAiLimitChange(id: string, limit: number | null) {
    const user = users.find((u) => u.id === id)
    if (!user) return
    await updateUserAi({ id, aiEnabled: user.aiEnabled, aiRequestsLimit: limit })
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
      onOpenCreateDialog={() => setIsCreateDialogOpen(true)}
      onCloseCreateDialog={() => setIsCreateDialogOpen(false)}
    />
  )
}
