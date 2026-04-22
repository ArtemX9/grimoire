import { Platform, UserGame } from '@grimoire/shared';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { generateUserGame } from '@/test';

import { GameDetailPage } from './GameDetailPage';

vi.mock('@/components/ui/scroll-area', () => ({ ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock('@/pages/GameDetailPage/components/LogSessionDialog', () => ({ default: () => null }));
vi.mock('@/components/IGDBGameSearchDialog/IGDBGameSearchDialogContainer', () => ({ default: () => null }));
vi.mock('@/pages/GameDetailPage/components/GameNotes/GameNotes', () => ({ default: () => null }));

function renderPage(game: UserGame | null, props = {}) {
  const defaults = {
    game,
    isLoading: false,
    sessions: [],
    isUpdating: false,
    isDeleting: false,
    deleteDialogOpen: false,
    logSessionOpen: false,
    remapDialogOpen: false,
    platformPickerOpen: false,
    selectedPlatformForRemap: null,
    onDeleteDialogOpen: vi.fn(),
    onLogSessionOpen: vi.fn(),
    onRemapDialogOpen: vi.fn(),
    onPlatformPickerOpen: vi.fn(),
    onPlatformSelect: vi.fn(),
    onStatusChange: vi.fn(),
    onMoodsChange: vi.fn(),
    onRatingChange: vi.fn(),
    onSaveNotes: vi.fn(),
    onDelete: vi.fn(),
    onRemapGame: vi.fn(),
    onBack: vi.fn(),
  };
  return render(
    <MemoryRouter>
      <GameDetailPage {...defaults} {...props} />
    </MemoryRouter>,
  );
}

describe('GameDetailPage', () => {
  it('renders game title', () => {
    const game = generateUserGame({ title: 'Elden Ring' });
    const { getByRole } = renderPage(game);
    expect(getByRole('heading', { name: 'Elden Ring' })).toBeInTheDocument();
  });

  it('renders "Game not found" when game is null', () => {
    const { getByText } = renderPage(null);
    expect(getByText(/game not found/i)).toBeInTheDocument();
  });

  it('does not render platforms section when platforms is empty', () => {
    const game = generateUserGame({ platforms: [] });
    const { queryByText } = renderPage(game);
    expect(queryByText('Owned on')).toBeNull();
  });

  it('renders platform badges for each owned platform', () => {
    const game = generateUserGame({
      platforms: [{ platformID: 1, platformName: Platform.STEAM, externalID: '1234', externalTitle: 'Elden Ring' }],
    });
    const { getByText } = renderPage(game);
    expect(getByText('Owned on')).toBeInTheDocument();
    expect(getByText(Platform.STEAM)).toBeInTheDocument();
  });

  it('renders multiple platforms', () => {
    const game = generateUserGame({
      platforms: [
        { platformID: 1, platformName: Platform.STEAM, externalID: '1234', externalTitle: 'Elden Ring' },
        { platformID: 2, platformName: Platform.PlayStation, externalID: 'CUSA12345', externalTitle: 'Elden Ring' },
      ],
    });
    const { getByText } = renderPage(game);
    expect(getByText(Platform.STEAM)).toBeInTheDocument();
    expect(getByText(Platform.PlayStation)).toBeInTheDocument();
  });

  it('shows summary when both summary and storyLine are present', () => {
    const game = generateUserGame({ summary: 'The summary text', storyLine: 'The storyline text' });
    const { getByText, queryByText } = renderPage(game);
    expect(getByText('The summary text')).toBeInTheDocument();
    expect(queryByText('The storyline text')).toBeNull();
  });

  it('shows storyLine when only storyLine is present and summary is absent', () => {
    const game = generateUserGame({ storyLine: 'The storyline text' });
    const { getByText } = renderPage(game);
    expect(getByText('The storyline text')).toBeInTheDocument();
  });

  it('shows summary when only summary is present and storyLine is absent', () => {
    const game = generateUserGame({ summary: 'The summary text' });
    const { getByText } = renderPage(game);
    expect(getByText('The summary text')).toBeInTheDocument();
  });

  it('renders nothing when neither summary nor storyLine is present', () => {
    const game = generateUserGame({ summary: undefined, storyLine: undefined });
    const { queryByText } = renderPage(game);
    expect(queryByText('About')).toBeNull();
  });

  it('calls onRemapDialogOpen when Re-map is clicked and game has no platforms', () => {
    const onRemapDialogOpen = vi.fn();
    const game = generateUserGame({ platforms: [] });
    const { getByRole } = renderPage(game, { onRemapDialogOpen });
    getByRole('button', { name: /re-map/i }).click();
    expect(onRemapDialogOpen).toHaveBeenCalledWith(true);
  });

  it('calls onPlatformSelect with the single platform when Re-map is clicked and game has 1 platform', () => {
    const onPlatformSelect = vi.fn();
    const platform = { platformID: 1, platformName: Platform.STEAM, externalID: '123', externalTitle: 'Half-Life 2' };
    const game = generateUserGame({ platforms: [platform] });
    const { getByRole } = renderPage(game, { onPlatformSelect });
    getByRole('button', { name: /re-map/i }).click();
    expect(onPlatformSelect).toHaveBeenCalledWith(platform);
  });

  it('calls onPlatformPickerOpen when Re-map is clicked and game has 2+ platforms', () => {
    const onPlatformPickerOpen = vi.fn();
    const game = generateUserGame({
      platforms: [
        { platformID: 1, platformName: Platform.STEAM, externalID: '123', externalTitle: 'Half-Life 2' },
        { platformID: 2, platformName: Platform.PlayStation, externalID: 'CUSA001', externalTitle: 'Half-Life 2 PS' },
      ],
    });
    const { getByRole } = renderPage(game, { onPlatformPickerOpen });
    getByRole('button', { name: /re-map/i }).click();
    expect(onPlatformPickerOpen).toHaveBeenCalledWith(true);
  });

  it('renders platform picker dialog entries when platformPickerOpen is true', () => {
    const game = generateUserGame({
      platforms: [
        { platformID: 1, platformName: Platform.STEAM, externalID: '123', externalTitle: 'Half-Life 2' },
        { platformID: 2, platformName: Platform.PlayStation, externalID: 'CUSA001', externalTitle: 'Half-Life 2 PS' },
      ],
    });
    const { getByText } = renderPage(game, { platformPickerOpen: true });
    expect(getByText('Half-Life 2')).toBeInTheDocument();
    expect(getByText('Half-Life 2 PS')).toBeInTheDocument();
  });

  it('calls onPlatformSelect when a platform entry is clicked in the picker', () => {
    const onPlatformSelect = vi.fn();
    const platform = { platformID: 1, platformName: Platform.STEAM, externalID: '123', externalTitle: 'Half-Life 2' };
    const game = generateUserGame({
      platforms: [
        platform,
        { platformID: 2, platformName: Platform.PlayStation, externalID: 'CUSA001', externalTitle: 'Half-Life 2 PS' },
      ],
    });
    const { getByText } = renderPage(game, { platformPickerOpen: true, onPlatformSelect });
    getByText('Half-Life 2').closest('button')!.click();
    expect(onPlatformSelect).toHaveBeenCalledWith(platform);
  });
});
