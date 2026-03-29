import { Routes, Route, Navigate } from 'react-router-dom'

import Layout from '@/shared/components/Layout/Layout'
import { ProtectedRoute } from '@/shared/components/ProtectedRoute/ProtectedRoute'
import { AdminRoute } from '@/shared/components/ProtectedRoute/AdminRoute'
import { MustChangePasswordRoute } from '@/shared/components/ProtectedRoute/MustChangePasswordRoute'
import { Toaster } from '@/shared/components/ui/toaster'
import { LoginPage } from '@/pages/LoginPage'
import { AdminSetupPage } from '@/pages/AdminSetupPage'
import { AdminDashboardPage } from '@/pages/AdminDashboardPage'
import { ChangePasswordPage } from '@/pages/ChangePasswordPage'
import { LibraryPage } from '@/pages/LibraryPage'
import { GameDetailPage } from '@/pages/GameDetailPage'
import { SettingsPage } from '@/pages/SettingsPage'

export default function App() {
  return (
    <>
      <Routes>
        <Route path='/login' element={<LoginPage />} />
        <Route path='/admin/setup' element={<AdminSetupPage />} />

        <Route element={<MustChangePasswordRoute />}>
          <Route path='/change-password' element={<ChangePasswordPage />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path='/admin/dashboard' element={<AdminDashboardPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path='/' element={<Navigate to='/library' replace />} />
            <Route path='/library' element={<LibraryPage />} />
            <Route path='/games/:id' element={<GameDetailPage />} />
            <Route path='/settings' element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
      <Toaster />
    </>
  )
}
