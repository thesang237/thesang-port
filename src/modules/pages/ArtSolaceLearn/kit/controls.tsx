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

/** A demo: title row, hint line, stage, dials (beside on wide screens, below on narrow ones). */
export function Demo({ title, hint, controls, onReset, children, stacked, className, stageClassName, footer }: DemoProps) {
    return (
        <div data-demo={title} className={cn('relative', className)}>
            <div className="overflow-hidden rounded-xl border border-[var(--sl-line-2)] bg-[var(--sl-panel)]">
                <div className="flex items-center justify-between gap-3 border-b border-[var(--sl-line)] px-4 py-2.5">
                    <div className="sl-mono flex min-w-0 items-center gap-2.5 text-[11px] uppercase">
                        <span className="sl-dot shrink-0 text-[var(--sl-rust-ink)]" />
                        <span className="shrink-0 text-[var(--sl-faint)]">Demo</span>
                        <span className="truncate text-[var(--sl-ink)]">{title}</span>
                    </div>
                    {onReset && (
                        <button
                            type="button"
                            onClick={onReset}
                            className="sl-btn sl-mono shrink-0 rounded-full border border-[var(--sl-line-2)] px-2.5 py-1 text-[10.5px] uppercase text-[var(--sl-dim)] hover:border-[var(--sl-rust-ink)] hover:text-[var(--sl-rust-ink)]"
                        >
                            ↺ Reset
                        </button>
                    )}
                </div>
                {hint && (
                    <div className="flex gap-2 border-b border-[var(--sl-line)] bg-[var(--sl-bg-2)] px-4 py-2 text-[13.5px] leading-snug text-[var(--sl-body)]">
                        <span className="text-[var(--sl-rust-ink)]" aria-hidden>
                            ⌁
                        </span>
                        <span>{hint}</span>
                    </div>
                )}
                <div className={cn('grid', controls && !stacked && 'lg:grid-cols-[minmax(0,1fr)_300px]')}>
                    <div className={cn('relative min-w-0 bg-[var(--sl-stage)]', stageClassName)}>{children}</div>
                    {controls && (
                        <div
                            className={cn(
                                'sl-scrollbox space-y-4 border-t border-[var(--sl-line)] p-4',
                                !stacked && 'lg:max-h-[680px] lg:overflow-y-auto lg:border-l lg:border-t-0',
                                stacked && 'grid gap-x-6 gap-y-4 space-y-0 sm:grid-cols-2',
                            )}
                        >
                            {controls}
                        </div>
                    )}
                </div>
                {footer && <div className="border-t border-[var(--sl-line)] px-4 py-3">{footer}</div>}
            </div>
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
    disabled?: boolean;
};

export function Slider({ label, value, min, max, step = 0.01, onChange, help, format, disabled }: SliderProps) {
    const id = useId();
    const fill = ((value - min) / (max - min)) * 100;
    const decimals = step >= 1 ? 0 : step >= 0.1 ? 1 : step >= 0.01 ? 2 : 3;
    return (
        <div className={cn(disabled && 'pointer-events-none opacity-40')}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
                <label htmlFor={id} className="sl-mono text-[11px] text-[var(--sl-ink)]">
                    {label}
                </label>
                <span className="sl-mono text-[11px] tabular-nums text-[var(--sl-rust-ink)]">{format ? format(value) : value.toFixed(decimals)}</span>
            </div>
            <input
                id={id}
                type="range"
                className="sl-range"
                min={min}
                max={max}
                step={step}
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                style={{ '--fill': `${fill}%` } as CSSProperties}
            />
            {help && <p className="mt-0.5 text-[12px] leading-snug text-[var(--sl-dim)]">{help}</p>}
        </div>
    );
}

export function Toggle({ label, checked, onChange, help }: { label: string; checked: boolean; onChange: (v: boolean) => void; help?: string }) {
    return (
        <div>
            <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="group flex w-full items-center justify-between gap-3 text-left">
                <span className="sl-mono text-[11px] text-[var(--sl-ink)]">{label}</span>
                <span
                    className={cn(
                        'relative h-[16px] w-[28px] shrink-0 rounded-full border transition-colors',
                        checked ? 'border-[var(--sl-rust-ink)] bg-[rgba(222,132,113,0.2)]' : 'border-[var(--sl-line-3)] bg-transparent',
                    )}
                >
                    <span
                        className={cn('absolute top-[2px] size-[10px] rounded-full transition-all duration-300', checked ? 'left-[14px] bg-[var(--sl-rust-ink)]' : 'left-[2px] bg-[var(--sl-faint)]')}
                        style={{ transitionTimingFunction: 'var(--sl-ease)' }}
                    />
                </span>
            </button>
            {help && <p className="mt-0.5 text-[12px] leading-snug text-[var(--sl-dim)]">{help}</p>}
        </div>
    );
}

export function Segmented<T extends string>({ label, options, value, onChange }: { label?: string; options: readonly (T | { value: T; label: string })[]; value: T; onChange: (v: T) => void }) {
    return (
        <div>
            {label && <div className="sl-mono mb-1.5 text-[11px] text-[var(--sl-ink)]">{label}</div>}
            <div className="flex flex-wrap gap-1">
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
                                'sl-btn sl-mono rounded-full border px-2.5 py-1 text-[10.5px]',
                                value === v
                                    ? 'border-[var(--sl-rust-ink)] bg-[rgba(222,132,113,0.14)] text-[var(--sl-rust-ink)]'
                                    : 'border-[var(--sl-line-2)] text-[var(--sl-dim)] hover:border-[var(--sl-line-3)] hover:text-[var(--sl-ink)]',
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
                'sl-btn sl-mono rounded-full border px-3.5 py-1.5 text-[11px] uppercase disabled:opacity-40',
                primary
                    ? 'border-[var(--sl-rust-ink)] bg-[var(--sl-rust-ink)] text-[var(--sl-ink)] hover:bg-[#e89a89]'
                    : 'border-[var(--sl-line-3)] text-[var(--sl-body)] hover:border-[var(--sl-rust-ink)] hover:text-[var(--sl-rust-ink)]',
                className,
            )}
        >
            {children}
        </button>
    );
}

export function Readout({ items }: { items: { label: string; value: ReactNode; color?: string }[] }) {
    return (
        <div className="sl-mono grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-md border border-[var(--sl-line)] bg-[var(--sl-bg-2)] p-2.5 text-[10.5px]">
            {items.map((it) => (
                <div key={it.label} className="flex items-baseline justify-between gap-2">
                    <span className="text-[var(--sl-faint)]">{it.label}</span>
                    <span className="tabular-nums" style={{ color: it.color ?? 'var(--sl-ink)' }}>
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
            <div className="sl-mono flex items-center gap-2 text-[10px] uppercase text-[var(--sl-faint)]">
                <span>{title}</span>
                <span className="h-px flex-1 bg-[var(--sl-line-2)]" />
            </div>
            {children}
        </div>
    );
}

/** Small status line inside a stage (loading, errors). */
export function StageNote({ children }: { children: ReactNode }) {
    return (
        <div className="sl-mono pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-2 rounded-full border border-[var(--sl-line-2)] bg-[rgba(248,239,230,0.92)] px-2.5 py-1 text-[10.5px] uppercase text-[var(--sl-body)]">
            <span className="sl-dot animate-pulse text-[var(--sl-rust-ink)]" />
            {children}
        </div>
    );
}

/** A colour swatch with a label (for showing a shader constant). */
export function ColorDot({ label, color, note }: { label: string; color: string; note?: string }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="sl-mono text-[11px] text-[var(--sl-ink)]">{label}</span>
            <span className="sl-mono flex items-center gap-2 text-[11px] text-[var(--sl-dim)]">
                {note}
                <span className="size-5 rounded-full border border-[var(--sl-line-2)]" style={{ background: color }} />
            </span>
        </div>
    );
}
