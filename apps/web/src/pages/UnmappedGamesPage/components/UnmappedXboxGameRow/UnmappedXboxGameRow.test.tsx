import { Platform, UnmappedReasons } from '@grimoire/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { generateUnmappedGame } from '@/test';

import UnmappedXboxGameRow from './UnmappedXboxGameRow';

vi.mock('@/components/PlatformIcon/PlatformIcon', () => ({
  PlatformIcon: () => <span data-testid='platform-icon' />,
}));

const xboxPlatform = { id: 3, platform: Platform.Xbox };

function renderRow(overrides = {}) {
  const game = generateUnmappedGame({ platform: xboxPlatform, ...overrides });
  const onMapClick = vi.fn();
  const onDeleteClick = vi.fn();

  render(<UnmappedXboxGameRow game={game} onMapClick={onMapClick} onDeleteClick={onDeleteClick} />);

  return { game, onMapClick, onDeleteClick };
}

describe('UnmappedXboxGameRow', () => {
  it('renders the game title', () => {
    renderRow({ syncedGameTitle: 'Halo Infinite' });

    expect(screen.getByText('Halo Infinite')).toBeInTheDocument();
  });

  it('renders a cover image when coverURL is set', () => {
    renderRow({ coverURL: 'https://example.com/halo.jpg' });

    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/halo.jpg');
  });

  it('renders an ImageOff placeholder when coverURL is absent', () => {
    renderRow({ coverURL: undefined });

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('calls onMapClick with the game when "Map manually" is clicked', async () => {
    const { game, onMapClick } = renderRow();

    await userEvent.click(screen.getByRole('button', { name: /map manually/i }));

    expect(onMapClick).toHaveBeenCalledWith(game);
  });

  it('renders the Xbox platform badge', () => {
    renderRow();

    expect(screen.getByText(Platform.Xbox)).toBeInTheDocument();
    expect(screen.getByTestId('platform-icon')).toBeInTheDocument();
  });

  it('renders the reason badge', () => {
    renderRow({ reason: UnmappedReasons.NO_MATCH });

    expect(screen.getByText('No match')).toBeInTheDocument();
  });
});
