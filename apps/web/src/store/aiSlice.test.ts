import { Mood } from '@grimoire/shared';
import { describe, expect, it } from 'vitest';

import reducer, { appendToken, setSessionLength, startStreaming, stopStreaming, toggleMood } from '@/store/aiSlice';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const initialState = reducer(undefined, { type: '@@INIT' });

const DARK = Mood.DARK_AND_TENSE;
const CHILL = Mood.CHILL;
const INTENSE = Mood.INTENSE;

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
    state = reducer(state, toggleMood(INTENSE));

    expect(state.selectedMoods).toHaveLength(3);
    expect(state.selectedMoods).toEqual(expect.arrayContaining([DARK, CHILL, INTENSE]));
  });

  it('removes only the targeted mood, leaving others intact', () => {
    let state = initialState;
    state = reducer(state, toggleMood(DARK));
    state = reducer(state, toggleMood(CHILL));
    state = reducer(state, toggleMood(DARK));

    expect(state.selectedMoods).toHaveLength(1);
    expect(state.selectedMoods).toContain(CHILL);
    expect(state.selectedMoods).not.toContain(DARK);
  });

  it('toggle on then off results in an empty array', () => {
    const on = reducer(initialState, toggleMood(CHILL));
    const off = reducer(on, toggleMood(CHILL));
    expect(off.selectedMoods).toEqual([]);
  });

  it('does not affect sessionLengthMinutes, streamedTokens, or isStreaming', () => {
    const preset = reducer(reducer(initialState, setSessionLength(60)), startStreaming());
    const next = reducer(preset, toggleMood(INTENSE));

    expect(next.sessionLengthMinutes).toBe(60);
    expect(next.isStreaming).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// setSessionLength
// ---------------------------------------------------------------------------

describe('aiSlice — setSessionLength', () => {
  it('sets session length to 60 minutes', () => {
    const next = reducer(initialState, setSessionLength(60));
    expect(next.sessionLengthMinutes).toBe(60);
  });

  it('sets session length to 240 minutes', () => {
    const next = reducer(initialState, setSessionLength(240));
    expect(next.sessionLengthMinutes).toBe(240);
  });

  it('overwrites the previous value', () => {
    const first = reducer(initialState, setSessionLength(60));
    const next = reducer(first, setSessionLength(180));
    expect(next.sessionLengthMinutes).toBe(180);
  });

  it('accepts 0 (boundary — zero-length session)', () => {
    const next = reducer(initialState, setSessionLength(0));
    expect(next.sessionLengthMinutes).toBe(0);
  });

  it('accepts very large values (no upper bound enforced by reducer)', () => {
    const next = reducer(initialState, setSessionLength(9999));
    expect(next.sessionLengthMinutes).toBe(9999);
  });

  it('does not affect selectedMoods or streaming state', () => {
    const withMood = reducer(initialState, toggleMood(DARK));
    const streaming = reducer(withMood, startStreaming());
    const next = reducer(streaming, setSessionLength(30));

    expect(next.selectedMoods).toContain(DARK);
    expect(next.isStreaming).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// startStreaming
// ---------------------------------------------------------------------------

describe('aiSlice — startStreaming', () => {
  it('sets isStreaming to true', () => {
    const next = reducer(initialState, startStreaming());
    expect(next.isStreaming).toBe(true);
  });

  it('clears any previously accumulated tokens', () => {
    const withTokens = reducer(reducer(initialState, startStreaming()), appendToken('hello '));
    const next = reducer(withTokens, startStreaming());

    expect(next.streamedTokens).toBe('');
  });

  it('is idempotent — calling twice stays streaming with empty tokens', () => {
    const first = reducer(initialState, startStreaming());
    const withToken = reducer(first, appendToken('partial'));
    const second = reducer(withToken, startStreaming());

    expect(second.isStreaming).toBe(true);
    expect(second.streamedTokens).toBe('');
  });

  it('does not affect selectedMoods or sessionLengthMinutes', () => {
    const withMood = reducer(initialState, toggleMood(CHILL));
    const withLength = reducer(withMood, setSessionLength(60));
    const next = reducer(withLength, startStreaming());

    expect(next.selectedMoods).toContain(CHILL);
    expect(next.sessionLengthMinutes).toBe(60);
  });
});

// ---------------------------------------------------------------------------
// stopStreaming
// ---------------------------------------------------------------------------

describe('aiSlice — stopStreaming', () => {
  it('sets isStreaming to false', () => {
    const streaming = reducer(initialState, startStreaming());
    const next = reducer(streaming, stopStreaming());
    expect(next.isStreaming).toBe(false);
  });

  it('preserves accumulated tokens after stopping', () => {
    let state = initialState;
    state = reducer(state, startStreaming());
    state = reducer(state, appendToken('The grimoire '));
    state = reducer(state, appendToken('speaks.'));
    state = reducer(state, stopStreaming());

    expect(state.streamedTokens).toBe('The grimoire speaks.');
    expect(state.isStreaming).toBe(false);
  });

  it('is safe to call when not streaming (idempotent for false)', () => {
    const next = reducer(initialState, stopStreaming());
    expect(next.isStreaming).toBe(false);
  });

  it('does not affect selectedMoods or sessionLengthMinutes', () => {
    const withMood = reducer(initialState, toggleMood(INTENSE));
    const withLength = reducer(withMood, setSessionLength(240));
    const streaming = reducer(withLength, startStreaming());
    const next = reducer(streaming, stopStreaming());

    expect(next.selectedMoods).toContain(INTENSE);
    expect(next.sessionLengthMinutes).toBe(240);
  });
});

// ---------------------------------------------------------------------------
// appendToken
// ---------------------------------------------------------------------------

describe('aiSlice — appendToken', () => {
  it('appends a token to empty streamedTokens', () => {
    const next = reducer(initialState, appendToken('Once'));
    expect(next.streamedTokens).toBe('Once');
  });

  it('concatenates successive tokens in order', () => {
    let state = initialState;
    state = reducer(state, appendToken('The '));
    state = reducer(state, appendToken('dark '));
    state = reducer(state, appendToken('calls.'));

    expect(state.streamedTokens).toBe('The dark calls.');
  });

  it('handles an empty-string token without error', () => {
    const withText = reducer(initialState, appendToken('hello'));
    const next = reducer(withText, appendToken(''));
    expect(next.streamedTokens).toBe('hello');
  });

  it('handles whitespace-only tokens', () => {
    let state = initialState;
    state = reducer(state, appendToken('word'));
    state = reducer(state, appendToken('  '));
    state = reducer(state, appendToken('end'));

    expect(state.streamedTokens).toBe('word  end');
  });

  it('appending after startStreaming starts from blank', () => {
    let state = initialState;
    state = reducer(state, appendToken('old text'));
    state = reducer(state, startStreaming());
    state = reducer(state, appendToken('fresh'));

    expect(state.streamedTokens).toBe('fresh');
  });

  it('does not affect selectedMoods, sessionLengthMinutes, or isStreaming', () => {
    const preset = reducer(reducer(reducer(initialState, toggleMood(DARK)), setSessionLength(60)), startStreaming());
    const next = reducer(preset, appendToken('token'));

    expect(next.selectedMoods).toContain(DARK);
    expect(next.sessionLengthMinutes).toBe(60);
    expect(next.isStreaming).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Full streaming lifecycle
// ---------------------------------------------------------------------------

describe('aiSlice — full streaming lifecycle', () => {
  it('start → append × n → stop produces correct final state', () => {
    const tokens = ['In the', ' depths of', ' the grimoire,', ' your path', ' awaits.'];

    let state = reducer(initialState, startStreaming());
    for (const token of tokens) {
      state = reducer(state, appendToken(token));
    }
    state = reducer(state, stopStreaming());

    expect(state.isStreaming).toBe(false);
    expect(state.streamedTokens).toBe('In the depths of the grimoire, your path awaits.');
  });

  it('second stream run overwrites the first run tokens', () => {
    let state = initialState;

    state = reducer(state, startStreaming());
    state = reducer(state, appendToken('first run'));
    state = reducer(state, stopStreaming());

    state = reducer(state, startStreaming());
    state = reducer(state, appendToken('second run'));
    state = reducer(state, stopStreaming());

    expect(state.streamedTokens).toBe('second run');
  });
});
