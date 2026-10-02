'use client';

import { type CSSProperties, Fragment, type ReactNode } from 'react';

import { gsap } from '@/components/motion-kit/gsap';

/**
 * Text pieces. Every animated copy is aria-hidden and paired with a visually hidden real sentence,
 * so screen readers read the text once, as normal text (web-motion rule 11).
 */

type LinesProps = { lines: readonly string[]; className?: string; as?: 'h1' | 'h2' | 'h3' | 'p'; d?: number; indent?: boolean; style?: CSSProperties; children?: ReactNode };

/** Masked line rise. `indent` leaves the first line's start free for a caption (as in the reference). */
export function Lines({ lines, className = '', as: Tag = 'h2', d = 0, indent, style, children }: LinesProps) {
    return (
        <Tag className={`kpr-lines ${indent ? 'is-indent' : ''} ${className}`} data-r="lines" data-d={d} style={style}>
            {children}
            <span className="kpr-sr">{lines.join(' ')}</span>
            <span aria-hidden="true" className="kpr-lines__vis">
                {lines.map((l, i) => (
                    <span className="kpr-line" key={i}>
                        <span>{l}</span>
                    </span>
                ))}
            </span>
        </Tag>
    );
}

/** Dot caption with a per-character type-on. `\n` breaks lines. */
export function Caption({ text, className = '', d = 0, dot = true }: { text: string; className?: string; d?: number; dot?: boolean }) {
    return (
        <div className={`kpr-cap ${className}`} data-r="chars" data-d={d}>
            {dot && <i className="kpr-dot" aria-hidden="true" />}
            <span className="kpr-sr">{text.replace(/\n/g, ' ')}</span>
            <span aria-hidden="true" className="kpr-cap__text">
                {text.split('\n').map((line, li) => (
                    <Fragment key={li}>
                        {li > 0 && <br />}
                        {[...line].map((ch, i) => (
                            <span className="kpr-ch" key={i}>
                                {ch === ' ' ? ' ' : ch}
                            </span>
                        ))}
                    </Fragment>
                ))}
            </span>
        </div>
    );
}

/** Decode text: a hidden spacer keeps the real width, the visible copy scrambles into place. */
export function Hacky({ text, className = '', d = 0, reveal = true }: { text: string; className?: string; d?: number; reveal?: boolean }) {
    return (
        <span className={`kpr-hacky ${className}`} data-r={reveal ? 'hacky' : undefined} data-d={d}>
            <span className="kpr-hacky__spacer">{text}</span>
            <span className="kpr-hacky__anim" aria-hidden="true">
                {text}
            </span>
        </span>
    );
}

const GLYPHS = '!<>-_\\/[]{}—=+*^?#01ABCDEFGHKLMNPRSTXZ';

/** scramble/decode `el`'s `.kpr-hacky__anim` text into its spacer text over `dur` seconds */
export function scrambleTween(el: HTMLElement, dur = 0.8) {
    const anim = el.querySelector<HTMLElement>('.kpr-hacky__anim') ?? el;
    const spacer = el.querySelector<HTMLElement>('.kpr-hacky__spacer');
    const final = (spacer?.textContent ?? anim.textContent ?? '').toUpperCase();
    const order = [...final].map(() => Math.random());
    const state = { p: 0 };
    return gsap.to(state, {
        p: 1,
        duration: dur,
        ease: 'none',
        onUpdate: () => {
            let out = '';
            for (let i = 0; i < final.length; i++) {
                const ch = final[i];
                if (ch === ' ' || ch === '\n') out += ch;
                else if (state.p * 1.35 > order[i] * 0.85 + (i / final.length) * 0.5) out += ch;
                else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
            }
            anim.textContent = out;
        },
        onComplete: () => {
            anim.textContent = final;
        },
    });
}

export function scrambleInto(el: HTMLElement, tl: gsap.core.Timeline, at: number) {
    tl.add(() => {
        scrambleTween(el, 0.9);
    }, at);
}

/** Hairline that draws in (data-r hline / vline). */
export function Hair({ dir = 'h', className = '', d = 0, style }: { dir?: 'h' | 'v'; className?: string; d?: number; style?: CSSProperties }) {
    return <i aria-hidden="true" className={`kpr-hair kpr-hair--${dir} ${className}`} data-r={dir === 'h' ? 'hline' : 'vline'} data-d={d} style={style} />;
}
