'use client';

import { type CSSProperties, type Ref, useImperativeHandle, useRef } from 'react';

import { gsap } from './gsap';

export type RollingTextHandle = { enter: () => void; leave: () => void };

type Props = {
    text: string;
    className?: string;
    /** colour of the incoming (rolled-in) copy */
    hoverColor?: string;
    /** roll on hover of this element itself (default) — set false to drive via ref */
    self?: boolean;
    stagger?: number;
    duration?: number;
    ref?: Ref<RollingTextHandle>;
};

/**
 * Per-character roll: every glyph has a duplicate underneath; on enter the column slides up
 * (stagger left→right) revealing the duplicate, on leave it slides back.
 */
export default function RollingText({ text, className, hoverColor, self = true, stagger = 0.018, duration = 0.42, ref }: Props) {
    const root = useRef<HTMLSpanElement>(null);

    const run = (to: number) => {
        const chars = root.current?.querySelectorAll<HTMLElement>('.rt-col');
        if (!chars?.length) return;
        gsap.to(chars, { yPercent: to, duration, ease: 'power3.inOut', stagger, overwrite: true });
    };

    useImperativeHandle(ref, () => ({ enter: () => run(-100), leave: () => run(0) }));

    return (
        <span
            ref={root}
            className={`rt${className ? ` ${className}` : ''}`}
            aria-label={text}
            style={hoverColor ? ({ '--rt-hover': hoverColor } as CSSProperties) : undefined}
            onMouseEnter={self ? () => run(-100) : undefined}
            onMouseLeave={self ? () => run(0) : undefined}
        >
            {Array.from(text).map((ch, i) => (
                <span key={i} className="rt-char" aria-hidden="true">
                    <span className="rt-col">
                        <span className="rt-a">{ch === ' ' ? ' ' : ch}</span>
                        <span className="rt-b">{ch === ' ' ? ' ' : ch}</span>
                    </span>
                </span>
            ))}
        </span>
    );
}
