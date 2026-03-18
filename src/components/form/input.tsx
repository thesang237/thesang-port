import type { FC, InputHTMLAttributes, ReactElement, RefObject } from 'react';

import { cn } from '@/utils/cn';

type Props = InputHTMLAttributes<HTMLInputElement> & {
    ref?: RefObject<HTMLInputElement | null>;
    suffix?: ReactElement;
};

const InputBase: FC<Props> = ({ ref, suffix, className, ...props }) => {
    return (
        <div className="flex items-center justify-between relative">
            <input
                ref={ref}
                className={cn(
                    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                    className,
                )}
                {...props}
            />

            {suffix}
        </div>
    );
};

export default InputBase;
