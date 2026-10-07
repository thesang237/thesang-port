'use client';
import { useId } from 'react';
/** Small designed still plate; the explanation remains available without WebGL. */
export function FallbackPrint({ children }: { children: string }) {
    const id = useId().replaceAll(':', '');
    return (
        <div className="dl-fallback">
            <svg viewBox="0 0 320 200" role="img" aria-label="Static orbital print: a shaded moon and its elliptical ring">
                <defs>
                    <pattern id={`${id}-dots`} width="6" height="6" patternUnits="userSpaceOnUse">
                        <circle cx="3" cy="3" r="1.6" fill="currentColor" />
                    </pattern>
                </defs>
                <ellipse cx="160" cy="100" rx="135" ry="48" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle cx="160" cy="100" r="60" fill={`url(#${id}-dots)`} />
                <path d="M160 40a60 60 0 0 1 0 120a36 60 0 0 0 0-120" fill="currentColor" />
                <circle cx="238" cy="60" r="10" fill="currentColor" />
            </svg>
            <p>{children}</p>
        </div>
    );
}
