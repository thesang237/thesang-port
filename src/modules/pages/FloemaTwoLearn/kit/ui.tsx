'use client';
import { type ReactNode, useId, useState } from 'react';
export function Term({ name, children }: { name: string; children?: ReactNode }) {
    const definitions: Record<string, string> = {
        DOM: 'The browser’s tree of real text, buttons, and layout. Think of your Figma layers, with meaning and keyboard behavior.',
        progress: 'A position expressed from 0 to 1. Think of the playhead moving across an After Effects composition.',
        scrub: 'Animation time follows scroll position in both directions. It does not play independently after a trigger.',
        damping: 'A follower closes part of the remaining distance over time, slowing naturally as it approaches its target.',
        parallax: 'Layers move at different speeds, creating a sense of distance.',
        perspective: 'Near objects appear larger than distant ones, even when their real dimensions stay fixed.',
        orthographic: 'A camera without perspective shrinkage. Parallel lines stay parallel, useful for precise alignment.',
        normal: 'A texture that changes how light appears to strike a surface without changing the silhouette.',
        DPR: 'Device pixel ratio. At DPR 2, the renderer paints four times as many pixels as DPR 1.',
        'draw call': 'One request to the GPU to draw a batch of geometry with a material.',
        disposal: 'Explicitly releasing GPU resources when a scene is no longer needed.',
        ref: 'A mutable value React can retain without re-rendering the component when it changes.',
    };
    return (
        <span className="f2l-term" tabIndex={0}>
            {children || name}
            <span role="tooltip">{definitions[name] || name}</span>
        </span>
    );
}
export function Section({ id, n, title, children, remember }: { id: string; n: string; title: string; children: ReactNode; remember: string }) {
    return (
        <section className="f2l-section" id={id}>
            <header>
                <span className="f2l-eyebrow">{n}</span>
                <h3 data-toc={id}>{title}</h3>
            </header>
            {children}
            <p className="f2l-remember">
                <span>REMEMBER</span>
                {remember}
            </p>
        </section>
    );
}
export function Lens({ children }: { children: ReactNode }) {
    return (
        <aside className="f2l-lens">
            <span className="f2l-eyebrow">DESIGNER LENS</span>
            <p>{children}</p>
        </aside>
    );
}
export function Code({ code, file, lines = [] }: { code: string; file: string; lines?: number[] }) {
    const [copied, setCopied] = useState(false);
    return (
        <figure className="f2l-code">
            <figcaption>
                <span>{file}</span>
                <button
                    onClick={async () => {
                        try {
                            await navigator.clipboard.writeText(code);
                            setCopied(true);
                        } catch {
                            setCopied(false);
                        }
                    }}
                >
                    {copied ? 'Copied ✓' : 'Copy code'}
                </button>
            </figcaption>
            <pre>
                <code>
                    {code.split('\n').map((line, index) => (
                        <span className={lines.includes(index + 1) ? 'is-key' : ''} key={index}>
                            <i aria-hidden="true">{String(index + 1).padStart(2, '0')}</i>
                            {line || ' '}
                        </span>
                    ))}
                </code>
            </pre>
        </figure>
    );
}
export function Demo({ title, hint, children, controls, reset, tryThis }: { title: string; hint: string; children: ReactNode; controls: ReactNode; reset: () => void; tryThis: string }) {
    return (
        <div className="f2l-demo">
            <header>
                <div>
                    <span className="f2l-eyebrow">LIVE LAB</span>
                    <h4>{title}</h4>
                    <p>{hint}</p>
                </div>
                <button className="f2l-button f2l-quiet" onClick={reset}>
                    Reset ↺
                </button>
            </header>
            <div className="f2l-demo-body">
                <div className="f2l-demo-stage">{children}</div>
                <div className="f2l-controls">{controls}</div>
            </div>
            <p className="f2l-try">
                <strong>Break it on purpose →</strong> {tryThis}
            </p>
        </div>
    );
}
export function Slider({
    label,
    value,
    min,
    max,
    step = 1,
    onChange,
    help,
    suffix = '',
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (value: number) => void;
    help: string;
    suffix?: string;
}) {
    const id = useId();
    return (
        <label className="f2l-slider" htmlFor={id}>
            <span>
                {label}
                <output>
                    {Number(value.toFixed(3))}
                    {suffix}
                </output>
            </span>
            <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-describedby={`${id}-help`} />
            <small id={`${id}-help`}>{help}</small>
        </label>
    );
}
export function Toggle({ label, checked, onChange, help }: { label: string; checked: boolean; onChange: (v: boolean) => void; help: string }) {
    return (
        <label className="f2l-toggle">
            <span>
                <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
                {label}
            </span>
            <small>{help}</small>
        </label>
    );
}
export function Readout({ children }: { children: ReactNode }) {
    return <div className="f2l-readout">{children}</div>;
}
export function Flashcards({ cards }: { cards: { q: string; a: string }[] }) {
    const [open, setOpen] = useState<number[]>([]);
    return (
        <section className="f2l-flashcards">
            <div className="f2l-section-top">
                <div>
                    <span className="f2l-eyebrow">RETRIEVAL PRACTICE</span>
                    <h3>Make it stick.</h3>
                </div>
                <span>
                    {open.length} / {cards.length} revealed
                </span>
            </div>
            <div className="f2l-card-grid">
                {cards.map((card, i) => (
                    <button
                        key={card.q}
                        className={`f2l-flashcard ${open.includes(i) ? 'is-open' : ''}`}
                        aria-expanded={open.includes(i)}
                        onClick={() => setOpen((old) => (old.includes(i) ? old.filter((n) => n !== i) : [...old, i]))}
                    >
                        <span className="f2l-eyebrow">
                            0{i + 1} / {open.includes(i) ? 'THE ANSWER' : 'RECALL'}
                        </span>
                        <strong>{card.q}</strong>
                        {open.includes(i) ? <p>{card.a}</p> : <span className="f2l-card-prompt">Think first. Then reveal ↗</span>}
                    </button>
                ))}
            </div>
        </section>
    );
}
export function Landscape({ variant = 0 }: { variant?: number }) {
    return (
        <svg className="f2l-landscape" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <rect width="600" height="400" fill={['#b6c8c0', '#829b90', '#baaf91', '#93acb5', '#c5beb4'][variant % 5]} />
            <circle cx={420 - variant * 40} cy="95" r="48" fill="#e7e5d6" />
            <path d="M0 275 170 100 315 260 420 160 600 280V400H0Z" fill="#49615c" />
            <path d="M0 320 210 230 350 340 520 225 600 270V400H0Z" fill="#263e39" />
            <path d="M140 350h310M175 315h210M195 290h170" stroke="#becfb9" strokeWidth="10" />
            <path d="M190 350v40M400 350v40" stroke="#becfb9" strokeWidth="12" />
        </svg>
    );
}
