import { Mood, PLATFORM_LABELS, Platform } from '@grimoire/shared';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

import PlatformIcon from '@/components/PlatformIcon/PlatformIcon';
import { Collapsible, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/utils/cn';

const SESSION_OPTIONS = [60, 120, 240, 480, 720] as const;

interface IAiPanel {
  selectedMoods: string[];
  sessionLengthMinutes: number;
  streamedTokens: string;
  streamedThoughts: string;
  isStreaming: boolean;
  aiEnabled: boolean;
  availablePlatforms: Platform[];
  selectedPlatform: Platform | undefined;
  hideHeader?: boolean;
  onMoodToggle: (mood: string) => void;
  onSessionLengthChange: (minutes: number) => void;
  onPlatformChange: (platform: Platform | undefined) => void;
  onRequest: () => void;
}

function AiPanel({
  selectedMoods,
  sessionLengthMinutes,
  streamedTokens,
  streamedThoughts,
  isStreaming,
  aiEnabled,
  availablePlatforms,
  selectedPlatform,
  hideHeader = false,
  onMoodToggle,
  onSessionLengthChange,
  onPlatformChange,
  onRequest,
}: IAiPanel) {
  const thoughtsRef = useRef<HTMLDivElement>(null);

  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);

  const showPlatformPicker = availablePlatforms.length > 1;

  useEffect(
    function scrollThoughtsToBottom() {
      if (!thoughtsRef.current) return;
      thoughtsRef.current.scrollTop = thoughtsRef.current.scrollHeight;
    },
    [streamedThoughts],
  );

  useEffect(
    function collapseThinkingOnNewRequest() {
      if (isStreaming) {
        setIsThinkingExpanded(false);
      }
    },
    [isStreaming],
  );

  return (
    <aside className='flex flex-col gap-4 lg:border-l border-grimoire-border bg-grimoire-card p-4 w-full'>
      {!hideHeader && renderHeader()}
      {renderMoods()}
      {renderSessionLength()}
      {showPlatformPicker && renderPlatformPicker()}
      {renderThinking()}
      {renderRecommendation()}
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
              onClick={onMoodToggle.bind(null, mood)}
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
              onClick={onSessionLengthChange.bind(null, min)}
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

  function renderPlatformPicker() {
    return (
      <div className={cn('flex flex-col gap-2', !aiEnabled && 'opacity-40')}>
        <p className='font-sans text-xs text-grimoire-muted'>Platform</p>
        <div className='flex flex-wrap gap-1.5'>
          <button
            key='any'
            onClick={onPlatformChange.bind(null, undefined)}
            disabled={!aiEnabled}
            className={cn(
              'rounded-full border px-2.5 py-1 font-sans text-xs transition-colors',
              selectedPlatform === undefined
                ? 'border-grimoire-gold bg-grimoire-gold/10 text-grimoire-gold'
                : 'border-grimoire-border text-grimoire-muted hover:border-grimoire-border-lg hover:text-grimoire-ink',
              !aiEnabled && 'cursor-not-allowed',
            )}
          >
            Any
          </button>
          {availablePlatforms.map((platform) => (
            <button
              key={platform}
              onClick={onPlatformChange.bind(null, platform)}
              disabled={!aiEnabled}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-sans text-xs transition-colors',
                selectedPlatform === platform
                  ? 'border-grimoire-gold bg-grimoire-gold/10 text-grimoire-gold'
                  : 'border-grimoire-border text-grimoire-muted hover:border-grimoire-border-lg hover:text-grimoire-ink',
                !aiEnabled && 'cursor-not-allowed',
              )}
            >
              <PlatformIcon platform={platform} />
              {PLATFORM_LABELS[platform]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderThinking() {
    if (!streamedThoughts) return null;

    return (
      <Collapsible open={isThinkingExpanded} onOpenChange={setIsThinkingExpanded}>
        <div className='rounded border border-grimoire-border bg-grimoire-deep p-3'>
          {renderThinkingHeader()}
          {renderThinkingBody()}
        </div>
      </Collapsible>
    );
  }

  function renderThinkingHeader() {
    return (
      <div className='mb-1.5 flex items-center justify-between'>
        <p className='font-sans text-xs text-grimoire-faint'>Reasoning…</p>
        <CollapsibleTrigger asChild>
          <button className='flex items-center gap-0.5 font-sans text-xs text-grimoire-faint transition-colors hover:text-grimoire-muted'>
            {isThinkingExpanded ? (
              <>
                <span>Show less</span>
                <ChevronUp className='h-3 w-3' />
              </>
            ) : (
              <>
                <span>Show more</span>
                <ChevronDown className='h-3 w-3' />
              </>
            )}
          </button>
        </CollapsibleTrigger>
      </div>
    );
  }

  function renderThinkingBody() {
    return (
      <>
        <div ref={thoughtsRef} className={cn('overflow-y-auto', isThinkingExpanded ? 'max-h-48' : 'h-20')}>
          <p className='font-sans text-xs italic leading-relaxed text-grimoire-muted'>{streamedThoughts}</p>
        </div>
      </>
    );
  }

  function renderRecommendation() {
    if (!streamedTokens && !isStreaming) {
      return (
        <div className='rounded border border-grimoire-border bg-grimoire-deep p-3'>
          <p className='font-sans text-xs text-grimoire-faint text-center leading-relaxed'>Select moods and ask for a recommendation</p>
        </div>
      );
    }

    return (
      <div className='rounded border border-grimoire-border bg-grimoire-deep p-3'>
        <div
          className={cn(
            'font-grimoire text-sm leading-relaxed text-grimoire-ink',
            '[&_h1]:font-grimoire [&_h1]:text-base [&_h1]:font-normal [&_h1]:text-grimoire-ink [&_h1]:mb-1',
            '[&_h2]:font-grimoire [&_h2]:text-sm [&_h2]:font-normal [&_h2]:text-grimoire-ink [&_h2]:mb-1',
            '[&_h3]:font-grimoire [&_h3]:text-sm [&_h3]:font-normal [&_h3]:text-grimoire-ink [&_h3]:mb-1',
            '[&_p]:mb-2 [&_p:last-child]:mb-0',
            '[&_ul]:mb-2 [&_ul]:pl-4 [&_ul]:list-disc [&_ul:last-child]:mb-0',
            '[&_ol]:mb-2 [&_ol]:pl-4 [&_ol]:list-decimal [&_ol:last-child]:mb-0',
            '[&_li]:mb-0.5',
            '[&_strong]:text-grimoire-ink [&_strong]:font-semibold',
            '[&_em]:text-grimoire-muted [&_em]:italic',
            '[&_code]:font-mono [&_code]:text-xs [&_code]:text-grimoire-muted [&_code]:bg-grimoire-hover [&_code]:px-1 [&_code]:rounded',
          )}
        >
          <ReactMarkdown>{streamedTokens}</ReactMarkdown>
          {isStreaming && <span className='inline-block h-4 w-px animate-pulse bg-grimoire-gold ml-0.5 align-middle' />}
        </div>
      </div>
    );
  }

  function renderButton() {
    return (
      <div className='sticky bottom-0 bg-grimoire-card pt-2 flex flex-col gap-2'>
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
