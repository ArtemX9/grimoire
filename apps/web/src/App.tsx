import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import Layout from '@/components/Layout/Layout';
import { AdminRoute } from '@/components/ProtectedRoute/AdminRoute';
import { MustChangePasswordRoute } from '@/components/ProtectedRoute/MustChangePasswordRoute';
import { ProtectedRoute } from '@/components/ProtectedRoute/ProtectedRoute';
import { Toaster } from '@/components/ui/toaster';
import { ROUTES } from '@/constants/routes';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage/AdminDashboardPage';
import AdminSetupPageContainer from '@/pages/AdminSetupPage/AdminSetupPageContainer';
import ChangePasswordPageContainer from '@/pages/ChangePasswordPage/ChangePasswordPageContainer';
import GameDetailPageContainer from '@/pages/GameDetailPage/GameDetailPageContainer';
import { LibraryPageContainer } from '@/pages/LibraryPage/LibraryPageContainer';
import LoginPageContainer from '@/pages/LoginPage/LoginPageContainer';
import SettingsPageContainer from '@/pages/SettingsPage/SettingsPageContainer';
import UnmappedGamesPageContainer from '@/pages/UnmappedGamesPage/UnmappedGamesPageContainer';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectIsBootstrapped } from '@/store/state/auth/selectors';
import { getSession } from '@/store/thunks/auth/index';

export default function App() {
  const dispatch = useAppDispatch();
  const isBootstrapped = useAppSelector(selectIsBootstrapped);

  useEffect(function bootstrapSession() {
    if (!isBootstrapped) {
      dispatch(getSession());
    }
  }, []);

  return (
    <>
      <Routes>
        <Route path={ROUTES.LOGIN} element={<LoginPageContainer />} />
        <Route path={ROUTES.ADMIN_SETUP} element={<AdminSetupPageContainer />} />

        <Route element={<MustChangePasswordRoute />}>
          <Route path={ROUTES.CHANGE_PASSWORD} element={<ChangePasswordPageContainer />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminDashboardPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path={ROUTES.DEFAULT} element={<LibraryPageContainer />} />
            <Route path={ROUTES.GAME_DETAILS} element={<GameDetailPageContainer />} />
            <Route path={ROUTES.UNMAPPED_GAMES} element={<UnmappedGamesPageContainer />} />
            <Route path={ROUTES.USER_SETTINGS} element={<SettingsPageContainer />} />
          </Route>
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}
