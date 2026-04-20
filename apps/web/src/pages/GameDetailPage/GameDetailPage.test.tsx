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
    onDeleteDialogOpen: vi.fn(),
    onLogSessionOpen: vi.fn(),
    onRemapDialogOpen: vi.fn(),
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
});
