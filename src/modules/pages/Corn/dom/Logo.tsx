import { BRAND } from '../data/story';

/** Original mark for the study: a kernel outline with a sprouting line, plus the wordmark. */
export function Mark({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 40 28" fill="none" aria-hidden>
            <path d="M6 3.5h28a3 3 0 0 1 2.8 4.1l-6.3 16.2a3 3 0 0 1-2.8 1.9H12.3a3 3 0 0 1-2.8-1.9L3.2 7.6A3 3 0 0 1 6 3.5Z" stroke="currentColor" strokeWidth="2" />
            <path
                d="M20 21.5c0-5 0-8.5 0-11.5M20 15c-3.6 0-6-2.2-6-5.4 3.4 0 6 2 6 5.4Zm0-1.6c3.2 0 5.4-2 5.4-4.9-3 0-5.4 1.9-5.4 4.9Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export default function Logo({ outline = false }: { outline?: boolean }) {
    return (
        <span className={`corn-logo${outline ? ' is-outline' : ''}`}>
            <Mark className="corn-logo__mark" />
            <span className="corn-logo__word">{BRAND}</span>
        </span>
    );
}
