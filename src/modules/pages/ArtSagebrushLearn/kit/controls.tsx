import { type ReactNode, useId } from 'react';

export function Slider({
    label,
    help,
    value,
    min,
    max,
    step = 1,
    onChange,
}: {
    label: string;
    help: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (value: number) => void;
}) {
    const id = useId();
    return (
        <div className="sg-control">
            <label htmlFor={id}>
                <span>{label}</span>
                <output>{Number(value.toFixed(3))}</output>
            </label>
            <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} aria-describedby={`${id}-help`} />
            <p id={`${id}-help`}>{help}</p>
        </div>
    );
}
export function Demo({ title, hint, children, controls, onReset }: { title: string; hint: string; children: ReactNode; controls: ReactNode; onReset: () => void }) {
    return (
        <div className="sg-demo">
            <header>
                <div>
                    <span className="sg-label">Live study</span>
                    <h3>{title}</h3>
                    <p>{hint}</p>
                </div>
                <button type="button" onClick={onReset}>
                    Reset
                </button>
            </header>
            <div className="sg-demo-body">
                <div className="sg-stage">{children}</div>
                <div className="sg-controls">{controls}</div>
            </div>
        </div>
    );
}
