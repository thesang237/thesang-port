/** Inline SVG icons for /kpr (redrawn; no reference files). All use currentColor. */
import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;

/** Small crosshair mark used on the left rail (filled, crisp at 40px). */
export function KeeperMark(props: P) {
    return (
        <svg viewBox="0 0 40 80" fill="currentColor" {...props}>
            <rect x="18.5" y="0" width="3" height="80" rx="1.5" />
            <rect x="0" y="38.5" width="40" height="3" rx="1.5" />
            <rect x="13" y="30" width="14" height="20" rx="3" fill="none" stroke="currentColor" strokeWidth="3" />
        </svg>
    );
}

export function Burger(props: P) {
    return (
        <svg viewBox="0 0 27 10" fill="none" stroke="currentColor" strokeWidth="1.3" {...props}>
            <path d="M0 1 H27 M0 9 H27" />
        </svg>
    );
}

export function Close(props: P) {
    return (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
            <path d="M1 1 L15 15 M15 1 L1 15" />
        </svg>
    );
}

export function Chevron(props: P) {
    return (
        <svg viewBox="0 0 14 8" fill="none" stroke="currentColor" strokeWidth="1.3" {...props}>
            <path d="M1 1 L7 7 L13 1" />
        </svg>
    );
}

export function Console(props: P) {
    return (
        <svg viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="1.4" {...props}>
            <rect x="0.7" y="0.7" width="16.6" height="12.6" rx="1.5" />
            <path d="M4 5 L6.5 7 L4 9 M8.5 9.5 H13" />
        </svg>
    );
}

/** The trailer button from the reference: a hairline ring with a small rounded outline triangle. */
export function Play(props: P) {
    return (
        <svg viewBox="0 0 61.2 61.2" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.99" overflow="visible" {...props}>
            <circle cx="30.6" cy="30.6" r="30.11" />
            <path d="M27.64,32.45v-5.1a1.09,1.09,0,0,1,1.81-.64l4.73,4.06a.82.82,0,0,1,0,1.32L29.32,35.7A1,1,0,0,1,27.64,35h0" transform="translate(0 -0.48)" />
        </svg>
    );
}

export function Triangles(props: P) {
    return (
        <svg viewBox="0 0 30 10" fill="currentColor" {...props}>
            <path d="M0 0 L8 5 L0 10 Z M11 0 L19 5 L11 10 Z M22 0 L30 5 L22 10 Z" />
        </svg>
    );
}

export function ArrowDown(props: P) {
    return (
        <svg viewBox="0 0 12 14" fill="none" stroke="currentColor" strokeWidth="1.3" {...props}>
            <path d="M6 0 V13 M1 8 L6 13 L11 8" />
        </svg>
    );
}

export function DoubleArrow(props: P) {
    return (
        <svg viewBox="0 0 22 10" fill="currentColor" {...props}>
            <path d="M0 0 L9 5 L0 10 Z M11 0 L20 5 L11 10 Z" />
        </svg>
    );
}

export function External(props: P) {
    return (
        <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" {...props}>
            <path d="M2 8 L8 2 M3 2 H8 V7" />
        </svg>
    );
}

export function Download(props: P) {
    return (
        <svg viewBox="0 0 10 12" fill="none" stroke="currentColor" strokeWidth="1.2" {...props}>
            <path d="M5 0 V8 M1.5 4.5 L5 8 L8.5 4.5 M0 11.3 H10" />
        </svg>
    );
}

export function Marketplace(props: P) {
    return (
        <svg viewBox="0 0 18 14" fill="currentColor" {...props}>
            <path d="M8 0 L8 9 L2 9 Z M9.5 2 L9.5 9 L14 9 Z M0 10.5 H18 L16 13.5 H2 Z" />
        </svg>
    );
}

/** Vertical measurement ruler drawn behind the crystal video. */
export function Measure(props: P) {
    const ticks = Array.from({ length: 41 }, (_, i) => i);
    return (
        <svg viewBox="0 0 220 400" fill="none" stroke="currentColor" strokeWidth="1" {...props}>
            {ticks.map((i) => (
                <path key={i} d={`M${i % 5 === 0 ? 196 : 206} ${i * 10} H216`} opacity={i % 5 === 0 ? 0.9 : 0.5} />
            ))}
            <path d="M216 0 V400" opacity="0.5" />
            <path d="M0 200 H120" strokeDasharray="2 4" opacity="0.5" />
        </svg>
    );
}

/** Blocky stencil "KPR" wordmark (redrawn as three chunky letters with stencil gaps and chamfers). */
export function KprLogo(props: P) {
    return (
        <svg viewBox="0 0 1100 300" fill="currentColor" {...props}>
            {/* K */}
            <path d="M0 18 L18 0 H112 V300 H18 L0 282 Z" />
            <path d="M136 150 L246 0 H346 L236 150 Z" />
            <path d="M136 150 H236 L346 300 H246 Z" />
            {/* P */}
            <path d="M376 18 L394 0 H488 V300 H394 L376 282 Z" />
            <path fillRule="evenodd" d="M512 0 H650 Q712 0 712 62 V140 Q712 202 650 202 H512 Z M576 64 V138 H636 Q648 138 648 126 V76 Q648 64 636 64 Z" />
            {/* R */}
            <path d="M742 18 L760 0 H854 V300 H760 L742 282 Z" />
            <path fillRule="evenodd" d="M878 0 H1016 Q1078 0 1078 62 V140 Q1078 202 1016 202 H878 Z M942 64 V138 H1002 Q1014 138 1014 126 V76 Q1014 64 1002 64 Z" />
            <path d="M920 218 H1012 L1100 300 H1006 Z" />
        </svg>
    );
}
