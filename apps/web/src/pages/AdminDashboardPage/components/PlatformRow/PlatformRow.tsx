import { CheckIcon, CircleXIcon, EyeIcon, EyeOffIcon, PencilIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { TableCell, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';

interface IPlatformToken {
  platformName: string;
  exists: boolean;
  token: string;
  tokenUpdateDate: Date;
  tokenValidityFrame: number;
  isLoading: boolean;
  onPlatformRowUpdate: (newToken: string, newValidityFrame: number) => void;
}

function PlatformRow({ platformName, exists, token, tokenUpdateDate, isLoading, tokenValidityFrame, onPlatformRowUpdate }: IPlatformToken) {
  const [isTokenHidden, setIsTokenHidden] = useState(true);
  const [isEditModeEnabled, setIsEditModeEnabled] = useState(!exists);
  const [tempToken, setTempToken] = useState(token);
  const [tempValidityFrame, setTempValidityFrame] = useState(tokenValidityFrame);

  const { expiryDate, today, tokenCreationDate, daysLeft } = useMemo(() => {
    const tokenCreationDate = new Date(tokenUpdateDate);
    const today = new Date();
    const expiryDate = new Date(tokenCreationDate);
    expiryDate.setDate(expiryDate.getDate() + tokenValidityFrame);

    // Difference in milliseconds
    const diffTime = Math.abs(expiryDate.getTime() - today.getTime());
    const daysLeft = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return {
      expiryDate,
      today,
      tokenCreationDate,
      daysLeft,
    };
  }, [tokenUpdateDate, tokenValidityFrame]);

  function handleEditModeToggle() {
    setIsEditModeEnabled((prevState) => !prevState);
  }

  function handleTokenVisibilityToggle() {
    setIsTokenHidden((prevState) => !prevState);
  }

  function handleTokenUpdate(e: React.ChangeEvent<HTMLInputElement>) {
    setTempToken(e.target.value.trim());
  }

  function handleTokenValidityFrameUpdate(e: React.ChangeEvent<HTMLInputElement>) {
    const trimmedStringValue = e.target.value.trim();
    const newFrameValue = parseInt(trimmedStringValue, 10);
    if (isNaN(newFrameValue)) {
      toast({ title: 'Validity frame must be a number', variant: 'destructive' });
    }
    setTempValidityFrame(newFrameValue);
  }

  function handleUpdateCancellation() {
    handleEditModeToggle();
    setTempToken(token);
    setTempValidityFrame(tokenValidityFrame);
  }

  function handleUpdateConfirmation() {
    if (!tempToken) {
      toast({ title: 'Token cannot be empty', variant: 'destructive' });
      return;
    }
    onPlatformRowUpdate(tempToken, tempValidityFrame);
  }

  return (
    <TableRow>
      <TableCell>{platformName}</TableCell>
      <TableCell>{exists ? (expiryDate > today ? '✅' : '❌') : '—'}</TableCell>
      <TableCell>{exists ? `${daysLeft} Days` : '—'}</TableCell>
      <TableCell>{renderToken()}</TableCell>
      <TableCell>{exists ? tokenCreationDate.toDateString() : '—'}</TableCell>
      <TableCell>{renderTokenValidityFrame()}</TableCell>
      <TableCell>{renderEditModeToggle()}</TableCell>
    </TableRow>
  );

  function renderToken() {
    if (isLoading) {
      return <Skeleton className='h-4 w-32 rounded' />;
    }
    return (
      <div className='flex center min-w-[300px] gap-2'>
        <Input
          type={isTokenHidden ? 'password' : 'text'}
          autoComplete='off'
          min={1}
          placeholder='1'
          value={isEditModeEnabled ? tempToken : token}
          onChange={handleTokenUpdate}
          disabled={!isEditModeEnabled}
          className='font-sans text-xs'
        />
        <Button variant='ghost' size='icon' className='text-grimoire-muted hover:text-grimoire-status-dropped-text'>
          {isTokenHidden ? <EyeIcon onClick={handleTokenVisibilityToggle} /> : <EyeOffIcon onClick={handleTokenVisibilityToggle} />}
        </Button>
      </div>
    );
  }

  function renderTokenValidityFrame() {
    if (isLoading) {
      return <Skeleton className='h-4 w-32 rounded' />;
    }

    return (
      <div className='flex center justify-center gap-2'>
        <Input
          type='number'
          min={1}
          placeholder='1'
          value={isEditModeEnabled ? tempValidityFrame : tokenValidityFrame}
          onChange={handleTokenValidityFrameUpdate}
          disabled={!isEditModeEnabled}
          className='w-20 font-sans text-xs'
        />
        <span className='flex items-center'>Days</span>
      </div>
    );
  }

  function renderEditModeToggle() {
    if (isEditModeEnabled) {
      return (
        <div>
          {exists && (
            <Button
              variant='ghost'
              size='icon'
              className='text-grimoire-muted hover:text-grimoire-status-dropped-text'
              onClick={handleUpdateCancellation}
            >
              <CircleXIcon />
            </Button>
          )}{' '}
          <Button
            variant='ghost'
            size='icon'
            className='text-grimoire-muted hover:text-grimoire-status-dropped-text'
            onClick={handleUpdateConfirmation}
          >
            <CheckIcon />
          </Button>
        </div>
      );
    }

    return (
      <Button variant='ghost' size='icon' className='text-grimoire-muted hover:text-grimoire-status-dropped-text'>
        <PencilIcon onClick={handleEditModeToggle} />
      </Button>
    );
  }
}
export default PlatformRow;
