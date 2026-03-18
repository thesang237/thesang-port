import type { FC, PropsWithChildren } from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

import { cn } from '@/utils/cn';

type Props = PropsWithChildren<{
    name?: string;
    checked?: boolean;
    defaultChecked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
    required?: boolean;
    rootClassName?: string;
    controlClassName?: string;
    labelClassName?: string;
}>;

const Checkbox: FC<Props> = ({ children, name, checked, defaultChecked, onCheckedChange, disabled, required, rootClassName, controlClassName, labelClassName }) => {
    return (
        <label className={cn('flex items-center gap-2 cursor-pointer', rootClassName)}>
            <CheckboxPrimitive.Root
                name={name}
                checked={checked}
                defaultChecked={defaultChecked}
                onCheckedChange={onCheckedChange}
                disabled={disabled}
                required={required}
                className={cn(
                    'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
                    controlClassName,
                )}
            >
                <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
                    <Check className="h-4 w-4" />
                </CheckboxPrimitive.Indicator>
            </CheckboxPrimitive.Root>

            {children && <span className={cn('text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', labelClassName)}>{children}</span>}
        </label>
    );
};

export default Checkbox;
