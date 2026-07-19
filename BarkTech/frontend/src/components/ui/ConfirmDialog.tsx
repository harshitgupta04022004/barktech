import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const ConfirmDialogRoot = DialogPrimitive.Root;
const ConfirmDialogTrigger = DialogPrimitive.Trigger;
const ConfirmDialogPortal = DialogPrimitive.Portal;
const ConfirmDialogClose = DialogPrimitive.Close;

const ConfirmDialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
ConfirmDialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const ConfirmDialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <ConfirmDialogPortal>
    <ConfirmDialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg dark:border-gray-700 dark:bg-gray-900',
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none">
        <X className="h-4 w-4" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </ConfirmDialogPortal>
));
ConfirmDialogContent.displayName = DialogPrimitive.Content.displayName;

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
  open,
  onOpenChange,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <ConfirmDialogRoot open={open} onOpenChange={onOpenChange}>
      <ConfirmDialogContent>
        <div className="flex flex-col items-center text-center">
          <div className={cn(
            'mb-4 flex h-12 w-12 items-center justify-center rounded-full',
            variant === 'danger' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-800'
          )}>
            <AlertTriangle className={cn(
              'h-6 w-6',
              variant === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
            )} />
          </div>

          <DialogPrimitive.Title className="text-lg font-semibold text-black dark:text-white">
            {title}
          </DialogPrimitive.Title>

          <DialogPrimitive.Description className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {message}
          </DialogPrimitive.Description>
        </div>

        <div className="flex justify-center gap-3 mt-2">
          <Button variant="outline" onClick={handleCancel} className="flex-1 dark:border-gray-600 dark:text-gray-200">
            {cancelText}
          </Button>
          <Button variant={variant === 'danger' ? 'destructive' : 'default'} onClick={handleConfirm} className="flex-1">
            {confirmText}
          </Button>
        </div>
      </ConfirmDialogContent>
    </ConfirmDialogRoot>
  );
}

export {
  ConfirmDialogTrigger,
  ConfirmDialogContent,
  ConfirmDialogOverlay,
  ConfirmDialogPortal,
  ConfirmDialogClose,
};
