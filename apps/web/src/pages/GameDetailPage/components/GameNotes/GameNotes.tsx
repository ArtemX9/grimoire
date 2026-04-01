import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface IGameNotes {
  notes?: string;
  isSaving: boolean;
  onSave: (notes: string) => void;
}

function GameNotes({ notes, isSaving, onSave }: IGameNotes) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');

  function handleStartEdit() {
    setValue(notes ?? '');
    setEditing(true);
  }

  function handleSave() {
    onSave(value);
    setEditing(false);
  }

  function handleCancel() {
    setEditing(false);
  }

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center justify-between'>
        <h2 className='font-sans text-xs font-medium uppercase tracking-wide text-grimoire-muted'>Notes</h2>
        {!editing && (
          <button onClick={handleStartEdit} className='font-sans text-xs text-grimoire-muted transition-colors hover:text-grimoire-ink'>
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className='flex flex-col gap-2'>
          <Textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder='Your thoughts on this game…' rows={5} autoFocus />
          <div className='flex justify-end gap-2'>
            <Button variant='ghost' size='sm' onClick={handleCancel}>
              Cancel
            </Button>
            <Button size='sm' onClick={handleSave} disabled={isSaving}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div onClick={handleStartEdit} className='min-h-[80px] cursor-text rounded border border-grimoire-border bg-grimoire-input p-3'>
          {notes ? (
            <p className='font-grimoire text-sm leading-relaxed text-grimoire-ink'>{notes}</p>
          ) : (
            <p className='font-sans text-sm text-grimoire-faint'>Click to add notes…</p>
          )}
        </div>
      )}
    </div>
  );
}

export default GameNotes;
