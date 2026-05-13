import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGetXboxStatus, useSyncXbox } from '@/api/xbox';

import XboxRow from './XboxRow';

vi.mock('@/components/PlatformIcon/PlatformIcon', () => ({
  default: () => <span data-testid='platform-icon' />,
}));

vi.mock('@/api/xbox', () => ({
  useGetXboxStatus: vi.fn(),
  useSyncXbox: vi.fn(),
}));

vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn(),
}));

const mockMutateAsync = vi.fn();

function mockStatus(overrides: Partial<{ connected: boolean; externalID?: string; isSyncing?: boolean; lastSyncAt?: Date }> = {}) {
  vi.mocked(useGetXboxStatus).mockReturnValue({
    data: { connected: false, ...overrides },
    isLoading: false,
  } as unknown as ReturnType<typeof useGetXboxStatus>);
}

beforeEach(() => {
  mockMutateAsync.mockReset();

  vi.mocked(useSyncXbox).mockReturnValue({
    mutateAsync: mockMutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useSyncXbox>);

  mockStatus();
});

describe('XboxRow', () => {
  it('renders the Xbox platform label', () => {
    render(<XboxRow />);

    expect(screen.getByText('Xbox')).toBeInTheDocument();
  });

  it('shows "Not connected" status when not connected', () => {
    mockStatus({ connected: false });

    render(<XboxRow />);

    expect(screen.getByText('Not connected')).toBeInTheDocument();
  });

  it('shows "Connected" status when connected', () => {
    mockStatus({ connected: true });

    render(<XboxRow />);

    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('shows the Connect button when not connected', () => {
    mockStatus({ connected: false });

    render(<XboxRow />);

    expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument();
  });

  it('shows the Sync button when connected', () => {
    mockStatus({ connected: true });

    render(<XboxRow />);

    expect(screen.getByRole('button', { name: /sync/i })).toBeInTheDocument();
  });

  it('shows externalID when present and connected', () => {
    mockStatus({ connected: true, externalID: 'GamerTag123' });

    render(<XboxRow />);

    expect(screen.getByText('GamerTag123')).toBeInTheDocument();
  });

  it('does not show externalID section when externalID is absent', () => {
    mockStatus({ connected: true, externalID: undefined });

    render(<XboxRow />);

    expect(screen.queryByText(/account:/i)).not.toBeInTheDocument();
  });

  it('shows "Syncing library…" spinner when isSyncing is true', () => {
    mockStatus({ connected: true, isSyncing: true });

    render(<XboxRow />);

    expect(screen.getByText('Syncing library…')).toBeInTheDocument();
  });

  it('does not show syncing spinner when isSyncing is false', () => {
    mockStatus({ connected: true, isSyncing: false });

    render(<XboxRow />);

    expect(screen.queryByText('Syncing library…')).not.toBeInTheDocument();
  });

  it('shows last sync time when connected and lastSyncAt is set', () => {
    const date = new Date('2025-03-15T14:30:00Z');
    mockStatus({ connected: true, lastSyncAt: date });

    render(<XboxRow />);

    expect(screen.getByText(/last synced/i)).toBeInTheDocument();
  });

  it('does not show last sync time when not connected', () => {
    mockStatus({ connected: false, lastSyncAt: new Date() });

    render(<XboxRow />);

    expect(screen.queryByText(/last synced/i)).not.toBeInTheDocument();
  });

  it('calls syncXbox mutateAsync when Sync button is clicked', async () => {
    mockStatus({ connected: true });
    mockMutateAsync.mockResolvedValue({ jobId: 'job-1' });

    render(<XboxRow />);

    await userEvent.click(screen.getByRole('button', { name: /sync/i }));

    expect(mockMutateAsync).toHaveBeenCalled();
  });

  it('shows "Syncing…" label on Sync button when sync is pending', () => {
    vi.mocked(useSyncXbox).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    } as unknown as ReturnType<typeof useSyncXbox>);
    mockStatus({ connected: true });

    render(<XboxRow />);

    expect(screen.getByRole('button', { name: /syncing/i })).toBeInTheDocument();
  });
});
