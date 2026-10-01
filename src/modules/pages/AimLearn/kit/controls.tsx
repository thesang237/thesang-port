'use client';

import { type CSSProperties, type ReactNode, useId } from 'react';

import { cn } from '@/utils/cn';

// ─── Demo frame ─────────────────────────────────────────────────────────────

type DemoProps = {
    title: string;
    /** One line telling the reader what to do with it. */
    hint?: ReactNode;
    controls?: ReactNode;
    onReset?: () => void;
    children: ReactNode;
    /** Put controls under the stage instead of beside it. */
    stacked?: boolean;
    className?: string;
    stageClassName?: string;
    footer?: ReactNode;
};

export function Demo({ title, hint, controls, onReset, children, stacked, className, stageClassName, footer }: DemoProps) {
    return (
        <div data-demo={title} className={cn('overflow-hidden border border-[var(--al-ink)] bg-[var(--al-panel)]', className)}>
            <div className="flex items-center justify-between gap-3 border-b border-[var(--al-ink)] px-4 py-2.5">
                <div className="al-mono flex min-w-0 items-center gap-2.5 text-[11px] text-[var(--al-dim)]">
                    <span className="size-1.5 shrink-0 bg-[var(--al-accent)]" aria-hidden />
                    <span className="uppercase tracking-[0.14em] text-[var(--al-ink)]">Demo</span>
                    <span className="truncate">{title}</span>
                </div>
                {onReset && (
                    <button
                        type="button"
                        onClick={onReset}
                        className="al-btn al-mono shrink-0 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[var(--al-faint)] hover:bg-black/5 hover:text-[var(--al-ink)]"
                    >
                        ↺ Reset
                    </button>
                )}
            </div>
            {hint && (
                <div className="flex gap-2 border-b border-[var(--al-line)] bg-[rgba(239,90,31,0.08)] px-4 py-2 text-[12.5px] leading-snug text-[var(--al-dim)]">
                    <span className="text-[var(--al-accent-ink)]" aria-hidden>
                        ⌁
                    </span>
                    <span>{hint}</span>
                </div>
            )}
            <div className={cn('grid', controls && !stacked && 'lg:grid-cols-[minmax(0,1fr)_300px]')}>
                <div className={cn('relative min-w-0', stageClassName)}>{children}</div>
                {controls && (
                    <div
                        className={cn(
                            'al-scrollbox space-y-4 border-t border-[var(--al-ink)] bg-[var(--al-bg-2)] p-4',
                            !stacked && 'lg:max-h-[640px] lg:overflow-y-auto lg:border-l lg:border-t-0',
                            stacked && 'grid gap-x-6 gap-y-4 space-y-0 sm:grid-cols-2',
                        )}
                    >
                        {controls}
                    </div>
                )}
            </div>
            {footer && <div className="border-t border-[var(--al-line-2)] px-4 py-3">{footer}</div>}
        </div>
    );
}

// ─── Controls ───────────────────────────────────────────────────────────────

type SliderProps = {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (v: number) => void;
    /** Plain-language meaning of the dial. */
    help?: string;
    format?: (v: number) => string;
};

export function Slider({ label, value, min, max, step = 0.01, onChange, help, format }: SliderProps) {
    const id = useId();
    const fill = ((value - min) / (max - min)) * 100;
    const decimals = step >= 1 ? 0 : step >= 0.1 ? 1 : step >= 0.01 ? 2 : 3;
    return (
        <div>
            <div className="mb-1 flex items-baseline justify-between gap-3">
                <label htmlFor={id} className="al-mono text-[11px] text-[var(--al-ink)]">
                    {label}
                </label>
                <span className="al-mono text-[11px] tabular-nums text-[var(--al-accent-ink)]">{format ? format(value) : value.toFixed(decimals)}</span>
            </div>
            <input
                id={id}
                type="range"
                className="al-range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                style={{ '--fill': `${fill}%` } as CSSProperties}
            />
            {help && <p className="mt-0.5 text-[11.5px] leading-snug text-[var(--al-faint)]">{help}</p>}
        </div>
    );
}

export function Toggle({ label, checked, onChange, help }: { label: string; checked: boolean; onChange: (v: boolean) => void; help?: string }) {
    return (
        <div>
            <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="al-btn group flex w-full items-center justify-between gap-3 text-left">
                <span className="al-mono text-[11px] text-[var(--al-ink)]">{label}</span>
                <span
                    className={cn('relative h-[16px] w-[28px] shrink-0 border transition-colors', checked ? 'border-[var(--al-ink)] bg-[var(--al-ink)]' : 'border-[var(--al-line-2)] bg-transparent')}
                >
                    <span
                        className={cn('absolute top-[2px] size-[10px] transition-all duration-200', checked ? 'left-[14px] bg-[var(--al-accent)]' : 'left-[2px] bg-[var(--al-faint)]')}
                        style={{ transitionTimingFunction: 'var(--al-ease)' }}
                    />
                </span>
            </button>
            {help && <p className="mt-0.5 text-[11.5px] leading-snug text-[var(--al-faint)]">{help}</p>}
        </div>
    );
}

export function Segmented<T extends string>({ label, options, value, onChange }: { label?: string; options: readonly (T | { value: T; label: string })[]; value: T; onChange: (v: T) => void }) {
    return (
        <div>
            {label && <div className="al-mono mb-1.5 text-[11px] text-[var(--al-ink)]">{label}</div>}
            <div className="flex flex-wrap gap-1" role="group" aria-label={label}>
                {options.map((o) => {
                    const v = typeof o === 'string' ? o : o.value;
                    const l = typeof o === 'string' ? o : o.label;
                    return (
                        <button
                            key={v}
                            type="button"
                            aria-pressed={value === v}
                            onClick={() => onChange(v)}
                            className={cn(
                                'al-btn al-mono border px-2 py-1 text-[10.5px]',
                                value === v
                                    ? 'border-[var(--al-ink)] bg-[var(--al-ink)] text-[var(--al-bg)]'
                                    : 'border-[var(--al-line-2)] text-[var(--al-dim)] hover:border-[var(--al-ink)] hover:text-[var(--al-ink)]',
                            )}
                        >
                            {l}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export function Btn({ children, onClick, primary, className, disabled }: { children: ReactNode; onClick: () => void; primary?: boolean; className?: string; disabled?: boolean }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'al-btn al-mono border px-3 py-1.5 text-[11px] uppercase tracking-[0.12em]',
                primary ? 'al-ink-btn border-[var(--al-ink)]' : 'border-[var(--al-line-2)] text-[var(--al-dim)] hover:border-[var(--al-ink)] hover:text-[var(--al-ink)]',
                className,
            )}
        >
            {children}
        </button>
    );
}

export function Readout({ items }: { items: { label: string; value: ReactNode; color?: string }[] }) {
    return (
        <div className="al-mono grid grid-cols-2 gap-x-3 gap-y-1.5 border border-[var(--al-line-2)] bg-[var(--al-panel)] p-2.5 text-[10.5px]">
            {items.map((it) => (
                <div key={it.label} className="flex items-baseline justify-between gap-2">
                    <span className="text-[var(--al-faint)]">{it.label}</span>
                    <span className="tabular-nums" style={{ color: it.color ?? 'var(--al-ink)' }}>
                        {it.value}
                    </span>
                </div>
            ))}
        </div>
    );
}

export function Group({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="space-y-3">
            <div className="al-mono flex items-center gap-2 text-[9.5px] uppercase tracking-[0.2em] text-[var(--al-faint)]">
                <span>{title}</span>
                <span className="h-px flex-1 bg-[var(--al-line-2)]" />
            </div>
            {children}
        </div>
    );
}

export function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <label className="flex items-center justify-between gap-3">
            <span className="al-mono text-[11px] text-[var(--al-ink)]">{label}</span>
            <span className="al-mono flex items-center gap-2 text-[11px] text-[var(--al-dim)]">
                {value}
                <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="size-6 cursor-pointer border border-[var(--al-line-2)] bg-transparent p-0" />
            </span>
        </label>
    );
}
