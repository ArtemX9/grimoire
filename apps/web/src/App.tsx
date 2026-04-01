import { Navigate, Route, Routes } from 'react-router-dom';

import Layout from '@/components/Layout/Layout';
import { AdminRoute } from '@/components/ProtectedRoute/AdminRoute';
import { MustChangePasswordRoute } from '@/components/ProtectedRoute/MustChangePasswordRoute';
import { ProtectedRoute } from '@/components/ProtectedRoute/ProtectedRoute';
import { Toaster } from '@/components/ui/toaster';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage/AdminDashboardPage';
import { AdminSetupPage } from '@/pages/AdminSetupPage/AdminSetupPage';
import { ChangePasswordPage } from '@/pages/ChangePasswordPage/ChangePasswordPage';
import { GameDetailPage } from '@/pages/GameDetailPage/GameDetailPage';
import { LibraryPage } from '@/pages/LibraryPage/LibraryPage';
import { LoginPage } from '@/pages/LoginPage/LoginPage';
import { SettingsPage } from '@/pages/SettingsPage/SettingsPage';

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
