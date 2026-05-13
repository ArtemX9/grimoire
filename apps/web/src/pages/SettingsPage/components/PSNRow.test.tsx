import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useConnectPSN, useGetPSNStatus, useSyncPSN } from '@/api/playstation';

import PSNRow from './PSNRow';

vi.mock('@/components/PlatformIcon/PlatformIcon', () => ({
  default: () => <span data-testid='platform-icon' />,
}));

vi.mock('@/api/playstation', () => ({
  useGetPSNStatus: vi.fn(),
  useConnectPSN: vi.fn(),
  useSyncPSN: vi.fn(),
}));

vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn(),
}));

const mockSyncMutateAsync = vi.fn();
const mockConnectMutateAsync = vi.fn();

function mockStatus(overrides: Partial<{ connected: boolean; externalID?: string; isSyncing?: boolean; lastSyncAt?: Date }> = {}) {
  vi.mocked(useGetPSNStatus).mockReturnValue({
    data: { connected: false, ...overrides },
    isLoading: false,
  } as unknown as ReturnType<typeof useGetPSNStatus>);
}

beforeEach(() => {
  mockSyncMutateAsync.mockReset();
  mockConnectMutateAsync.mockReset();

  vi.mocked(useConnectPSN).mockReturnValue({
    mutateAsync: mockConnectMutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useConnectPSN>);

  vi.mocked(useSyncPSN).mockReturnValue({
    mutateAsync: mockSyncMutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useSyncPSN>);

  mockStatus();
});

describe('PSNRow', () => {
  it('renders the PlayStation Network label', () => {
    render(<PSNRow />);

    expect(screen.getByText('PlayStation Network')).toBeInTheDocument();
  });

  it('shows "Not connected" status when not connected', () => {
    mockStatus({ connected: false });

    render(<PSNRow />);

    expect(screen.getByText('Not connected')).toBeInTheDocument();
  });

  it('shows "Connected" status when connected', () => {
    mockStatus({ connected: true });

    render(<PSNRow />);

    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('shows the Connect button when not connected and input is hidden', () => {
    mockStatus({ connected: false });

    render(<PSNRow />);

    expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument();
  });

  it('shows the Sync button when connected', () => {
    mockStatus({ connected: true });

    render(<PSNRow />);

    expect(screen.getByRole('button', { name: /^sync$/i })).toBeInTheDocument();
  });

  it('shows username input after clicking Connect', async () => {
    mockStatus({ connected: false });

    render(<PSNRow />);

    await userEvent.click(screen.getByRole('button', { name: /connect/i }));

    expect(screen.getByPlaceholderText(/psn username/i)).toBeInTheDocument();
  });

  it('shows externalID when present and connected', () => {
    mockStatus({ connected: true, externalID: 'PSNUser42' });

    render(<PSNRow />);

    expect(screen.getByText('PSNUser42')).toBeInTheDocument();
  });

  it('does not show externalID section when externalID is absent', () => {
    mockStatus({ connected: true, externalID: undefined });

    render(<PSNRow />);

    expect(screen.queryByText(/account:/i)).not.toBeInTheDocument();
  });

  it('shows "Syncing library…" spinner when isSyncing is true', () => {
    mockStatus({ connected: true, isSyncing: true });

    render(<PSNRow />);

    expect(screen.getByText('Syncing library…')).toBeInTheDocument();
  });

  it('does not show syncing spinner when isSyncing is false', () => {
    mockStatus({ connected: true, isSyncing: false });

    render(<PSNRow />);

    expect(screen.queryByText('Syncing library…')).not.toBeInTheDocument();
  });

  it('shows last sync time when connected and lastSyncAt is set', () => {
    const date = new Date('2025-03-15T14:30:00Z');
    mockStatus({ connected: true, lastSyncAt: date });

    render(<PSNRow />);

    expect(screen.getByText(/last synced/i)).toBeInTheDocument();
  });

  it('does not show last sync time when not connected', () => {
    mockStatus({ connected: false, lastSyncAt: new Date() });

    render(<PSNRow />);

    expect(screen.queryByText(/last synced/i)).not.toBeInTheDocument();
  });

  it('calls syncPSN mutateAsync when Sync button is clicked', async () => {
    mockStatus({ connected: true });
    mockSyncMutateAsync.mockResolvedValue(undefined);

    render(<PSNRow />);

    await userEvent.click(screen.getByRole('button', { name: /^sync$/i }));

    expect(mockSyncMutateAsync).toHaveBeenCalled();
  });

  it('shows "Syncing…" label on Sync button when sync is pending', () => {
    vi.mocked(useSyncPSN).mockReturnValue({
      mutateAsync: mockSyncMutateAsync,
      isPending: true,
    } as unknown as ReturnType<typeof useSyncPSN>);
    mockStatus({ connected: true });

    render(<PSNRow />);

    expect(screen.getByRole('button', { name: /syncing/i })).toBeInTheDocument();
  });
});
