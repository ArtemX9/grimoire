import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { type Reducer, applyMiddleware, combineReducers, createStore } from 'redux';
import { thunk } from 'redux-thunk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ChangePasswordPageContainer from '@/pages/ChangePasswordPage/ChangePasswordPageContainer';
import authReducer, { AUTH_SLICE } from '@/store/state/auth/index';
import usersReducer, { USERS_SLICE } from '@/store/state/users/index';

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

function makeStore() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rootReducer: Reducer<any, any> = combineReducers({
    [AUTH_SLICE]: authReducer,
    [USERS_SLICE]: usersReducer,
  });
  return createStore(rootReducer, applyMiddleware(thunk));
}

function renderPage() {
  const store = makeStore();
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <ChangePasswordPageContainer />
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
});

describe('ChangePasswordPage', () => {
  it('renders the three password fields and submit button', () => {
    renderPage();

    expect(screen.getByLabelText(/current \(temporary\) password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /set password/i })).toBeInTheDocument();
  });

  it('shows a mismatch error without calling the API when passwords differ', async () => {
    mockDispatch.mockImplementation(() => Promise.resolve(undefined));
    renderPage();

    await userEvent.type(screen.getByLabelText(/current \(temporary\) password/i), 'tempPass1');
    await userEvent.type(screen.getByLabelText(/^new password$/i), 'newPass123');
    await userEvent.type(screen.getByLabelText(/confirm new password/i), 'differentPass');
    await userEvent.click(screen.getByRole('button', { name: /set password/i }));

    expect(screen.getByText(/do not match/i)).toBeInTheDocument();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('navigates to / on successful password change', async () => {
    mockDispatch.mockImplementation(() => Promise.resolve(undefined));
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
    mockDispatch.mockImplementation(() => Promise.reject(new Error('Forbidden')));
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
    mockDispatch.mockImplementation(() => Promise.reject(new Error('Forbidden')));
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
