import { GamePlatform } from '@grimoire/shared';

import PlatformIcon from '@/components/PlatformIcon/PlatformIcon';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface IGameDetailPlatformPicker {
  open: boolean;
  platforms: GamePlatform[];
  onOpenChange: (open: boolean) => void;
  onPlatformSelect: (platform: GamePlatform) => void;
}

function GameDetailPlatformPicker({ open, platforms, onOpenChange, onPlatformSelect }: IGameDetailPlatformPicker) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-sm'>
        <DialogHeader>
          <DialogTitle>Which platform entry to remap?</DialogTitle>
        </DialogHeader>
        <p className='font-sans text-sm text-grimoire-muted'>
          This game has multiple platform entries. Select the one you want to remap.
        </p>
        <div className='flex flex-col gap-2 pt-1'>
          {platforms.map((platform) => {
            function handleSelect() {
              onPlatformSelect(platform);
            }
            return (
              <button
                key={platform.platformID}
                onClick={handleSelect}
                className='flex items-center gap-3 rounded border border-grimoire-border bg-grimoire-hover px-4 py-3 text-left transition-colors hover:border-grimoire-border-lg hover:bg-grimoire-card'
              >
                <PlatformIcon platform={platform.platformName} className='h-4 w-4 shrink-0 text-grimoire-muted' />
                <div className='flex min-w-0 flex-col gap-0.5'>
                  <span className='font-sans text-xs font-medium text-grimoire-ink'>{platform.platformName}</span>
                  <span className='truncate font-sans text-xs text-grimoire-muted'>{platform.externalTitle}</span>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default GameDetailPlatformPicker;
