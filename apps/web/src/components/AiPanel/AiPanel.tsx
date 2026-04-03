import { Mood } from '@grimoire/shared';
import { Sparkles } from 'lucide-react';

import { cn } from '@/utils/cn';

const SESSION_OPTIONS = [60, 120, 240] as const;

interface IAiPanel {
  selectedMoods: string[];
  sessionLengthMinutes: number;
  streamedTokens: string;
  isStreaming: boolean;
  aiEnabled: boolean;
  onMoodToggle: (mood: string) => void;
  onSessionLengthChange: (minutes: number) => void;
  onRequest: () => void;
}

function AiPanel({
  selectedMoods,
  sessionLengthMinutes,
  streamedTokens,
  isStreaming,
  aiEnabled,
  onMoodToggle,
  onSessionLengthChange,
  onRequest,
}: IAiPanel) {
  return (
    <aside className='flex flex-col gap-4 border-l border-grimoire-border bg-grimoire-card p-4 w-full'>
      {renderHeader()}
      {renderMoods()}
      {renderSessionLength()}
      {streamedTokens && renderRecommendation()}
      {renderButton()}
    </aside>
  );

  function renderHeader() {
    return (
      <div className='flex items-center justify-between'>
        <span className='font-grimoire text-sm text-grimoire-ink'>Tonight&apos;s pick</span>
        <span className='flex items-center gap-1 rounded-full border border-grimoire-gold-dim bg-grimoire-gold/10 px-2 py-0.5 font-sans text-xs text-grimoire-gold'>
          <Sparkles className='h-3 w-3' />
          AI
        </span>
      </div>
    );
  }

  function renderMoods() {
    return (
      <div className={cn('flex flex-col gap-2', !aiEnabled && 'opacity-40')}>
        <p className='font-sans text-xs text-grimoire-muted'>How are you feeling?</p>
        <div className='flex flex-wrap gap-1.5'>
          {Object.values(Mood).map((mood) => (
            <button
              key={mood}
              onClick={() => onMoodToggle(mood)}
              disabled={!aiEnabled}
              className={cn(
                'rounded-full border px-2.5 py-1 font-sans text-xs transition-colors',
                selectedMoods.includes(mood)
                  ? 'border-grimoire-gold bg-grimoire-gold/10 text-grimoire-gold'
                  : 'border-grimoire-border text-grimoire-muted hover:border-grimoire-border-lg hover:text-grimoire-ink',
                !aiEnabled && 'cursor-not-allowed',
              )}
            >
              {mood}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderSessionLength() {
    return (
      <div className={cn('flex flex-col gap-2', !aiEnabled && 'opacity-40')}>
        <p className='font-sans text-xs text-grimoire-muted'>Session length</p>
        <div className='flex gap-1.5'>
          {SESSION_OPTIONS.map((min) => (
            <button
              key={min}
              onClick={() => onSessionLengthChange(min)}
              disabled={!aiEnabled}
              className={cn(
                'flex-1 rounded border py-1.5 font-sans text-xs transition-colors',
                sessionLengthMinutes === min
                  ? 'border-grimoire-gold bg-grimoire-gold/10 text-grimoire-gold'
                  : 'border-grimoire-border text-grimoire-muted hover:border-grimoire-border-lg hover:text-grimoire-ink',
                !aiEnabled && 'cursor-not-allowed',
              )}
            >
              {min < 60 ? `${min}m` : `${min / 60}h`}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderRecommendation() {
    return (
      <div className='rounded border border-grimoire-border bg-grimoire-deep p-3'>
        <p className='font-grimoire text-sm leading-relaxed text-grimoire-ink'>
          {streamedTokens}
          {isStreaming && <span className='ml-0.5 inline-block h-4 w-px animate-pulse bg-grimoire-gold' />}
        </p>
      </div>
    );
  }

  function renderButton() {
    return (
      <div className='flex flex-col gap-2'>
        {!aiEnabled && (
          <p className='font-sans text-xs text-grimoire-muted text-center'>AI features are currently disabled for your account.</p>
        )}
        <button
          onClick={onRequest}
          disabled={!aiEnabled || isStreaming || selectedMoods.length === 0}
          className='w-full rounded bg-grimoire-gold py-2 font-sans text-xs font-medium text-grimoire-deep transition-colors hover:bg-grimoire-gold-bright disabled:cursor-not-allowed disabled:opacity-40'
        >
          {isStreaming ? 'Consulting the grimoire…' : 'Get recommendation'}
        </button>
      </div>
    );
  }
}

export default AiPanel;
