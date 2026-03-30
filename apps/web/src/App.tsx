import { Navigate, Route, Routes } from 'react-router-dom';

import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { AdminSetupPage } from '@/pages/AdminSetupPage';
import { ChangePasswordPage } from '@/pages/ChangePasswordPage';
import { GameDetailPage } from '@/pages/GameDetailPage';
import { LibraryPage } from '@/pages/LibraryPage';
import { LoginPage } from '@/pages/LoginPage';
import { SettingsPage } from '@/pages/SettingsPage';
import Layout from '@/shared/components/Layout/Layout';
import { AdminRoute } from '@/shared/components/ProtectedRoute/AdminRoute';
import { MustChangePasswordRoute } from '@/shared/components/ProtectedRoute/MustChangePasswordRoute';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute/ProtectedRoute';
import { Toaster } from '@/shared/components/ui/toaster';

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
  );
}
