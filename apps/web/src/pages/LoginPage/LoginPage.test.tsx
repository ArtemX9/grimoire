import { AsyncStatus, Role } from '@grimoire/shared';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { type Reducer, applyMiddleware, combineReducers, createStore } from 'redux';
import { thunk } from 'redux-thunk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LoginPageContainer from '@/pages/LoginPage/LoginPageContainer';
import authReducer, { AUTH_SLICE, AuthState } from '@/store/state/auth/index';
import type { Session } from '@/store/state/auth/index';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockDispatch = vi.fn();

vi.mock('@/store/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/store/hooks')>();
  return {
    ...actual,
    useAppDispatch: () => mockDispatch,
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeStore(isBootstrapped: boolean, session: Session | null = null) {
  const authState: AuthState = {
    session,
    status: isBootstrapped ? AsyncStatus.Succeeded : AsyncStatus.Loading,
    isBootstrapped,
    error: null,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rootReducer: Reducer<any, any> = combineReducers({ [AUTH_SLICE]: authReducer });
  return createStore(rootReducer, { [AUTH_SLICE]: authState }, applyMiddleware(thunk));
}

function renderLoginPage(isBootstrapped: boolean, session: Session | null = null) {
  const store = makeStore(isBootstrapped, session);
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <LoginPageContainer />
      </MemoryRouter>
    </Provider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockNavigate.mockReset();
  mockDispatch.mockReset();
  mockDispatch.mockImplementation(() => Promise.reject(new Error('Not mocked')));
});

describe('LoginPage', () => {
  it('renders the sign-in form with email and password inputs', () => {
    renderLoginPage(true);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('does not render a sign-up option', () => {
    renderLoginPage(true);

    expect(screen.queryByText(/sign up/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/create account/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/register/i)).not.toBeInTheDocument();
  });

  it('renders nothing while not yet bootstrapped', () => {
    const { container } = renderLoginPage(false);

    expect(container).toBeEmptyDOMElement();
  });

  it('redirects to / when a session already exists', () => {
    const session: Session = {
      user: {
        id: '1',
        email: 'user@example.com',
        name: 'User',
        role: Role.USER,
        mustChangePassword: false,
        aiEnabled: true,
        aiRequestsLimit: null,
      },
    };
    renderLoginPage(true, session);

    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
  });

  it('navigates to / after successful sign-in as a regular user', async () => {
    mockDispatch.mockImplementation(() => Promise.resolve({ user: { role: Role.USER, mustChangePassword: false } }));
    renderLoginPage(true);

    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('navigates to /change-password when mustChangePassword is true', async () => {
    mockDispatch.mockImplementation(() => Promise.resolve({ user: { role: Role.USER, mustChangePassword: true } }));
    renderLoginPage(true);

    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/change-password', { replace: true });
    });
  });

  it('navigates to /admin/dashboard when role is ADMIN', async () => {
    mockDispatch.mockImplementation(() => Promise.resolve({ user: { role: Role.ADMIN, mustChangePassword: false } }));
    renderLoginPage(true);

    await userEvent.type(screen.getByLabelText(/email/i), 'admin@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard', { replace: true });
    });
  });

  it('shows an error message when the API returns an error', async () => {
    mockDispatch.mockImplementation(() => Promise.reject(new Error('Unauthorized')));
    renderLoginPage(true);

    await userEvent.type(screen.getByLabelText(/email/i), 'bad@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  it('does not navigate after an API error', async () => {
    mockDispatch.mockImplementation(() => Promise.reject(new Error('Unauthorized')));
    renderLoginPage(true);

    await userEvent.type(screen.getByLabelText(/email/i), 'bad@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
