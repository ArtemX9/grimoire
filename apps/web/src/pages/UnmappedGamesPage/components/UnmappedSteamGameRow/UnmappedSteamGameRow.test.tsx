import { Platform, UnmappedReasons } from '@grimoire/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { generateUnmappedGame } from '@/test';

import UnmappedSteamGameRow from './UnmappedSteamGameRow';

vi.mock('@/components/PlatformIcon/PlatformIcon', () => ({
  PlatformIcon: () => <span data-testid='platform-icon' />,
}));

const steamPlatform = { id: 1, platform: Platform.STEAM };

function renderRow(overrides = {}) {
  const game = generateUnmappedGame({ platform: steamPlatform, ...overrides });
  const onMapClick = vi.fn();
  const onDeleteClick = vi.fn();

  render(<UnmappedSteamGameRow game={game} onMapClick={onMapClick} onDeleteClick={onDeleteClick} />);

  return { game, onMapClick, onDeleteClick };
}

describe('UnmappedSteamGameRow', () => {
  it('renders the game title', () => {
    const { game } = renderRow({ syncedGameTitle: 'Hollow Knight' });

    expect(screen.getByText('Hollow Knight')).toBeInTheDocument();
  });

  it('renders an img element when coverURL is set', () => {
    renderRow({ coverURL: 'https://example.com/cover.jpg' });

    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('renders a placeholder without img when coverURL is undefined', () => {
    renderRow({ coverURL: undefined });

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders "Map manually" button and calls onMapClick with the game when clicked', async () => {
    const { game, onMapClick } = renderRow();

    await userEvent.click(screen.getByRole('button', { name: /map manually/i }));

    expect(onMapClick).toHaveBeenCalledWith(game);
  });

  it('renders the platform badge', () => {
    renderRow();

    expect(screen.getByTestId('platform-icon')).toBeInTheDocument();
    expect(screen.getByText(Platform.STEAM)).toBeInTheDocument();
  });

  it('renders the reason badge', () => {
    renderRow({ reason: UnmappedReasons.LOW_CONFIDENCE });

    expect(screen.getByText('Low confidence')).toBeInTheDocument();
  });
});
