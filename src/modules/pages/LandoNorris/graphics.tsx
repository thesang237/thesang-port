// Original hand-drawn SVG graphics for the clone (monogram, glyph mask, icons, emblem, maps).
import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;

/**
 * Slanted open "4" traced from the reference mask (units of stroke width W = 20): left stem, right stem
 * starting 1W lower, bar 1W thick, short lower stem, rounded bottom-left, skew −13.5°.
 * Growth origin (screen centre) sits inside the bar at (1.57W, 3.31W).
 */
export const FOUR_PATH = 'M0 0H20V57.6H40V20H60V97H40V78H4Q0 78 0 74Z';
export const FOUR_BOX = { w: 60, h: 97, skew: -13.5, origin: [31.4, 66.2] as [number, number] };

/** "EM" monogram in a 46×46 box. Top bar of the E is a separate group (it loops in the loader). */
export function Monogram({ loopRef, ...props }: P & { loopRef?: React.Ref<SVGGElement> }) {
    return (
        <svg viewBox="0 0 46 46" fill="currentColor" aria-hidden="true" {...props}>
            <g transform="skewX(-10) translate(5 0)">
                <path d="M2 5H9V41H2Z" />
                <g ref={loopRef} className="mono-top">
                    <path d="M2 5H19V11.5H2Z" />
                </g>
                <path d="M2 20H16V26H2Z" />
                <path d="M2 34.5H19V41H2Z" />
                <path d="M23 41V5H30L33.5 18L37 5H44V41H37.5V20.5L35.4 29H31.6L29.5 20.5V41Z" />
            </g>
        </svg>
    );
}

export function BagIcon(props: P) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
            <path d="M8.5 8.5V7a3.5 3.5 0 0 1 7 0v1.5" />
            <path d="M5.2 8.5h13.6l1.2 11.2a1.2 1.2 0 0 1-1.2 1.3H5.2A1.2 1.2 0 0 1 4 19.7Z" />
        </svg>
    );
}

/** curved "go" arrow used in buttons (hook up-right) */
export function HookArrow(props: P) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
            <path d="M6 17.5c0-4 2.4-6.5 6.5-6.5H18" />
            <path d="M14.5 7.5 18 11l-3.5 3.5" />
        </svg>
    );
}

/** return arrow ↲ (on-track button) */
export function ReturnArrow(props: P) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
            <path d="M17 6.5v3a3.5 3.5 0 0 1-3.5 3.5H7" />
            <path d="M10 9.5 6.5 13l3.5 3.5" />
        </svg>
    );
}

/** open "C" loop (off-track button) */
export function LoopArrow(props: P) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
            <path d="M16.5 8.5H11a3.5 3.5 0 0 0 0 7h5.5" />
        </svg>
    );
}

/** laurel wreath around a wireframe helmet (line art, 100×56) */
export function Emblem({ leaf = 'currentColor', ...props }: P & { leaf?: string }) {
    // leaves follow an elliptical arc on each side of the helmet, tangent-aligned (values rounded for SSR)
    const leaves = (side: 1 | -1) =>
        Array.from({ length: 6 }, (_, i) => {
            const deg = -58 + (i / 5) * 118;
            const a = (deg * Math.PI) / 180;
            const cx = +(50 + side * Math.cos(a) * 40).toFixed(2);
            const cy = +(31 - Math.sin(a) * 24).toFixed(2);
            const rot = +(side * -(deg + 90) + 25 * side).toFixed(1);
            return <ellipse key={`${side}-${i}`} cx={cx} cy={cy} rx={2.3} ry={5.4} transform={`rotate(${rot} ${cx} ${cy})`} fill={leaf} stroke="none" />;
        });
    return (
        <svg viewBox="0 0 100 58" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true" {...props}>
            <path d="M14 50C8 40 7 26 13 14M86 50C92 40 93 26 87 14" strokeWidth={1.3} />
            {leaves(1)}
            {leaves(-1)}
            <path d="M34 38c0-13 7-21 16-21s16 8 16 21c0 5-3 8-8 8H42c-5 0-8-3-8-8Z" />
            <path d="M35.5 30h29M36.5 24h27M50 17v29M43 18.5c-2 6-2.5 13-2 27.5M57 18.5c2 6 2.5 13 2 27.5" strokeWidth={1} />
            <path d="M37 33.5h26v5.5H37Z" fill="currentColor" />
        </svg>
    );
}

export function MenuBars(props: P) {
    return (
        <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" aria-hidden="true" {...props}>
            <path className="mb-top" d="M19 15.5h9.5" />
            <path className="mb-bot" d="M11.5 25h9.5" />
        </svg>
    );
}

/** generic circuit outline (single stroke) */
export function TrackMap({ variant = 0, ...props }: P & { variant?: 0 | 1 | 2 }) {
    const d = [
        'M6 30c6-2 9 1 14-1l16-6c5-2 7 2 12 1l14-5c4-1 6 3 3 5l-9 5c-3 2-1 5 2 5l8-1c3 0 4 3 1 4L18 45c-6 2-12 0-12-5Z',
        'M8 12c10-4 20 4 30 2s14-10 22-6 2 12-6 14-18 4-16 12 18 4 20 10-10 10-22 6S6 30 8 12Z',
        'M10 40 30 10l14 6 10-4 12 10-8 8 6 10-20 2-8-8-10 10Z',
    ][variant];
    return (
        <svg viewBox="0 0 80 50" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" aria-hidden="true" {...props}>
            <path d={d} />
        </svg>
    );
}

export function CheckerFlag(props: P) {
    return (
        <svg viewBox="0 0 36 24" aria-hidden="true" {...props}>
            <path d="M4 4c8-3 12 3 20 0l6-1v14l-6 1c-8 3-12-3-20 0Z" fill="none" stroke="currentColor" strokeWidth={1.2} />
            {Array.from({ length: 4 }).map((_, r) =>
                Array.from({ length: 6 }).map((__, c) => ((r + c) % 2 ? <rect key={`${r}${c}`} x={5 + c * 4} y={4.5 + r * 3.4} width={4} height={3.4} fill="currentColor" opacity={0.75} /> : null)),
            )}
        </svg>
    );
}

export function UKFlag(props: P) {
    return (
        <svg viewBox="0 0 60 36" aria-hidden="true" {...props}>
            <rect width="60" height="36" fill="#1f3a8a" />
            <path d="M0 0l60 36M60 0 0 36" stroke="#fff" strokeWidth="7" />
            <path d="M0 0l60 36M60 0 0 36" stroke="#c8102e" strokeWidth="2.5" />
            <path d="M30 0v36M0 18h60" stroke="#fff" strokeWidth="11" />
            <path d="M30 0v36M0 18h60" stroke="#c8102e" strokeWidth="6" />
        </svg>
    );
}
