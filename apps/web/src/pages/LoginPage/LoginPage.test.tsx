import { Role } from '@grimoire/shared';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/api/api';
import { useSignInMutation } from '@/api/authApi';
import { LoginPage } from '@/pages/LoginPage/LoginPage';
import authReducer, { AuthState } from '@/store/authSlice';

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

const mockSignInTrigger = vi.fn();

vi.mock('@/api/authApi', () => ({
  useSignInMutation: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeStore(auth: AuthState) {
  return configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
      auth: authReducer,
    },
    preloadedState: { auth },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
  });
}

function renderLoginPage(auth: AuthState) {
  const store = makeStore(auth);
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </Provider>,
  );
}

const NOT_BOOTSTRAPPED: AuthState = { session: null, isBootstrapped: false };
const NO_SESSION: AuthState = { session: null, isBootstrapped: true };

function withSession(overrides: { role?: Role; mustChangePassword?: boolean } = {}): AuthState {
  return {
    isBootstrapped: true,
    session: {
      user: {
        id: '1',
        email: 'user@example.com',
        name: 'User',
        role: Role.USER,
        mustChangePassword: false,
        aiEnabled: true,
        aiRequestsLimit: null,
        ...overrides,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockNavigate.mockReset();
  mockSignInTrigger.mockReset();

  vi.mocked(useSignInMutation).mockReturnValue([
    mockSignInTrigger,
    { isLoading: false } as unknown as ReturnType<typeof useSignInMutation>[1],
  ]);
});

describe('LoginPage', () => {
  it('renders the sign-in form with email and password inputs', () => {
    renderLoginPage(NO_SESSION);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('does not render a sign-up option', () => {
    renderLoginPage(NO_SESSION);

    expect(screen.queryByText(/sign up/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/create account/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/register/i)).not.toBeInTheDocument();
  });

  it('renders nothing while not yet bootstrapped', () => {
    const { container } = renderLoginPage(NOT_BOOTSTRAPPED);

    expect(container).toBeEmptyDOMElement();
  });

  it('redirects to / when a session already exists', () => {
    renderLoginPage(withSession());

    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
  });

  it('navigates to / after successful sign-in as a regular user', async () => {
    renderLoginPage(NO_SESSION);
    mockSignInTrigger.mockReturnValue({
      unwrap: () => Promise.resolve({ user: { role: Role.USER, mustChangePassword: false } }),
    });

    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('navigates to /change-password when mustChangePassword is true', async () => {
    renderLoginPage(NO_SESSION);
    mockSignInTrigger.mockReturnValue({
      unwrap: () => Promise.resolve({ user: { role: Role.USER, mustChangePassword: true } }),
    });

    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/change-password', { replace: true });
    });
  });

  it('navigates to /admin/dashboard when role is ADMIN', async () => {
    renderLoginPage(NO_SESSION);
    mockSignInTrigger.mockReturnValue({
      unwrap: () => Promise.resolve({ user: { role: Role.ADMIN, mustChangePassword: false } }),
    });

    await userEvent.type(screen.getByLabelText(/email/i), 'admin@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard', { replace: true });
    });
  });

  it('shows an error message when the API returns an error', async () => {
    renderLoginPage(NO_SESSION);
    mockSignInTrigger.mockReturnValue({
      unwrap: () => Promise.reject(new Error('Unauthorized')),
    });

    await userEvent.type(screen.getByLabelText(/email/i), 'bad@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  it('does not navigate after an API error', async () => {
    renderLoginPage(NO_SESSION);
    mockSignInTrigger.mockReturnValue({
      unwrap: () => Promise.reject(new Error('Unauthorized')),
    });

    await userEvent.type(screen.getByLabelText(/email/i), 'bad@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
