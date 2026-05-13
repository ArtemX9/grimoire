import { Platform, UnmappedReasons } from '@grimoire/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { generateUnmappedGame } from '@/test';

import UnmappedPSNGameRow from './UnmappedPSNGameRow';

vi.mock('@/components/PlatformIcon/PlatformIcon', () => ({
  PlatformIcon: () => <span data-testid='platform-icon' />,
}));

const psnPlatform = { id: 2, platform: Platform.PlayStation };

function renderRow(overrides = {}) {
  const game = generateUnmappedGame({ platform: psnPlatform, ...overrides });
  const onMapClick = vi.fn();

  render(<UnmappedPSNGameRow game={game} onMapClick={onMapClick} />);

  return { game, onMapClick };
}

describe('UnmappedPSNGameRow', () => {
  it('renders the game title', () => {
    renderRow({ syncedGameTitle: 'God of War' });

    expect(screen.getByText('God of War')).toBeInTheDocument();
  });

  it('renders a cover image when coverURL is set', () => {
    renderRow({ coverURL: 'https://example.com/gow.jpg' });

    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/gow.jpg');
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

  it('renders the PlayStation platform badge', () => {
    renderRow();

    expect(screen.getByText(Platform.PlayStation)).toBeInTheDocument();
    expect(screen.getByTestId('platform-icon')).toBeInTheDocument();
  });

  it('renders the reason badge', () => {
    renderRow({ reason: UnmappedReasons.LOW_CONFIDENCE });

    expect(screen.getByText('Low confidence')).toBeInTheDocument();
  });
});
