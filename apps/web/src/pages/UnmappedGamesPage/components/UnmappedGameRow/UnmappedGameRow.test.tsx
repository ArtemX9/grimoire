import { Platform, UnmappedReasons } from '@grimoire/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { generateUnmappedGame } from '@/test';

import UnmappedGameRow from './UnmappedGameRow';

vi.mock('@/components/PlatformIcon/PlatformIcon', () => ({
  PlatformIcon: () => <span data-testid='platform-icon' />,
}));

const steamPlatform = { id: 1, platform: Platform.STEAM };

function renderRow(overrides = {}, hoverImageClassName = 'h-40 w-40') {
  const game = generateUnmappedGame({ platform: steamPlatform, ...overrides });
  const onMapClick = vi.fn();

  render(<UnmappedGameRow game={game} hoverImageClassName={hoverImageClassName} onMapClick={onMapClick} />);

  return { game, onMapClick };
}

describe('UnmappedGameRow', () => {
  it('renders the game title', () => {
    renderRow({ syncedGameTitle: 'Hollow Knight' });

    expect(screen.getByText('Hollow Knight')).toBeInTheDocument();
  });

  it('renders an img element when coverURL is set', () => {
    renderRow({ coverURL: 'https://example.com/cover.jpg' });

    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/cover.jpg');
  });

  it('renders ImageOff placeholder when coverURL is undefined', () => {
    renderRow({ coverURL: undefined });

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('calls onMapClick with the game when "Map manually" button is clicked', async () => {
    const { game, onMapClick } = renderRow();

    await userEvent.click(screen.getByRole('button', { name: /map manually/i }));

    expect(onMapClick).toHaveBeenCalledTimes(1);
    expect(onMapClick).toHaveBeenCalledWith(game);
  });

  it('renders the platform badge with platform name and icon', () => {
    renderRow({ platform: steamPlatform });

    expect(screen.getByTestId('platform-icon')).toBeInTheDocument();
    expect(screen.getByText(Platform.STEAM)).toBeInTheDocument();
  });

  it('renders "No match" reason badge for NO_MATCH reason', () => {
    renderRow({ reason: UnmappedReasons.NO_MATCH });

    expect(screen.getByText('No match')).toBeInTheDocument();
  });

  it('renders "Low confidence" reason badge for LOW_CONFIDENCE reason', () => {
    renderRow({ reason: UnmappedReasons.LOW_CONFIDENCE });

    expect(screen.getByText('Low confidence')).toBeInTheDocument();
  });

  it('renders "Duplicate match" reason badge for DUPLICATE_MATCH reason', () => {
    renderRow({ reason: UnmappedReasons.DUPLICATE_MATCH });

    expect(screen.getByText('Duplicate match')).toBeInTheDocument();
  });

  it('renders formatted playtime', () => {
    renderRow({ playtimeHours: 3 });

    expect(screen.getByText('3 hours played')).toBeInTheDocument();
  });
});
