'use client';
import { useId } from 'react';

import type { Dial } from './settings';

export function RangeControl({ dial, value, onChange }: { dial: Omit<Dial, 'key'>; value: number; onChange: (value: number) => void }) {
    const id = useId();
    return (
        <div className="print-control">
            <label htmlFor={id}>
                <span id={`${id}-label`}>{dial.label}</span>
                <output htmlFor={id}>{Number(value.toFixed(3))}</output>
            </label>
            <input
                id={id}
                aria-labelledby={`${id}-label`}
                type="range"
                min={dial.min}
                max={dial.max}
                step={dial.step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                aria-describedby={`${id}-help`}
            />
            <small id={`${id}-help`}>{dial.help}</small>
        </div>
    );
}
export function SelectControl({
    label,
    value,
    options,
    onChange,
    help,
}: {
    label: string;
    value: string | number;
    options: readonly { value: string | number; label: string }[];
    onChange: (value: string) => void;
    help?: string;
}) {
    const id = useId();
    return (
        <div className="print-control">
            <label htmlFor={id}>{label}</label>
            <select id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-describedby={help ? `${id}-help` : undefined}>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {help && <small id={`${id}-help`}>{help}</small>}
        </div>
    );
}
export function ColorControl({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    const id = useId();
    return (
        <div className="print-control print-color">
            <label htmlFor={id}>
                {label}
                <span>{value}</span>
            </label>
            <input id={id} type="color" value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
    );
}
export function ToggleControl({ label, value, onChange, help }: { label: string; value: boolean; onChange: (value: boolean) => void; help?: string }) {
    const id = useId();
    return (
        <div className="print-control">
            <label htmlFor={id} className="print-toggle">
                <span>{label}</span>
                <input id={id} type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} aria-describedby={help ? `${id}-help` : undefined} />
            </label>
            {help && <small id={`${id}-help`}>{help}</small>}
        </div>
    );
}
