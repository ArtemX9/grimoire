import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface IGameDetailDeleteDialog {
  open: boolean;
  gameTitle: string;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
}

function GameDetailDeleteDialog({ open, gameTitle, isDeleting, onOpenChange, onDelete }: IGameDetailDeleteDialog) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-sm'>
        <DialogHeader>
          <DialogTitle>Remove from library?</DialogTitle>
        </DialogHeader>
        <p className='font-sans text-sm text-grimoire-muted'>
          This will permanently remove <span className='text-grimoire-ink'>{gameTitle}</span> and all its sessions.
        </p>
        <DialogFooter>
          <Button variant='ghost' size='sm' onClick={onOpenChange.bind(null, false)}>
            Cancel
          </Button>
          <Button variant='destructive' size='sm' onClick={onDelete} disabled={isDeleting}>
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default GameDetailDeleteDialog;
