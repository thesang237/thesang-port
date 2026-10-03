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

/** A demo is a folder: a tab with its title, then the sheet (stage + dials). */
export function Demo({ title, hint, controls, onReset, children, stacked, className, stageClassName, footer }: DemoProps) {
    return (
        <div data-demo={title} className={cn('relative', className)}>
            <div className="flex items-end justify-between gap-3">
                <div className="kl-tab-shape kl-mono flex min-w-0 max-w-[85%] items-center gap-2.5 bg-[var(--kl-black)] py-2 pl-3.5 pr-7 text-[11px] uppercase text-white">
                    <span className="kl-dot shrink-0 text-[var(--kl-lime)]" />
                    <span className="shrink-0 text-white/60">Demo</span>
                    <span className="truncate">{title}</span>
                </div>
                {onReset && (
                    <button type="button" onClick={onReset} className="kl-btn kl-mono mb-1 shrink-0 px-2 py-1 text-[10.5px] uppercase text-[var(--kl-dim)] hover:bg-[var(--kl-black)] hover:text-white">
                        ↺ Reset
                    </button>
                )}
            </div>
            <div className="overflow-hidden border border-[var(--kl-black)] bg-[var(--kl-panel)]">
                {hint && (
                    <div className="flex gap-2 border-b border-[var(--kl-line)] bg-[var(--kl-panel-2)] px-4 py-2 text-[13px] leading-snug text-[var(--kl-body)]">
                        <span className="text-[var(--kl-lav-deep)]" aria-hidden>
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
                                'kl-scrollbox space-y-4 border-t border-[var(--kl-line)] bg-[var(--kl-bg)] p-4',
                                !stacked && 'lg:max-h-[640px] lg:overflow-y-auto lg:border-l lg:border-t-0',
                                stacked && 'grid gap-x-6 gap-y-4 space-y-0 sm:grid-cols-2',
                            )}
                        >
                            {controls}
                        </div>
                    )}
                </div>
                {footer && <div className="border-t border-[var(--kl-line)] px-4 py-3">{footer}</div>}
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
};

export function Slider({ label, value, min, max, step = 0.01, onChange, help, format }: SliderProps) {
    const id = useId();
    const fill = ((value - min) / (max - min)) * 100;
    const decimals = step >= 1 ? 0 : step >= 0.1 ? 1 : step >= 0.01 ? 2 : 3;
    return (
        <div>
            <div className="mb-1 flex items-baseline justify-between gap-3">
                <label htmlFor={id} className="kl-mono text-[11px] text-[var(--kl-ink)]">
                    {label}
                </label>
                <span className="kl-mono text-[11px] tabular-nums text-[var(--kl-lav-deep)]">{format ? format(value) : value.toFixed(decimals)}</span>
            </div>
            <input
                id={id}
                type="range"
                className="kl-range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                style={{ '--fill': `${fill}%` } as React.CSSProperties}
            />
            {help && <p className="mt-0.5 text-[11.5px] leading-snug text-[var(--kl-dim)]">{help}</p>}
        </div>
    );
}

export function Toggle({ label, checked, onChange, help }: { label: string; checked: boolean; onChange: (v: boolean) => void; help?: string }) {
    return (
        <div>
            <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="group flex w-full items-center justify-between gap-3 text-left">
                <span className="kl-mono text-[11px] text-[var(--kl-ink)]">{label}</span>
                <span
                    className={cn(
                        'relative h-[16px] w-[28px] shrink-0 border transition-colors',
                        checked ? 'border-[var(--kl-black)] bg-[var(--kl-lime)]' : 'border-[var(--kl-line-2)] bg-transparent',
                    )}
                >
                    <span
                        className={cn('absolute top-[2px] size-[10px] transition-all duration-300', checked ? 'left-[14px] bg-[var(--kl-black)]' : 'left-[2px] bg-[var(--kl-faint)]')}
                        style={{ transitionTimingFunction: 'var(--kl-ease)' }}
                    />
                </span>
            </button>
            {help && <p className="mt-0.5 text-[11.5px] leading-snug text-[var(--kl-dim)]">{help}</p>}
        </div>
    );
}

export function Segmented<T extends string>({ label, options, value, onChange }: { label?: string; options: readonly (T | { value: T; label: string })[]; value: T; onChange: (v: T) => void }) {
    return (
        <div>
            {label && <div className="kl-mono mb-1.5 text-[11px] text-[var(--kl-ink)]">{label}</div>}
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
                                'kl-btn kl-mono border px-2 py-1 text-[10.5px]',
                                value === v
                                    ? 'border-[var(--kl-black)] bg-[var(--kl-black)] text-white'
                                    : 'border-[var(--kl-line-2)] text-[var(--kl-dim)] hover:border-[var(--kl-black)] hover:text-[var(--kl-ink)]',
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
                'kl-btn kl-mono border px-3 py-1.5 text-[11px] uppercase disabled:opacity-40',
                primary
                    ? 'border-[var(--kl-black)] bg-[var(--kl-black)] text-white hover:bg-[var(--kl-lav-deep)] hover:border-[var(--kl-lav-deep)]'
                    : 'border-[var(--kl-line-2)] text-[var(--kl-body)] hover:border-[var(--kl-black)] hover:text-[var(--kl-ink)]',
                className,
            )}
        >
            {children}
        </button>
    );
}

export function Readout({ items }: { items: { label: string; value: ReactNode; color?: string }[] }) {
    return (
        <div className="kl-mono grid grid-cols-2 gap-x-3 gap-y-1.5 bg-[var(--kl-black)] p-2.5 text-[10.5px]">
            {items.map((it) => (
                <div key={it.label} className="flex items-baseline justify-between gap-2">
                    <span className="text-white/50">{it.label}</span>
                    <span className="tabular-nums" style={{ color: it.color ?? '#fff' }}>
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
            <div className="kl-mono flex items-center gap-2 text-[10px] uppercase text-[var(--kl-faint)]">
                <span>{title}</span>
                <span className="h-px flex-1 bg-[var(--kl-line-2)]" />
            </div>
            {children}
        </div>
    );
}

export function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <label className="flex items-center justify-between gap-3">
            <span className="kl-mono text-[11px] text-[var(--kl-ink)]">{label}</span>
            <span className="kl-mono flex items-center gap-2 text-[11px] text-[var(--kl-dim)]">
                {value}
                <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="size-6 cursor-pointer border border-[var(--kl-line-2)] bg-transparent p-0" />
            </span>
        </label>
    );
}

/** Small status line inside a stage (loading, errors). */
export function StageNote({ children }: { children: ReactNode }) {
    return (
        <div className="kl-mono pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-2 bg-[var(--kl-black)] px-2 py-1 text-[10.5px] uppercase text-white">
            <span className="kl-dot text-[var(--kl-lime)]" />
            {children}
        </div>
    );
}
