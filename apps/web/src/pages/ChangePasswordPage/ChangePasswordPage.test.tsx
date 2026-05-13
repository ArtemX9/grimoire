import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useChangePassword } from '@/api/users';
import { ChangePasswordPage } from '@/pages/ChangePasswordPage/ChangePasswordPage';
import { makeQueryClient } from '@/test/renderWithQuery';

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

const mockMutateAsync = vi.fn();

vi.mock('@/api/users', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/users')>();
  return {
    ...actual,
    useChangePassword: vi.fn(),
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderPage() {
  const queryClient = makeQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ChangePasswordPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function setupIdleMock() {
  vi.mocked(useChangePassword).mockReturnValue({
    mutateAsync: mockMutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useChangePassword>);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockNavigate.mockReset();
  mockMutateAsync.mockReset();
});

describe('ChangePasswordPage', () => {
  it('renders the three password fields and submit button', () => {
    setupIdleMock();
    renderPage();

    expect(screen.getByLabelText(/current \(temporary\) password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /set password/i })).toBeInTheDocument();
  });

  it('shows a mismatch error without calling the API when passwords differ', async () => {
    setupIdleMock();
    renderPage();

    await userEvent.type(screen.getByLabelText(/current \(temporary\) password/i), 'tempPass1');
    await userEvent.type(screen.getByLabelText(/^new password$/i), 'newPass123');
    await userEvent.type(screen.getByLabelText(/confirm new password/i), 'differentPass');
    await userEvent.click(screen.getByRole('button', { name: /set password/i }));

    expect(screen.getByText(/do not match/i)).toBeInTheDocument();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('navigates to / on successful password change', async () => {
    setupIdleMock();
    mockMutateAsync.mockResolvedValue(undefined);
    renderPage();

    await userEvent.type(screen.getByLabelText(/current \(temporary\) password/i), 'tempPass1');
    await userEvent.type(screen.getByLabelText(/^new password$/i), 'newPass123');
    await userEvent.type(screen.getByLabelText(/confirm new password/i), 'newPass123');
    await userEvent.click(screen.getByRole('button', { name: /set password/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('shows an error message when the API call fails', async () => {
    setupIdleMock();
    mockMutateAsync.mockRejectedValue(new Error('Forbidden'));
    renderPage();

    await userEvent.type(screen.getByLabelText(/current.*password/i), 'wrongTemp');
    await userEvent.type(screen.getByLabelText(/^new password$/i), 'newPass123');
    await userEvent.type(screen.getByLabelText(/confirm new password/i), 'newPass123');
    await userEvent.click(screen.getByRole('button', { name: /set password/i }));

    await waitFor(() => {
      expect(screen.getByText(/could not change password/i)).toBeInTheDocument();
    });
  });

  it('does not navigate when the API call fails', async () => {
    setupIdleMock();
    mockMutateAsync.mockRejectedValue(new Error('Forbidden'));
    renderPage();

    await userEvent.type(screen.getByLabelText(/current.*password/i), 'wrongTemp');
    await userEvent.type(screen.getByLabelText(/^new password$/i), 'newPass123');
    await userEvent.type(screen.getByLabelText(/confirm new password/i), 'newPass123');
    await userEvent.click(screen.getByRole('button', { name: /set password/i }));

    await waitFor(() => {
      expect(screen.getByText(/could not change password/i)).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
