'use client';

import type { ReactNode, RefObject } from 'react';
import React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { cn } from '@/utils/cn';

export type TooltipProps = {
    content: ReactNode;
    disabled?: boolean;
    side?: 'top' | 'right' | 'bottom' | 'left';
    sideOffset?: number;
    contentClassName?: string;
} & TooltipPrimitive.TooltipProps;

export const Tooltip = function Tooltip({ ref: _ref, ...props }: TooltipProps & { ref?: RefObject<HTMLDivElement | null> }) {
    const { children, disabled, content, contentClassName, side = 'top', sideOffset = 4, ...rest } = props;

    if (disabled) return children as React.ReactElement;

    return (
        <TooltipPrimitive.Provider>
            <TooltipPrimitive.Root {...rest} delayDuration={0}>
                <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
                <TooltipPrimitive.Portal>
                    <TooltipPrimitive.Content
                        side={side}
                        sideOffset={sideOffset}
                        className={cn(
                            'z-[100] overflow-hidden rounded-md border border-border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                            contentClassName,
                        )}
                    >
                        {content}
                    </TooltipPrimitive.Content>
                </TooltipPrimitive.Portal>
            </TooltipPrimitive.Root>
        </TooltipPrimitive.Provider>
    );
};
