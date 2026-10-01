import type { EaseName } from './eases';

export type SeqEase = EaseName | 'out-quad' | 'none';

/** One tween: the single source of truth for both the bar chart and the real GSAP timeline in the sequence demo. */
export type Tween = { key: string; label: string; prop: 'opacity' | 'yPercent'; from: number; to: number; at: number; dur: number; ease: SeqEase; note?: string };

export type Sequence = { id: string; label: string; total: number; show: string[]; tweens: Tween[]; markers?: { at: number; text: string }[]; blurb: string };

/** The page's overlay and transition sequences (durations, delays and curves from its interaction data). */
export const SEQUENCES: Sequence[] = [
    {
        id: 'gallery-open',
        label: 'Gallery opens',
        total: 1.8,
        show: ['blur', 'panel', 'content'],
        blurb: 'Click [Gallery]: the page behind blurs and darkens, the photo panel rises from 10% below, and the header text fades in last. Smooth scroll is stopped while it is open.',
        tweens: [
            { key: 'blur', label: 'blurred backdrop', prop: 'opacity', from: 0, to: 1, at: 0, dur: 1.2, ease: 'in-out-quart' },
            { key: 'panel', label: 'photo panel rises', prop: 'yPercent', from: 10, to: 0, at: 0.3, dur: 1, ease: 'in-out-cubic' },
            { key: 'content', label: 'header + counter fade', prop: 'opacity', from: 0, to: 1, at: 0.4, dur: 1.4, ease: 'out-quad' },
        ],
    },
    {
        id: 'gallery-close',
        label: 'Gallery closes',
        total: 1.8,
        show: ['blur', 'panel', 'content'],
        blurb: 'Not the opening played backwards: the text leaves first and fast, the panel waits 0.7s, then everything is hidden at 1.0s.',
        markers: [{ at: 1.0, text: 'display: none' }],
        tweens: [
            { key: 'content', label: 'header + counter fade', prop: 'opacity', from: 1, to: 0, at: 0, dur: 0.4, ease: 'out-quad' },
            { key: 'blur', label: 'backdrop clears', prop: 'opacity', from: 1, to: 0, at: 0, dur: 1.2, ease: 'in-out-quart' },
            { key: 'panel', label: 'panel drops', prop: 'yPercent', from: 0, to: 10, at: 0.7, dur: 1, ease: 'in-out-cubic' },
        ],
    },
    {
        id: 'page-wipe',
        label: 'Page wipe',
        total: 2,
        show: ['sheet'],
        blurb: 'A black sheet rises over the page, the page resets while it is hidden, then the sheet leaves through the top. Old content is fully gone before the new appears.',
        markers: [{ at: 0.7, text: 'page resets while hidden' }],
        tweens: [
            { key: 'sheet', label: 'sheet covers', prop: 'yPercent', from: 100, to: 0, at: 0, dur: 0.7, ease: 'in-out-quart' },
            { key: 'sheet', label: 'sheet leaves (up)', prop: 'yPercent', from: 0, to: -100, at: 0.85, dur: 0.9, ease: 'in-out-cubic', note: 'a 0.15s hold on black first' },
        ],
    },
    {
        id: 'phone-menu',
        label: 'Phone menu opens',
        total: 1.6,
        show: ['menu'],
        blurb: 'A dark sheet drops in from the top while the three big words rise from masks one after another; the close label, description and credit fade in after.',
        tweens: [
            { key: 'menubg', label: 'dark sheet drops', prop: 'yPercent', from: -100, to: 0, at: 0, dur: 0.5, ease: 'in-out-cubic' },
            { key: 'word0', label: 'word 1 rises', prop: 'yPercent', from: 120, to: 0, at: 0, dur: 1, ease: 'in-out-cubic' },
            { key: 'word1', label: 'word 2 rises', prop: 'yPercent', from: 120, to: 0, at: 0.1, dur: 1, ease: 'in-out-cubic' },
            { key: 'word2', label: 'word 3 rises', prop: 'yPercent', from: 120, to: 0, at: 0.2, dur: 1, ease: 'in-out-cubic' },
            { key: 'close', label: '“Close” fades in', prop: 'opacity', from: 0, to: 1, at: 0.3, dur: 0.3, ease: 'none' },
            { key: 'desc', label: 'description fades in', prop: 'opacity', from: 0, to: 1, at: 0.5, dur: 0.3, ease: 'none' },
            { key: 'credit', label: 'credit fades in', prop: 'opacity', from: 0, to: 1, at: 0.7, dur: 0.3, ease: 'none' },
        ],
    },
    {
        id: 'header',
        label: 'Pinned header',
        total: 0.8,
        show: ['nav'],
        blurb: 'After the hero, a compact header slides down from above (0.5s, out-cubic). On the way out it is quicker and has no curve (0.3s): leaving should never make you wait.',
        tweens: [{ key: 'nav', label: 'header slides in', prop: 'yPercent', from: -110, to: 0, at: 0, dur: 0.5, ease: 'out-cubic' }],
    },
];
