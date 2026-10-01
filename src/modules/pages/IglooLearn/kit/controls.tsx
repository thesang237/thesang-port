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
        <div className={cn('overflow-hidden rounded-2xl border border-[var(--il-line-2)] bg-[var(--il-panel)] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)]', className)}>
            <div className="flex items-center justify-between gap-3 border-b border-[var(--il-line)] px-4 py-2.5">
                <div className="il-mono flex min-w-0 items-center gap-2.5 text-[11px] text-[var(--il-dim)]">
                    <span className="size-1.5 shrink-0 rotate-45 bg-[var(--il-ice)]" aria-hidden />
                    <span className="uppercase tracking-[0.14em] text-[var(--il-ink)]">Demo</span>
                    <span className="truncate">{title}</span>
                </div>
                {onReset && (
                    <button
                        type="button"
                        onClick={onReset}
                        className="il-btn il-mono shrink-0 rounded-md px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[var(--il-faint)] hover:bg-white/5 hover:text-[var(--il-ink)]"
                    >
                        ↺ Reset
                    </button>
                )}
            </div>
            {hint && (
                <div className="flex gap-2 border-b border-[var(--il-line)] bg-[rgba(148,219,255,0.035)] px-4 py-2 text-[12.5px] leading-snug text-[var(--il-dim)]">
                    <span className="text-[var(--il-ice)]" aria-hidden>
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
                            'il-scrollbox space-y-4 border-t border-[var(--il-line)] bg-[var(--il-bg-2)] p-4',
                            !stacked && 'lg:max-h-[640px] lg:overflow-y-auto lg:border-l lg:border-t-0',
                            stacked && 'grid gap-x-6 gap-y-4 space-y-0 sm:grid-cols-2',
                        )}
                    >
                        {controls}
                    </div>
                )}
            </div>
            {footer && <div className="border-t border-[var(--il-line)] px-4 py-3">{footer}</div>}
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
                <label htmlFor={id} className="il-mono text-[11px] text-[var(--il-ink)]">
                    {label}
                </label>
                <span className="il-mono text-[11px] tabular-nums text-[var(--il-ice)]">{format ? format(value) : value.toFixed(decimals)}</span>
            </div>
            <input
                id={id}
                type="range"
                className="il-range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                style={{ '--fill': `${fill}%` } as React.CSSProperties}
            />
            {help && <p className="mt-0.5 text-[11.5px] leading-snug text-[var(--il-faint)]">{help}</p>}
        </div>
    );
}

export function Toggle({ label, checked, onChange, help }: { label: string; checked: boolean; onChange: (v: boolean) => void; help?: string }) {
    return (
        <div>
            <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="group flex w-full items-center justify-between gap-3 text-left">
                <span className="il-mono text-[11px] text-[var(--il-ink)]">{label}</span>
                <span
                    className={cn(
                        'relative h-[16px] w-[28px] shrink-0 rounded-full border transition-colors',
                        checked ? 'border-[var(--il-ice)] bg-[rgba(148,219,255,0.25)]' : 'border-[var(--il-line-2)] bg-transparent',
                    )}
                >
                    <span
                        className={cn('absolute top-[2px] size-[10px] rounded-full transition-all duration-300', checked ? 'left-[14px] bg-[var(--il-ice)]' : 'left-[2px] bg-[var(--il-faint)]')}
                        style={{ transitionTimingFunction: 'var(--il-ease)' }}
                    />
                </span>
            </button>
            {help && <p className="mt-0.5 text-[11.5px] leading-snug text-[var(--il-faint)]">{help}</p>}
        </div>
    );
}

export function Segmented<T extends string>({ label, options, value, onChange }: { label?: string; options: readonly (T | { value: T; label: string })[]; value: T; onChange: (v: T) => void }) {
    return (
        <div>
            {label && <div className="il-mono mb-1.5 text-[11px] text-[var(--il-ink)]">{label}</div>}
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
                                'il-btn il-mono rounded-md border px-2 py-1 text-[10.5px]',
                                value === v
                                    ? 'border-[rgba(148,219,255,0.45)] bg-[rgba(148,219,255,0.12)] text-[var(--il-ink)]'
                                    : 'border-[var(--il-line)] text-[var(--il-faint)] hover:border-[var(--il-line-2)] hover:text-[var(--il-dim)]',
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
                'il-btn il-mono rounded-lg border px-3 py-1.5 text-[11px] uppercase tracking-[0.12em]',
                primary
                    ? 'border-[rgba(148,219,255,0.5)] bg-[rgba(148,219,255,0.14)] text-[var(--il-ink)] hover:bg-[rgba(148,219,255,0.22)]'
                    : 'border-[var(--il-line-2)] text-[var(--il-dim)] hover:border-[var(--il-dim)] hover:text-[var(--il-ink)]',
                className,
            )}
        >
            {children}
        </button>
    );
}

export function Readout({ items }: { items: { label: string; value: ReactNode; color?: string }[] }) {
    return (
        <div className="il-mono grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-lg border border-[var(--il-line)] bg-black/20 p-2.5 text-[10.5px]">
            {items.map((it) => (
                <div key={it.label} className="flex items-baseline justify-between gap-2">
                    <span className="text-[var(--il-faint)]">{it.label}</span>
                    <span className="tabular-nums" style={{ color: it.color ?? 'var(--il-ink)' }}>
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
            <div className="il-mono flex items-center gap-2 text-[9.5px] uppercase tracking-[0.2em] text-[var(--il-faint)]">
                <span>{title}</span>
                <span className="h-px flex-1 bg-[var(--il-line)]" />
            </div>
            {children}
        </div>
    );
}

export function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <label className="flex items-center justify-between gap-3">
            <span className="il-mono text-[11px] text-[var(--il-ink)]">{label}</span>
            <span className="il-mono flex items-center gap-2 text-[11px] text-[var(--il-dim)]">
                {value}
                <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="size-6 cursor-pointer rounded border border-[var(--il-line-2)] bg-transparent p-0" />
            </span>
        </label>
    );
}
