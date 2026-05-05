import { Platform } from '@grimoire/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import AiPanel from '@/components/AiPanel/AiPanel';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface PanelProps {
  selectedMoods: string[];
  sessionLengthMinutes: number;
  streamedTokens: string;
  isStreaming: boolean;
  aiEnabled: boolean;
  availablePlatforms: Platform[];
  selectedPlatform: Platform | undefined;
  onMoodToggle: (mood: string) => void;
  onSessionLengthChange: (minutes: number) => void;
  onPlatformChange: (platform: Platform | undefined) => void;
  onRequest: () => void;
}

const defaultProps: PanelProps = {
  selectedMoods: [],
  sessionLengthMinutes: 60,
  streamedTokens: '',
  isStreaming: false,
  aiEnabled: true,
  availablePlatforms: [],
  selectedPlatform: undefined,
  onMoodToggle: vi.fn(),
  onSessionLengthChange: vi.fn(),
  onPlatformChange: vi.fn(),
  onRequest: vi.fn(),
};

function renderPanel(overrides: Partial<PanelProps> = {}) {
  return render(<AiPanel {...defaultProps} {...overrides} />);
}

// ---------------------------------------------------------------------------
// Tests — aiEnabled=false
// ---------------------------------------------------------------------------

describe('AiPanel — aiEnabled=false', () => {
  it('shows the AI-disabled notice', () => {
    renderPanel({ aiEnabled: false });

    expect(screen.getByText(/ai features are currently disabled/i)).toBeInTheDocument();
  });

  it('disables all mood buttons', () => {
    renderPanel({ aiEnabled: false });

    const moodButtons = screen.getAllByRole('button').filter((btn) => btn !== screen.getByRole('button', { name: /get recommendation/i }));

    moodButtons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it('disables all session-length buttons', () => {
    renderPanel({ aiEnabled: false });

    expect(screen.getByRole('button', { name: '1h' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '2h' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '4h' })).toBeDisabled();
  });

  it('disables the get-recommendation button', () => {
    renderPanel({ aiEnabled: false, selectedMoods: ['Chill'] });

    expect(screen.getByRole('button', { name: /get recommendation/i })).toBeDisabled();
  });

  it('does not call onRequest when the button is clicked while disabled', async () => {
    const onRequest = vi.fn();
    renderPanel({ aiEnabled: false, selectedMoods: ['Chill'], onRequest });

    await userEvent.click(screen.getByRole('button', { name: /get recommendation/i }));

    expect(onRequest).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Tests — aiEnabled=true
// ---------------------------------------------------------------------------

describe('AiPanel — aiEnabled=true', () => {
  it('does not show the AI-disabled notice', () => {
    renderPanel({ aiEnabled: true });

    expect(screen.queryByText(/ai features are currently disabled/i)).not.toBeInTheDocument();
  });

  it('disables the get-recommendation button when no moods are selected', () => {
    renderPanel({ aiEnabled: true, selectedMoods: [] });

    expect(screen.getByRole('button', { name: /get recommendation/i })).toBeDisabled();
  });

  it('enables the get-recommendation button when at least one mood is selected', () => {
    renderPanel({ aiEnabled: true, selectedMoods: ['Chill'] });

    expect(screen.getByRole('button', { name: /get recommendation/i })).not.toBeDisabled();
  });

  it('calls onMoodToggle with the correct mood when a mood button is clicked', async () => {
    const onMoodToggle = vi.fn();
    renderPanel({ aiEnabled: true, onMoodToggle });

    await userEvent.click(screen.getByRole('button', { name: 'Chill' }));

    expect(onMoodToggle).toHaveBeenCalledWith('Chill');
  });

  it('calls onSessionLengthChange with the correct minutes when a session button is clicked', async () => {
    const onSessionLengthChange = vi.fn();
    renderPanel({ aiEnabled: true, onSessionLengthChange });

    await userEvent.click(screen.getByRole('button', { name: '2h' }));

    expect(onSessionLengthChange).toHaveBeenCalledWith(120);
  });

  it('calls onRequest when the get-recommendation button is clicked', async () => {
    const onRequest = vi.fn();
    renderPanel({ aiEnabled: true, selectedMoods: ['Chill'], onRequest });

    await userEvent.click(screen.getByRole('button', { name: /get recommendation/i }));

    expect(onRequest).toHaveBeenCalled();
  });

  it('disables the get-recommendation button while streaming', () => {
    renderPanel({ aiEnabled: true, selectedMoods: ['Chill'], isStreaming: true });

    expect(screen.getByRole('button', { name: /consulting the grimoire/i })).toBeDisabled();
  });

  it('renders streamed tokens when provided', () => {
    renderPanel({ aiEnabled: true, streamedTokens: 'Try Dark Souls tonight.' });

    expect(screen.getByText('Try Dark Souls tonight.')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Tests — platform picker
// ---------------------------------------------------------------------------

describe('AiPanel — platform picker', () => {
  it('does not render platform picker when there is only one available platform', () => {
    renderPanel({ availablePlatforms: [Platform.STEAM] });

    expect(screen.queryByText('Any')).not.toBeInTheDocument();
  });

  it('does not render platform picker when there are no available platforms', () => {
    renderPanel({ availablePlatforms: [] });

    expect(screen.queryByText('Any')).not.toBeInTheDocument();
  });

  it('renders platform picker with Any tag when there are multiple platforms', () => {
    renderPanel({ availablePlatforms: [Platform.STEAM, Platform.PC] });

    expect(screen.getByRole('button', { name: 'Any' })).toBeInTheDocument();
  });

  it('renders a button for each available platform', () => {
    renderPanel({ availablePlatforms: [Platform.STEAM, Platform.PC] });

    expect(screen.getByRole('button', { name: /steam/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pc other/i })).toBeInTheDocument();
  });

  it('calls onPlatformChange with undefined when Any is clicked', async () => {
    const onPlatformChange = vi.fn();
    renderPanel({ availablePlatforms: [Platform.STEAM, Platform.PC], onPlatformChange });

    await userEvent.click(screen.getByRole('button', { name: 'Any' }));

    expect(onPlatformChange).toHaveBeenCalledWith(undefined, expect.anything());
  });

  it('calls onPlatformChange with the platform enum value when a platform tag is clicked', async () => {
    const onPlatformChange = vi.fn();
    renderPanel({ availablePlatforms: [Platform.STEAM, Platform.PC], onPlatformChange });

    await userEvent.click(screen.getByRole('button', { name: /steam/i }));

    expect(onPlatformChange).toHaveBeenCalledWith(Platform.STEAM, expect.anything());
  });

  it('highlights the Any tag when selectedPlatform is undefined', () => {
    renderPanel({ availablePlatforms: [Platform.STEAM, Platform.PC], selectedPlatform: undefined });

    const anyButton = screen.getByRole('button', { name: 'Any' });
    expect(anyButton.className).toContain('text-grimoire-gold');
  });

  it('highlights the selected platform tag', () => {
    renderPanel({ availablePlatforms: [Platform.STEAM, Platform.PC], selectedPlatform: Platform.STEAM });

    const steamButton = screen.getByRole('button', { name: /steam/i });
    expect(steamButton.className).toContain('text-grimoire-gold');
  });
});
