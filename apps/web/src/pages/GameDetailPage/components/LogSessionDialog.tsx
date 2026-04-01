import { MOODS } from '@grimoire/shared';
import { useState } from 'react';

import { useCreateSessionMutation } from '@/api/sessionsApi';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/utils/cn';

interface ILogSessionDialog {
  open: boolean;
  gameId: string;
  onOpenChange: (open: boolean) => void;
}

function LogSessionDialog({ open, gameId, onOpenChange }: ILogSessionDialog) {
  const [durationMin, setDurationMin] = useState('');
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const [createSession, { isLoading }] = useCreateSessionMutation();

  function handleMoodToggle(mood: string) {
    setSelectedMoods((prev) => (prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]));
  }

  async function handleSubmit() {
    try {
      await createSession({
        gameId,
        startedAt: new Date(),
        durationMin: durationMin ? parseInt(durationMin, 10) : undefined,
        mood: selectedMoods,
        notes: notes || undefined,
      }).unwrap();
      toast({ title: 'Session logged' });
      handleClose();
    } catch {
      toast({ title: 'Failed to log session', variant: 'destructive' });
    }
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
          <div className='flex flex-col gap-1.5'>
            <label className='font-sans text-xs text-grimoire-muted'>Duration (minutes)</label>
            <Input type='number' min='1' value={durationMin} onChange={(e) => setDurationMin(e.target.value)} placeholder='e.g. 90' />
          </div>

          <div className='flex flex-col gap-1.5'>
            <label className='font-sans text-xs text-grimoire-muted'>Mood (optional)</label>
            <div className='flex flex-wrap gap-1.5'>
              {MOODS.map((mood) => (
                <button
                  key={mood}
                  onClick={() => handleMoodToggle(mood)}
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

          <div className='flex flex-col gap-1.5'>
            <label className='font-sans text-xs text-grimoire-muted'>Notes (optional)</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder='How did it go?' rows={3} />
          </div>
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
}

export default LogSessionDialog;
