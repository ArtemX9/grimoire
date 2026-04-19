import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import UnresolvedGamesBanner from './UnresolvedGamesBanner';

function renderBanner(count: number) {
  return render(
    <MemoryRouter>
      <UnresolvedGamesBanner count={count} />
    </MemoryRouter>,
  );
}

describe('UnresolvedGamesBanner', () => {
  it('renders nothing when count is 0', () => {
    const { container } = renderBanner(0);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the banner when count is greater than 0', () => {
    renderBanner(3);

    expect(screen.getByText(/3 games couldn't be synced automatically/i)).toBeInTheDocument();
  });

  it('uses singular "game" when count is 1', () => {
    renderBanner(1);

    expect(screen.getByText(/1 game couldn't be synced automatically/i)).toBeInTheDocument();
  });

  it('renders a Review link pointing to the unmapped games route', () => {
    renderBanner(2);

    const link = screen.getByRole('link', { name: /review/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/unmapped-games');
  });
});
