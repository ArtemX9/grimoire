import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as React from 'react';

import { cn } from '@/utils/cn';

/**
 * BottomDrawer — a Radix Dialog variant anchored to the bottom of the screen.
 * Reuses Dialog.Root/Portal/Overlay so a single Radix tree manages open state,
 * backdrop click, and Escape-key dismissal.
 *
 * Re-exports Root, Portal, Overlay, and Close unchanged so callers can import
 * everything from this file.
 */

const BottomDrawer = DialogPrimitive.Root;
const BottomDrawerPortal = DialogPrimitive.Portal;
const BottomDrawerClose = DialogPrimitive.Close;

const BottomDrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/70 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className,
    )}
    {...props}
  />
));
BottomDrawerOverlay.displayName = 'BottomDrawerOverlay';

const BottomDrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Content
    ref={ref}
    className={cn(
      'fixed inset-x-0 bottom-0 z-50 duration-300',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
      className,
    )}
    {...props}
  >
    {children}
  </DialogPrimitive.Content>
));
BottomDrawerContent.displayName = 'BottomDrawerContent';

export { BottomDrawer, BottomDrawerPortal, BottomDrawerOverlay, BottomDrawerContent, BottomDrawerClose };
