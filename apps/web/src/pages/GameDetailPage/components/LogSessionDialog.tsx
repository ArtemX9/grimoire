import { Mood } from '@grimoire/shared';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/utils/cn';

interface ILogSessionDialog {
  open: boolean;
  isLoading: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (durationMin: string, selectedMoods: Mood[], notes: string) => void;
}

function LogSessionDialog({ open, isLoading, onOpenChange, onSubmit }: ILogSessionDialog) {
  const [durationMin, setDurationMin] = useState('');
  const [selectedMoods, setSelectedMoods] = useState<Mood[]>([]);
  const [notes, setNotes] = useState('');

  function handleMoodToggle(mood: Mood) {
    setSelectedMoods((prev) => (prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]));
  }

  function handleSubmit() {
    onSubmit(durationMin, selectedMoods, notes);
  }

  function handleClose() {
    setDurationMin('');
    setSelectedMoods([]);
    setNotes('');
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-w-sm'>
        <DialogHeader>
          <DialogTitle>Log session</DialogTitle>
        </DialogHeader>
        <div className='flex flex-col gap-4'>
          {renderDurationField()}
          {renderMoodField()}
          {renderNotesField()}
        </div>
        <DialogFooter>
          <Button variant='ghost' size='sm' onClick={handleClose}>
            Cancel
          </Button>
          <Button size='sm' onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving…' : 'Log session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  function renderDurationField() {
    return (
      <div className='flex flex-col gap-1.5'>
        <label className='font-sans text-xs text-grimoire-muted'>Duration (minutes)</label>
        <Input type='number' min='1' value={durationMin} onChange={(e) => setDurationMin(e.target.value)} placeholder='e.g. 90' />
      </div>
    );
  }

  function renderMoodField() {
    return (
      <div className='flex flex-col gap-1.5'>
        <label className='font-sans text-xs text-grimoire-muted'>Mood (optional)</label>
        <div className='flex flex-wrap gap-1.5'>
          {Object.values(Mood).map((mood) => (
            <button
              key={mood}
              onClick={handleMoodToggle.bind(null, mood)}
              className={cn(
                'rounded-full border px-2.5 py-1 font-sans text-xs transition-colors',
                selectedMoods.includes(mood)
                  ? 'border-grimoire-gold bg-grimoire-gold/10 text-grimoire-gold'
                  : 'border-grimoire-border text-grimoire-muted hover:border-grimoire-border-lg hover:text-grimoire-ink',
              )}
            >
              {mood}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderNotesField() {
    return (
      <div className='flex flex-col gap-1.5'>
        <label className='font-sans text-xs text-grimoire-muted'>Notes (optional)</label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder='How did it go?' rows={3} />
      </div>
    );
  }
}

export default LogSessionDialog;
