import { type ReactNode, type RefObject, useId } from 'react';

export function Demo({
    title,
    hint,
    children,
    controls,
    onReset,
    stageRef,
    className = '',
}: {
    title: string;
    hint: string;
    children: ReactNode;
    controls: ReactNode;
    onReset: () => void;
    stageRef?: RefObject<HTMLDivElement | null>;
    className?: string;
}) {
    return (
        <div className={`fl-demo ${className}`}>
            <div className="fl-demo-heading">
                <div>
                    <span className="fl-label">LIVE STUDY</span>
                    <h3>{title}</h3>
                    <p>{hint}</p>
                </div>
                <button onClick={onReset} className="fl-button fl-reset">
                    Reset ↺
                </button>
            </div>
            <div className="fl-demo-body">
                <div ref={stageRef} className="fl-stage" data-lenis-prevent>
                    {children}
                </div>
                <div className="fl-controls">{controls}</div>
            </div>
        </div>
    );
}
export function Slider({
    label,
    value,
    min,
    max,
    step = 1,
    unit = '',
    help,
    onChange,
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    help: string;
    onChange: (value: number) => void;
}) {
    const id = useId();
    return (
        <div className="fl-control">
            <label htmlFor={id}>
                {label}
                <output>
                    {Number(value.toFixed(3))}
                    {unit}
                </output>
            </label>
            <input id={id} type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} aria-describedby={`${id}-help`} />
            <p id={`${id}-help`}>{help}</p>
        </div>
    );
}
export function Select({ label, value, choices, onChange, help }: { label: string; value: string; choices: [string, string][]; onChange: (value: string) => void; help: string }) {
    const id = useId();
    return (
        <div className="fl-control">
            <label htmlFor={id}>{label}</label>
            <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
                {choices.map(([key, text]) => (
                    <option key={key} value={key}>
                        {text}
                    </option>
                ))}
            </select>
            <p>{help}</p>
        </div>
    );
}
export function Toggle({ label, checked, onChange, help }: { label: string; checked: boolean; onChange: (value: boolean) => void; help: string }) {
    return (
        <div className="fl-control">
            <label className="fl-toggle">
                <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
                {label}
            </label>
            <p>{help}</p>
        </div>
    );
}
export function Readout({ children }: { children: ReactNode }) {
    return <output className="fl-readout">{children}</output>;
}
