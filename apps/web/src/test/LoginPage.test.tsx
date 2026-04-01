import { Role } from '@grimoire/shared';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGetSessionQuery, useSignInMutation } from '@/api/authApi';
import { LoginPage } from '@/pages/LoginPage/LoginPage';

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

// signIn is the function passed to the mutation trigger; it must return an
// object with .unwrap() that resolves/rejects to simulate RTK Query behaviour.
const mockSignInTrigger = vi.fn();

vi.mock('@/api/authApi', () => ({
  useGetSessionQuery: vi.fn(),
  useSignInMutation: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

function setupIdleMocks(sessionOverrides?: Partial<{ data: unknown; isLoading: boolean }>) {
  vi.mocked(useGetSessionQuery).mockReturnValue({
    data: null,
    isLoading: false,
    ...sessionOverrides,
  } as unknown as ReturnType<typeof useGetSessionQuery>);

  vi.mocked(useSignInMutation).mockReturnValue([
    mockSignInTrigger,
    { isLoading: false } as unknown as ReturnType<typeof useSignInMutation>[1],
  ]);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockNavigate.mockReset();
  mockSignInTrigger.mockReset();
});

describe('LoginPage', () => {
  it('renders the sign-in form with email and password inputs', () => {
    setupIdleMocks();
    renderLoginPage();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('does not render a sign-up option', () => {
    setupIdleMocks();
    renderLoginPage();

    expect(screen.queryByText(/sign up/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/create account/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/register/i)).not.toBeInTheDocument();
  });

  it('renders nothing while session is loading', () => {
    setupIdleMocks({ isLoading: true, data: undefined });
    const { container } = renderLoginPage();

    expect(container).toBeEmptyDOMElement();
  });

  it('redirects to / when a session already exists', () => {
    setupIdleMocks({
      data: {
        user: {
          id: '1',
          email: 'user@example.com',
          name: 'User',
          role: Role.USER,
          mustChangePassword: false,
          aiEnabled: true,
          aiRequestsLimit: null,
        },
      },
    });
    renderLoginPage();

    // Navigate element rendered (not the form)
    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
  });

  it('navigates to / after successful sign-in as a regular user', async () => {
    setupIdleMocks();
    mockSignInTrigger.mockReturnValue({
      unwrap: () => Promise.resolve({ user: { role: Role.USER, mustChangePassword: false } }),
    });

    renderLoginPage();

    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('navigates to /change-password when mustChangePassword is true', async () => {
    setupIdleMocks();
    mockSignInTrigger.mockReturnValue({
      unwrap: () => Promise.resolve({ user: { role: Role.USER, mustChangePassword: true } }),
    });

    renderLoginPage();

    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/change-password', { replace: true });
    });
  });

  it('navigates to /admin/dashboard when role is ADMIN', async () => {
    setupIdleMocks();
    mockSignInTrigger.mockReturnValue({
      unwrap: () => Promise.resolve({ user: { role: Role.ADMIN, mustChangePassword: false } }),
    });

    renderLoginPage();

    await userEvent.type(screen.getByLabelText(/email/i), 'admin@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard', { replace: true });
    });
  });

  it('shows an error message when the API returns an error', async () => {
    setupIdleMocks();
    mockSignInTrigger.mockReturnValue({
      unwrap: () => Promise.reject(new Error('Unauthorized')),
    });

    renderLoginPage();

    await userEvent.type(screen.getByLabelText(/email/i), 'bad@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  it('does not navigate after an API error', async () => {
    setupIdleMocks();
    mockSignInTrigger.mockReturnValue({
      unwrap: () => Promise.reject(new Error('Unauthorized')),
    });

    renderLoginPage();

    await userEvent.type(screen.getByLabelText(/email/i), 'bad@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
