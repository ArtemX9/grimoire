import { AsyncStatus, Role } from '@grimoire/shared';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { type Reducer, applyMiddleware, combineReducers, createStore } from 'redux';
import { thunk } from 'redux-thunk';
import { describe, expect, it } from 'vitest';

import { AdminRoute } from '@/components/ProtectedRoute/AdminRoute';
import { MustChangePasswordRoute } from '@/components/ProtectedRoute/MustChangePasswordRoute';
import { ProtectedRoute } from '@/components/ProtectedRoute/ProtectedRoute';
import { ROUTES } from '@/constants/routes';
import aiReducer, { AI_SLICE } from '@/store/state/ai/index';
import authReducer, { AUTH_SLICE } from '@/store/state/auth/index';
import type { Session } from '@/store/state/auth/index';
import filtersReducer, { FILTERS_SLICE } from '@/store/state/filters/index';
import gamesReducer, { GAMES_SLICE } from '@/store/state/games/index';
import uiReducer, { UI_SLICE } from '@/store/state/ui/index';
import unmappedGamesReducer, { UNMAPPED_GAMES_SLICE } from '@/store/state/unmappedGames/index';
import { generateSession } from '@/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeStore(session: Session | null, isBootstrapped: boolean) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rootReducer: Reducer<any, any> = combineReducers({
    [AUTH_SLICE]: authReducer,
    [FILTERS_SLICE]: filtersReducer,
    [GAMES_SLICE]: gamesReducer,
    [AI_SLICE]: aiReducer,
    [UI_SLICE]: uiReducer,
    [UNMAPPED_GAMES_SLICE]: unmappedGamesReducer,
  });
  return createStore(
    rootReducer,
    {
      [AUTH_SLICE]: {
        session,
        status: isBootstrapped ? AsyncStatus.Succeeded : AsyncStatus.Loading,
        isBootstrapped,
        error: null,
      },
    },
    applyMiddleware(thunk),
  );
}

type RenderOptions = {
  session: Session | null;
  isBootstrapped: boolean;
};

function renderWithRoutes(guardElement: React.ReactElement, { session, isBootstrapped }: RenderOptions, initialEntry = ROUTES.DEFAULT) {
  const store = makeStore(session, isBootstrapped);

  return render(
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
    </Provider>,
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
    renderWithRoutes(<ProtectedRoute />, { session: generateSession({ mustChangePassword: true }), isBootstrapped: true }, '/protected');

    expect(screen.getByText('Change Password Page')).toBeInTheDocument();
  });

  it('renders the outlet when session is valid', () => {
    renderWithRoutes(<ProtectedRoute />, { session: generateSession(), isBootstrapped: true }, '/protected');

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
    renderWithRoutes(<AdminRoute />, { session: generateSession({ role: Role.USER }), isBootstrapped: true }, ROUTES.ADMIN_DASHBOARD);

    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });

  it('renders the outlet when the user is an admin', () => {
    renderWithRoutes(<AdminRoute />, { session: generateSession({ role: Role.ADMIN }), isBootstrapped: true }, ROUTES.ADMIN_DASHBOARD);

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
      { session: generateSession({ mustChangePassword: false }), isBootstrapped: true },
      '/must-change',
    );

    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });

  it('renders the outlet when mustChangePassword is true', () => {
    renderWithRoutes(
      <MustChangePasswordRoute />,
      { session: generateSession({ mustChangePassword: true }), isBootstrapped: true },
      '/must-change',
    );

    expect(screen.getByText('Must Change Content')).toBeInTheDocument();
  });
});
