'use client';

import { type ReactNode, useId } from 'react';

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
        <div data-demo={title} className={cn('overflow-hidden rounded-2xl border border-[var(--ll-line-2)] bg-[var(--ll-panel)] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)]', className)}>
            <div className="flex items-center justify-between gap-3 border-b border-[var(--ll-line)] px-4 py-2.5">
                <div className="ll-mono flex min-w-0 items-center gap-2.5 text-[11px] text-[var(--ll-dim)]">
                    <span className="size-1.5 shrink-0 rotate-45 bg-[var(--ll-lime)]" aria-hidden />
                    <span className="uppercase tracking-[0.14em] text-[var(--ll-ink)]">Demo</span>
                    <span className="truncate">{title}</span>
                </div>
                {onReset && (
                    <button
                        type="button"
                        onClick={onReset}
                        className="ll-btn ll-mono shrink-0 rounded-md px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[var(--ll-faint)] hover:bg-white/5 hover:text-[var(--ll-ink)]"
                    >
                        ↺ Reset
                    </button>
                )}
            </div>
            {hint && (
                <div className="flex gap-2 border-b border-[var(--ll-line)] bg-[rgba(205,255,11,0.035)] px-4 py-2 text-[12.5px] leading-snug text-[var(--ll-dim)]">
                    <span className="text-[var(--ll-lime)]" aria-hidden>
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
                            'll-scrollbox space-y-4 border-t border-[var(--ll-line)] bg-[var(--ll-bg-2)] p-4',
                            !stacked && 'lg:max-h-[640px] lg:overflow-y-auto lg:border-l lg:border-t-0',
                            stacked && 'grid gap-x-6 gap-y-4 space-y-0 sm:grid-cols-2',
                        )}
                    >
                        {controls}
                    </div>
                )}
            </div>
            {footer && <div className="border-t border-[var(--ll-line)] px-4 py-3">{footer}</div>}
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
                <label htmlFor={id} className="ll-mono text-[11px] text-[var(--ll-ink)]">
                    {label}
                </label>
                <span className="ll-mono text-[11px] tabular-nums text-[var(--ll-lime)]">{format ? format(value) : value.toFixed(decimals)}</span>
            </div>
            <input
                id={id}
                type="range"
                className="ll-range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                style={{ '--fill': `${fill}%` } as React.CSSProperties}
            />
            {help && <p className="mt-0.5 text-[11.5px] leading-snug text-[var(--ll-faint)]">{help}</p>}
        </div>
    );
}

export function Toggle({ label, checked, onChange, help }: { label: string; checked: boolean; onChange: (v: boolean) => void; help?: string }) {
    return (
        <div>
            <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="group flex w-full items-center justify-between gap-3 text-left">
                <span className="ll-mono text-[11px] text-[var(--ll-ink)]">{label}</span>
                <span
                    className={cn(
                        'relative h-[16px] w-[28px] shrink-0 rounded-full border transition-colors',
                        checked ? 'border-[var(--ll-lime)] bg-[rgba(205,255,11,0.25)]' : 'border-[var(--ll-line-2)] bg-transparent',
                    )}
                >
                    <span
                        className={cn('absolute top-[2px] size-[10px] rounded-full transition-all duration-300', checked ? 'left-[14px] bg-[var(--ll-lime)]' : 'left-[2px] bg-[var(--ll-faint)]')}
                        style={{ transitionTimingFunction: 'var(--ll-ease)' }}
                    />
                </span>
            </button>
            {help && <p className="mt-0.5 text-[11.5px] leading-snug text-[var(--ll-faint)]">{help}</p>}
        </div>
    );
}

export function Segmented<T extends string>({ label, options, value, onChange }: { label?: string; options: readonly (T | { value: T; label: string })[]; value: T; onChange: (v: T) => void }) {
    return (
        <div>
            {label && <div className="ll-mono mb-1.5 text-[11px] text-[var(--ll-ink)]">{label}</div>}
            <div className="flex flex-wrap gap-1">
                {options.map((o) => {
                    const v = typeof o === 'string' ? o : o.value;
                    const l = typeof o === 'string' ? o : o.label;
                    return (
                        <button
                            key={v}
                            type="button"
                            onClick={() => onChange(v)}
                            className={cn(
                                'll-btn ll-mono rounded-md border px-2 py-1 text-[10.5px]',
                                value === v
                                    ? 'border-[rgba(205,255,11,0.45)] bg-[rgba(205,255,11,0.12)] text-[var(--ll-ink)]'
                                    : 'border-[var(--ll-line)] text-[var(--ll-faint)] hover:border-[var(--ll-line-2)] hover:text-[var(--ll-dim)]',
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

export function Btn({ children, onClick, primary, className }: { children: ReactNode; onClick: () => void; primary?: boolean; className?: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'll-btn ll-mono rounded-lg border px-3 py-1.5 text-[11px] uppercase tracking-[0.12em]',
                primary
                    ? 'border-[rgba(205,255,11,0.5)] bg-[rgba(205,255,11,0.14)] text-[var(--ll-ink)] hover:bg-[rgba(205,255,11,0.22)]'
                    : 'border-[var(--ll-line-2)] text-[var(--ll-dim)] hover:border-[var(--ll-dim)] hover:text-[var(--ll-ink)]',
                className,
            )}
        >
            {children}
        </button>
    );
}

export function Readout({ items }: { items: { label: string; value: ReactNode; color?: string }[] }) {
    return (
        <div className="ll-mono grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-lg border border-[var(--ll-line)] bg-black/20 p-2.5 text-[10.5px]">
            {items.map((it) => (
                <div key={it.label} className="flex items-baseline justify-between gap-2">
                    <span className="text-[var(--ll-faint)]">{it.label}</span>
                    <span className="tabular-nums" style={{ color: it.color ?? 'var(--ll-ink)' }}>
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
            <div className="ll-mono flex items-center gap-2 text-[9.5px] uppercase tracking-[0.2em] text-[var(--ll-faint)]">
                <span>{title}</span>
                <span className="h-px flex-1 bg-[var(--ll-line)]" />
            </div>
            {children}
        </div>
    );
}

export function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <label className="flex items-center justify-between gap-3">
            <span className="ll-mono text-[11px] text-[var(--ll-ink)]">{label}</span>
            <span className="ll-mono flex items-center gap-2 text-[11px] text-[var(--ll-dim)]">
                {value}
                <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="size-6 cursor-pointer rounded border border-[var(--ll-line-2)] bg-transparent p-0" />
            </span>
        </label>
    );
}
