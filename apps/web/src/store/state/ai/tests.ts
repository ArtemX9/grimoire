import { Mood } from '@grimoire/shared';
import { describe, expect, it } from 'vitest';

import reducer, {
  AI_SLICE,
  AiState,
  appendToken,
  setSessionLength,
  startStreaming,
  stopStreaming,
  toggleMood,
} from '@/store/state/ai/index';
import { selectCanStream, selectIsStreaming, selectSelectedMoods } from '@/store/state/ai/selectors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const initialState = reducer(undefined, { type: '@@INIT' } as never);

const DARK = Mood.DARK_AND_TENSE;
const CHILL = Mood.CHILL;

function makeRootState(overrides: Partial<AiState> = {}) {
  return { [AI_SLICE]: { ...initialState, ...overrides } };
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('aiSlice — initial state', () => {
  it('has no selected moods', () => {
    expect(initialState.selectedMoods).toEqual([]);
  });

  it('defaults to 120-minute sessions', () => {
    expect(initialState.sessionLengthMinutes).toBe(120);
  });

  it('has empty streamed tokens', () => {
    expect(initialState.streamedTokens).toBe('');
  });

  it('is not streaming', () => {
    expect(initialState.isStreaming).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// toggleMood
// ---------------------------------------------------------------------------

describe('aiSlice — toggleMood', () => {
  it('adds a mood that is not yet selected', () => {
    const next = reducer(initialState, toggleMood(DARK));
    expect(next.selectedMoods).toContain(DARK);
  });

  it('removes a mood that is already selected (toggle off)', () => {
    const withMood = reducer(initialState, toggleMood(DARK));
    const next = reducer(withMood, toggleMood(DARK));
    expect(next.selectedMoods).not.toContain(DARK);
  });

  it('accumulates multiple distinct moods', () => {
    let state = initialState;
    state = reducer(state, toggleMood(DARK));
    state = reducer(state, toggleMood(CHILL));

    expect(state.selectedMoods).toHaveLength(2);
    expect(state.selectedMoods).toEqual(expect.arrayContaining([DARK, CHILL]));
  });
});

// ---------------------------------------------------------------------------
// Streaming lifecycle
// ---------------------------------------------------------------------------

describe('aiSlice — streaming lifecycle', () => {
  it('startStreaming clears tokens and sets isStreaming', () => {
    const withTokens = reducer(reducer(initialState, startStreaming()), appendToken('old'));
    const next = reducer(withTokens, startStreaming());

    expect(next.isStreaming).toBe(true);
    expect(next.streamedTokens).toBe('');
  });

  it('stopStreaming preserves tokens and sets isStreaming to false', () => {
    let state = initialState;
    state = reducer(state, startStreaming());
    state = reducer(state, appendToken('The grimoire speaks.'));
    state = reducer(state, stopStreaming());

    expect(state.isStreaming).toBe(false);
    expect(state.streamedTokens).toBe('The grimoire speaks.');
  });

  it('appendToken concatenates successive tokens', () => {
    let state = initialState;
    state = reducer(state, appendToken('hello '));
    state = reducer(state, appendToken('world'));
    expect(state.streamedTokens).toBe('hello world');
  });
});

// ---------------------------------------------------------------------------
// setSessionLength
// ---------------------------------------------------------------------------

describe('aiSlice — setSessionLength', () => {
  it('sets session length', () => {
    const next = reducer(initialState, setSessionLength(60));
    expect(next.sessionLengthMinutes).toBe(60);
  });

  it('overwrites the previous value', () => {
    const first = reducer(initialState, setSessionLength(60));
    const next = reducer(first, setSessionLength(180));
    expect(next.sessionLengthMinutes).toBe(180);
  });
});

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

describe('selectCanStream', () => {
  it('returns false when no moods selected', () => {
    const state = makeRootState({ selectedMoods: [], isStreaming: false });
    expect(selectCanStream(state as never)).toBe(false);
  });

  it('returns true when moods selected and not streaming', () => {
    const state = makeRootState({ selectedMoods: [DARK], isStreaming: false });
    expect(selectCanStream(state as never)).toBe(true);
  });

  it('returns false when streaming even if moods selected', () => {
    const state = makeRootState({ selectedMoods: [DARK], isStreaming: true });
    expect(selectCanStream(state as never)).toBe(false);
  });
});

describe('selectSelectedMoods', () => {
  it('returns selectedMoods from state', () => {
    const state = makeRootState({ selectedMoods: [CHILL] });
    expect(selectSelectedMoods(state as never)).toEqual([CHILL]);
  });
});

describe('selectIsStreaming', () => {
  it('returns isStreaming from state', () => {
    const state = makeRootState({ isStreaming: true });
    expect(selectIsStreaming(state as never)).toBe(true);
  });
});
