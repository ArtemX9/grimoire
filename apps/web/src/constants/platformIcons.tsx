import { Platform } from '@grimoire/shared';

const PLATFORM_ICONS: Record<Platform, JSX.Element> = {
  [Platform.STEAM]: (
    <svg className='h-3.5 w-3.5' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
      <path d='M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38l3.07-6.3a3.5 3.5 0 0 1-.27-.08 3.5 3.5 0 1 1 4.5-3.35l-6.18 2.95C9.97 19.48 10.97 20 12 20c4.42 0 8-3.58 8-8s-3.58-8-8-8z' />
    </svg>
  ),
  [Platform.PlayStation]: (
    <svg className='h-3.5 w-3.5' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
      <path d='M9 3v13.7l3 1.05V6.28c0-.57.26-.85.67-.71.52.17.78.74.78 1.31v9.86l2.95 1.02V8.45c0-2.27-1.47-4.7-3.73-5.37C10.58 2.5 9 2.7 9 3zm-5 15.25L7.42 20 9 19.4V18l-3.42 1.2L4 18.65v.6zm16-5.5c0 1.7-1.35 3.04-3.05 3.58L13 17.7V19l5.62-1.97C20.6 16.24 22 14.45 22 12.48c0-2.23-2.13-3.6-4.38-2.83l-1.24.43v1.35l1.6-.56c1.17-.4 2 .22 2 1.88z' />
    </svg>
  ),
  [Platform.Xbox]: (
    <svg className='h-3.5 w-3.5' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
      <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.41 14.41L6 11.83l1.41-1.41 3.18 3.17 6.59-6.59L18.59 8.41l-8 8z' />
      <path d='M5.5 5.5c1.7-1.5 4.1-1.5 6.5 0 2.4-1.5 4.8-1.5 6.5 0 1.5 2 1.5 11-6.5 13C4 16.5 4 7.5 5.5 5.5z' />
    </svg>
  ),
  [Platform.PC]: (
    <svg className='h-3.5 w-3.5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
      <rect x='2' y='3' width='20' height='14' rx='2' />
      <path d='M8 21h8M12 17v4' />
    </svg>
  ),
};

export default PLATFORM_ICONS;
