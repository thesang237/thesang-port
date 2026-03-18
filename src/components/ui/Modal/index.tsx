'use client';

import type { FC, HTMLAttributes, ReactNode, RefObject } from 'react';
import { useImperativeHandle, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { ZIndex } from '@/constants/vars';
import { cn } from '@/utils/cn';

export type ModalRef = {
    show: () => void;
    hide: () => void;
};

export type ModalProps = {
    ref?: RefObject<ModalRef | null>;
    onClickOutside?: () => void;
    children: ReactNode;
    className?: string;
};

export type ModalOverlayProps = HTMLAttributes<HTMLDivElement>;

export type ModalContentRef = {
    show: () => void;
    hide: () => void;
};

export type ModalContentProps = HTMLAttributes<HTMLDivElement> & {
    ref?: RefObject<ModalContentRef | null>;
    fullWidth?: boolean;
    defaultActive?: boolean;
    closeable?: boolean;
    onClose?: () => void;
};

const Overlay: FC<ModalOverlayProps> = ({ className, ...props }) => {
    return <div className={cn('fixed inset-0 opacity-75', className)} {...props} />;
};

const Content: FC<ModalContentProps> = ({ fullWidth = false, children, ref, closeable, onClose, className, ...props }) => {
    const [, setOpen] = useState(false);

    useImperativeHandle(ref, () => ({
        show: () => setOpen(true),
        hide: () => setOpen(false),
    }));

    return (
        <div className={cn('relative h-max max-h-full max-w-full w-full sm:w-max', fullWidth ? 'px-0' : '', className)} {...props}>
            {closeable && (
                <button onClick={onClose} className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center" aria-label="Close">
                    <X size={16} />
                </button>
            )}

            {children}
        </div>
    );
};

const Modal: FC<ModalProps> & {
    Content: FC<ModalContentProps>;
    Overlay: FC<ModalOverlayProps>;
} = ({ ref, children, onClickOutside, className }) => {
    const [open, setOpen] = useState(false);

    useImperativeHandle(ref, () => ({
        show: () => setOpen(true),
        hide: () => setOpen(false),
    }));

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm" style={{ zIndex: parseInt(ZIndex.MODAL) || 10000 }} onClick={onClickOutside} />
                <Dialog.Content
                    className={cn('fixed inset-0 flex items-center justify-center pointer-events-none', className)}
                    style={{ zIndex: parseInt(ZIndex.MODAL) || 10000 }}
                    onInteractOutside={() => onClickOutside?.()}
                >
                    <div className="pointer-events-auto">{children}</div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

Modal.displayName = 'Modal';
Modal.Content = Content;
Modal.Content.displayName = 'ModalContent';
Modal.Overlay = Overlay;
Modal.Overlay.displayName = 'ModalOverlay';

export default Modal;
