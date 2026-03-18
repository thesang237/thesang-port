'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import SVG from 'react-inlinesvg';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, LucideCheck } from 'lucide-react';

import { cn } from '@/utils/cn';

export type SelectItem = {
    label: string;
    value: string;
    [key: string]: unknown;
};

export type SelectValueChangeDetails<T extends SelectItem> = {
    items: T[];
    value: string[];
};

type Props<T extends SelectItem = SelectItem> = {
    items: T[];
    placeholder?: string;
    value?: T[];
    onValueChange?: (details: SelectValueChangeDetails<T>) => void;
    disabled?: boolean;
    required?: boolean;
    multiple?: boolean;
    name?: string;
    valueRenderer?: (value: T[] | undefined) => ReactNode;
    optionRenderer?: (item: T) => ReactNode;
    triggerClassName?: string;
    searchable?: boolean;
    onCreateClick?: () => void;
};

// Single-select using Radix Select
const SingleSelect = <T extends SelectItem>({
    items,
    placeholder = 'Select an option',
    value = [],
    onValueChange,
    disabled,
    required,
    name,
    valueRenderer,
    optionRenderer,
    triggerClassName,
    searchable,
    onCreateClick,
}: Props<T>) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredItems = useMemo(() => {
        if (!searchable || !searchQuery.trim()) return items;
        const q = searchQuery.toLowerCase().trim();
        return items.filter((i) => i.label.toLowerCase().includes(q));
    }, [items, searchable, searchQuery]);

    const selectedValue = value[0]?.value ?? '';

    const handleValueChange = (val: string) => {
        const item = items.find((i) => i.value === val);
        onValueChange?.({ items: item ? [item] : [], value: val ? [val] : [] });
    };

    return (
        <SelectPrimitive.Root value={selectedValue} onValueChange={handleValueChange} disabled={disabled} required={required} name={name}>
            <SelectPrimitive.Trigger
                className={cn(
                    'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                    triggerClassName,
                )}
            >
                {valueRenderer ? valueRenderer(value) : <SelectPrimitive.Value placeholder={placeholder} />}
                <SelectPrimitive.Icon asChild>
                    <div className="w-4 h-4 flex items-center justify-center">
                        <SVG src="/icons/filled-chevron-left.svg" className="chevron-icon" />
                    </div>
                </SelectPrimitive.Icon>
            </SelectPrimitive.Trigger>

            <SelectPrimitive.Portal>
                <SelectPrimitive.Content
                    className="relative z-[100000] min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md animate-in fade-in-80"
                    position="popper"
                    sideOffset={4}
                >
                    {(searchable || onCreateClick) && (
                        <div className="flex flex-col p-1 border-b border-border">
                            {searchable && (
                                <input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search..."
                                    className="flex h-8 w-full rounded-md bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground"
                                />
                            )}
                            {onCreateClick && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSearchQuery('');
                                        onCreateClick();
                                    }}
                                    className="flex w-full items-center justify-center px-2 py-1 text-sm hover:bg-accent"
                                >
                                    +
                                </button>
                            )}
                        </div>
                    )}

                    <SelectPrimitive.Viewport className="p-1">
                        {filteredItems.length === 0 ? (
                            <p className="px-2 py-1.5 text-sm text-muted-foreground">No results found</p>
                        ) : (
                            filteredItems.map((item) => (
                                <SelectPrimitive.Item
                                    key={item.value}
                                    value={item.value}
                                    className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                >
                                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                        <SelectPrimitive.ItemIndicator>
                                            <Check className="h-4 w-4" />
                                        </SelectPrimitive.ItemIndicator>
                                    </span>
                                    {optionRenderer ? optionRenderer(item) : item.label}
                                </SelectPrimitive.Item>
                            ))
                        )}
                    </SelectPrimitive.Viewport>
                </SelectPrimitive.Content>
            </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
    );
};

// Multi-select using Radix DropdownMenu
const MultiSelect = <T extends SelectItem>({
    items,
    placeholder = 'Select options',
    value = [],
    onValueChange,
    disabled,
    name,
    valueRenderer,
    optionRenderer,
    triggerClassName,
    searchable,
    onCreateClick,
}: Props<T>) => {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredItems = useMemo(() => {
        if (!searchable || !searchQuery.trim()) return items;
        const q = searchQuery.toLowerCase().trim();
        return items.filter((i) => i.label.toLowerCase().includes(q));
    }, [items, searchable, searchQuery]);

    const handleToggle = (item: T) => {
        const alreadySelected = value.some((v) => v.value === item.value);
        const newItems = alreadySelected ? value.filter((v) => v.value !== item.value) : [...value, item];
        onValueChange?.({ items: newItems, value: newItems.map((i) => i.value) });
    };

    return (
        <DropdownMenuPrimitive.Root open={open} onOpenChange={setOpen}>
            <DropdownMenuPrimitive.Trigger
                disabled={disabled}
                className={cn(
                    'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                    triggerClassName,
                )}
            >
                {valueRenderer ? valueRenderer(value) : value.length > 0 ? value.map((v) => v.label).join(', ') : <span className="text-muted-foreground">{placeholder}</span>}
                <div className="w-4 h-4 flex items-center justify-center">
                    <SVG src="/icons/filled-chevron-left.svg" className="chevron-icon" />
                </div>
            </DropdownMenuPrimitive.Trigger>

            {name && value.map((v) => <input key={v.value} type="hidden" name={name} value={v.value} />)}

            <DropdownMenuPrimitive.Portal>
                <DropdownMenuPrimitive.Content
                    className="z-[100000] min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md animate-in fade-in-80"
                    sideOffset={4}
                >
                    {(searchable || onCreateClick) && (
                        <div className="flex flex-col p-1 border-b border-border">
                            {searchable && (
                                <input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search..."
                                    className="flex h-8 w-full rounded-md bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground"
                                    onKeyDown={(e) => e.stopPropagation()}
                                />
                            )}
                            {onCreateClick && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSearchQuery('');
                                        setOpen(false);
                                        onCreateClick();
                                    }}
                                    className="flex w-full items-center justify-center px-2 py-1 text-sm hover:bg-accent"
                                >
                                    +
                                </button>
                            )}
                        </div>
                    )}

                    <div className="max-h-60 overflow-auto p-1">
                        {filteredItems.length === 0 ? (
                            <p className="px-2 py-1.5 text-sm text-muted-foreground">No results found</p>
                        ) : (
                            filteredItems.map((item) => {
                                const isSelected = value.some((v) => v.value === item.value);
                                return (
                                    <DropdownMenuPrimitive.Item
                                        key={item.value}
                                        onSelect={(e) => {
                                            e.preventDefault();
                                            handleToggle(item);
                                        }}
                                        className="relative flex w-full cursor-pointer select-none items-center justify-between rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground"
                                    >
                                        {optionRenderer ? optionRenderer(item) : <span>{item.label}</span>}
                                        {isSelected && <LucideCheck className="h-4 w-4 shrink-0" />}
                                    </DropdownMenuPrimitive.Item>
                                );
                            })
                        )}
                    </div>
                </DropdownMenuPrimitive.Content>
            </DropdownMenuPrimitive.Portal>
        </DropdownMenuPrimitive.Root>
    );
};

const SelectBase = <T extends SelectItem = SelectItem>(props: Props<T>) => {
    if (props.multiple) {
        return <MultiSelect {...props} />;
    }
    return <SingleSelect {...props} />;
};

export default SelectBase;
