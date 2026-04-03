import { Navigate, Route, Routes } from 'react-router-dom';

import { useGetSessionQuery } from '@/api/authApi';
import Layout from '@/components/Layout/Layout';
import { AdminRoute } from '@/components/ProtectedRoute/AdminRoute';
import { MustChangePasswordRoute } from '@/components/ProtectedRoute/MustChangePasswordRoute';
import { ProtectedRoute } from '@/components/ProtectedRoute/ProtectedRoute';
import { Toaster } from '@/components/ui/toaster';
import { ROUTES } from '@/constants/routes';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage/AdminDashboardPage';
import { AdminSetupPage } from '@/pages/AdminSetupPage/AdminSetupPage';
import { ChangePasswordPage } from '@/pages/ChangePasswordPage/ChangePasswordPage';
import { GameDetailPage } from '@/pages/GameDetailPage/GameDetailPage';
import { LibraryPage } from '@/pages/LibraryPage/LibraryPage';
import { LoginPage } from '@/pages/LoginPage/LoginPage';
import { SettingsPage } from '@/pages/SettingsPage/SettingsPage';

export default function App() {
  useGetSessionQuery();

  return (
    <>
      <Routes>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.ADMIN_SETUP} element={<AdminSetupPage />} />

        <Route element={<MustChangePasswordRoute />}>
          <Route path={ROUTES.CHANGE_PASSWORD} element={<ChangePasswordPage />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminDashboardPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path={ROUTES.DEFAULT} element={<Navigate to={ROUTES.LIBRARY} replace />} />
            <Route path={ROUTES.LIBRARY} element={<LibraryPage />} />
            <Route path={ROUTES.GAME_DETAILS} element={<GameDetailPage />} />
            <Route path={ROUTES.USER_SETTINGS} element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}
