import { AsyncStatus, PlatformSyncStatus } from '@grimoire/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Provider } from 'react-redux';
import { type Reducer, applyMiddleware, combineReducers, createStore } from 'redux';
import { thunk } from 'redux-thunk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import xboxReducer, { XBOX_SLICE } from '@/store/state/xbox/index';

import XboxRowContainer from './XboxRowContainer';

vi.mock('@/components/PlatformIcon/PlatformIcon', () => ({
  default: () => <span data-testid='platform-icon' />,
}));

vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn(),
}));

const mockDispatch = vi.fn();

vi.mock('@/store/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/store/hooks')>();
  return {
    ...actual,
    useAppDispatch: () => mockDispatch,
  };
});

function makeStore(status: PlatformSyncStatus | null, syncStatus = AsyncStatus.Idle) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rootReducer: Reducer<any, any> = combineReducers({ [XBOX_SLICE]: xboxReducer });
  return createStore(
    rootReducer,
    {
      [XBOX_SLICE]: {
        status,
        fetchStatus: AsyncStatus.Succeeded,
        syncStatus,
        error: null,
      },
    },
    applyMiddleware(thunk),
  );
}

function renderRow(status: PlatformSyncStatus | null = null, syncStatus = AsyncStatus.Idle) {
  const store = makeStore(status, syncStatus);
  return render(
    <Provider store={store}>
      <XboxRowContainer />
    </Provider>,
  );
}

beforeEach(() => {
  mockDispatch.mockReset();
  mockDispatch.mockImplementation(() => Promise.resolve({ jobId: 'job-1' }));
});

describe('XboxRow', () => {
  it('renders the Xbox platform label', () => {
    renderRow();
    expect(screen.getByText('Xbox')).toBeInTheDocument();
  });

  it('shows "Not connected" status when not connected', () => {
    renderRow({ connected: false });
    expect(screen.getByText('Not connected')).toBeInTheDocument();
  });

  it('shows "Connected" status when connected', () => {
    renderRow({ connected: true });
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('shows the Connect button when not connected', () => {
    renderRow({ connected: false });
    expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument();
  });

  it('shows the Sync button when connected', () => {
    renderRow({ connected: true });
    expect(screen.getByRole('button', { name: /sync/i })).toBeInTheDocument();
  });

  it('shows externalID when present and connected', () => {
    renderRow({ connected: true, externalID: 'GamerTag123' });
    expect(screen.getByText('GamerTag123')).toBeInTheDocument();
  });

  it('does not show externalID section when externalID is absent', () => {
    renderRow({ connected: true });
    expect(screen.queryByText(/account:/i)).not.toBeInTheDocument();
  });

  it('shows "Syncing library…" spinner when isSyncing is true', () => {
    renderRow({ connected: true, isSyncing: true });
    expect(screen.getByText('Syncing library…')).toBeInTheDocument();
  });

  it('does not show syncing spinner when isSyncing is false', () => {
    renderRow({ connected: true, isSyncing: false });
    expect(screen.queryByText('Syncing library…')).not.toBeInTheDocument();
  });

  it('shows last sync time when connected and lastSyncAt is set', () => {
    const date = new Date('2025-03-15T14:30:00Z');
    renderRow({ connected: true, lastSyncAt: date });
    expect(screen.getByText(/last synced/i)).toBeInTheDocument();
  });

  it('does not show last sync time when not connected', () => {
    renderRow({ connected: false, lastSyncAt: new Date() });
    expect(screen.queryByText(/last synced/i)).not.toBeInTheDocument();
  });

  it('dispatches syncXbox thunk when Sync button is clicked', async () => {
    renderRow({ connected: true });
    await userEvent.click(screen.getByRole('button', { name: /sync/i }));
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('shows "Syncing…" label on Sync button when sync is pending', () => {
    renderRow({ connected: true }, AsyncStatus.Loading);
    expect(screen.getByRole('button', { name: /syncing/i })).toBeInTheDocument();
  });
});
