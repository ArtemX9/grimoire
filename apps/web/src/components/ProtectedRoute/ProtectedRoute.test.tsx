import { Role } from '@grimoire/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';

import { authKeys, Session } from '@/api/auth';
import { AdminRoute } from '@/components/ProtectedRoute/AdminRoute';
import { MustChangePasswordRoute } from '@/components/ProtectedRoute/MustChangePasswordRoute';
import { ProtectedRoute } from '@/components/ProtectedRoute/ProtectedRoute';
import { ROUTES } from '@/constants/routes';
import { makeStore, makeQueryClient } from '@/test/renderWithQuery';
import { generateSession } from '@/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  mustChangePassword: boolean;
  aiEnabled: boolean;
  aiRequestsLimit: number | null;
};

function makeSessionUser(overrides: Partial<SessionUser> = {}): SessionUser {
  return generateSession({ id: '1', email: 'user@example.com', name: 'User', aiEnabled: true, aiRequestsLimit: null, ...overrides }).user;
}

type RenderOptions = {
  session: Session | null | undefined;
  isBootstrapped: boolean;
};

function renderWithRoutes(guardElement: React.ReactElement, { session, isBootstrapped }: RenderOptions, initialEntry = ROUTES.DEFAULT) {
  const queryClient = makeQueryClient();
  const store = makeStore();

  if (isBootstrapped) {
    queryClient.setQueryData(authKeys.session(), session ?? null);
  }
  // If not bootstrapped, leave the query in 'pending' state (no data set)

  return render(
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path={ROUTES.LOGIN} element={<div>Login Page</div>} />
            <Route path={ROUTES.CHANGE_PASSWORD} element={<div>Change Password Page</div>} />
            <Route path={ROUTES.DEFAULT} element={<div>Home Page</div>} />
            <Route element={guardElement}>
              <Route path='/protected' element={<div>Protected Content</div>} />
              <Route path={ROUTES.ADMIN_DASHBOARD} element={<div>Admin Dashboard</div>} />
              <Route path='/must-change' element={<div>Must Change Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </Provider>
    </QueryClientProvider>,
  );
}

// ---------------------------------------------------------------------------
// ProtectedRoute
// ---------------------------------------------------------------------------

describe('ProtectedRoute', () => {
  it('renders loading skeletons while not yet bootstrapped', () => {
    const { container } = renderWithRoutes(<ProtectedRoute />, { session: null, isBootstrapped: false }, '/protected');

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('redirects to /login when there is no session', () => {
    renderWithRoutes(<ProtectedRoute />, { session: null, isBootstrapped: true }, '/protected');

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it(`redirects to ${ROUTES.CHANGE_PASSWORD} when mustChangePassword is true`, () => {
    renderWithRoutes(
      <ProtectedRoute />,
      { session: { user: makeSessionUser({ mustChangePassword: true }) }, isBootstrapped: true },
      '/protected',
    );

    expect(screen.getByText('Change Password Page')).toBeInTheDocument();
  });

  it('renders the outlet when session is valid', () => {
    renderWithRoutes(<ProtectedRoute />, { session: { user: makeSessionUser() }, isBootstrapped: true }, '/protected');

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// AdminRoute
// ---------------------------------------------------------------------------

describe('AdminRoute', () => {
  it('renders loading skeletons while not yet bootstrapped', () => {
    const { container } = renderWithRoutes(<AdminRoute />, { session: null, isBootstrapped: false }, ROUTES.ADMIN_DASHBOARD);

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('redirects to /login when there is no session', () => {
    renderWithRoutes(<AdminRoute />, { session: null, isBootstrapped: true }, ROUTES.ADMIN_DASHBOARD);

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it(`redirects to ${ROUTES.DEFAULT} when the user is not an admin`, () => {
    renderWithRoutes(
      <AdminRoute />,
      { session: { user: makeSessionUser({ role: Role.USER }) }, isBootstrapped: true },
      ROUTES.ADMIN_DASHBOARD,
    );

    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });

  it('renders the outlet when the user is an admin', () => {
    renderWithRoutes(
      <AdminRoute />,
      { session: { user: makeSessionUser({ role: Role.ADMIN }) }, isBootstrapped: true },
      ROUTES.ADMIN_DASHBOARD,
    );

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// MustChangePasswordRoute
// ---------------------------------------------------------------------------

describe('MustChangePasswordRoute', () => {
  it('renders loading skeletons while not yet bootstrapped', () => {
    const { container } = renderWithRoutes(<MustChangePasswordRoute />, { session: null, isBootstrapped: false }, '/must-change');

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('redirects to /login when there is no session', () => {
    renderWithRoutes(<MustChangePasswordRoute />, { session: null, isBootstrapped: true }, '/must-change');

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it(`redirects to ${ROUTES.DEFAULT} when mustChangePassword is false`, () => {
    renderWithRoutes(
      <MustChangePasswordRoute />,
      { session: { user: makeSessionUser({ mustChangePassword: false }) }, isBootstrapped: true },
      '/must-change',
    );

    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });

  it('renders the outlet when mustChangePassword is true', () => {
    renderWithRoutes(
      <MustChangePasswordRoute />,
      { session: { user: makeSessionUser({ mustChangePassword: true }) }, isBootstrapped: true },
      '/must-change',
    );

    expect(screen.getByText('Must Change Content')).toBeInTheDocument();
  });
});
