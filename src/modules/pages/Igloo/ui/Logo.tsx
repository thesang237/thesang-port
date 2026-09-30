/** Chunky rounded IGLOO wordmark drawn with strokes. */
export default function Logo({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 146 40" className={className} fill="none" stroke="currentColor" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" aria-label="Igloo">
            <path className="ig-logo-stroke" d="M6 9 V31" />
            <path className="ig-logo-stroke" d="M41 12.5 A12 12 0 1 0 43 25 H33" />
            <path className="ig-logo-stroke" d="M55 9 V31 H70" />
            <circle className="ig-logo-stroke" cx="90" cy="20" r="11" />
            <circle className="ig-logo-stroke" cx="124" cy="20" r="11" />
        </svg>
    );
}
