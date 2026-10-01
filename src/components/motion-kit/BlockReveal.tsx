'use client';

import { type ReactNode, type Ref, type RefObject, useImperativeHandle, useRef } from 'react';

import { gsap, ScrollTrigger, SplitText, useGSAP } from './gsap';

export type BlockRevealHandle = {
    play: (delay?: number) => gsap.core.Timeline | undefined;
    reverse: () => gsap.core.Timeline | undefined;
    reset: () => void;
};

type Props = {
    as?: 'div' | 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'figcaption';
    children: ReactNode;
    className?: string;
    /** block colour (css value) */
    color?: string;
    /** 'scroll' = play once when entering viewport, 'mount' = play on mount, 'manual' = via ref */
    trigger?: 'scroll' | 'mount' | 'manual';
    delay?: number;
    stagger?: number;
    /** ScrollTrigger start */
    start?: string;
    /** split lines (default) or treat element as one block */
    split?: boolean;
    /** with trigger='scroll': give every line its own ScrollTrigger (lines reveal as they enter) */
    perLine?: boolean;
    ref?: Ref<BlockRevealHandle>;
};

// measured in the reference: block grows in ~7 frames, holds ~2, retracts in ~9 (30 fps)
const GROW = 0.24;
const HOLD = 0.05;
const RETRACT = 0.3;

/**
 * Text reveal: a solid block wipes across each line (scaleX from the left), the text appears
 * underneath, then the block retracts toward the right.
 */
export default function BlockReveal({
    as: Tag = 'div',
    children,
    className,
    color = 'var(--ln-lime)',
    trigger = 'scroll',
    delay = 0,
    stagger = 0.06,
    start = 'top 92%',
    split = true,
    perLine = false,
    ref,
}: Props) {
    const root = useRef<HTMLElement>(null);
    const state = useRef<{ lines: HTMLElement[]; blocks: HTMLElement[]; tl?: gsap.core.Timeline }>({ lines: [], blocks: [] });

    const lineTl = (line: HTMLElement, block: HTMLElement, at: number, tl: gsap.core.Timeline) =>
        tl
            .set(line, { '--br-text': 0 }, at)
            .fromTo(block, { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: GROW, ease: 'power2.inOut' }, at)
            .set(line, { '--br-text': 1 }, at + GROW)
            .set(block, { transformOrigin: '100% 50%' }, at + GROW + HOLD)
            .to(block, { scaleX: 0, duration: RETRACT, ease: 'power2.inOut' }, at + GROW + HOLD);

    const build = (d = 0) => {
        const { lines, blocks } = state.current;
        state.current.tl?.kill();
        const tl = gsap.timeline({ delay: d });
        lines.forEach((line, i) => {
            lineTl(line, blocks[i], i * stagger, tl);
        });
        state.current.tl = tl;
        return tl;
    };

    useImperativeHandle(ref, () => ({
        play: (d = 0) => build(d),
        reverse: () => {
            const { lines, blocks } = state.current;
            state.current.tl?.kill();
            const tl = gsap.timeline();
            lines.forEach((line, i) => {
                const at = i * stagger * 0.5;
                tl.set(blocks[i], { transformOrigin: '100% 50%' }, at)
                    .to(blocks[i], { scaleX: 1, duration: GROW * 0.8, ease: 'power2.inOut' }, at)
                    .set(line, { '--br-text': 0 }, at + GROW * 0.8)
                    .set(blocks[i], { transformOrigin: '0% 50%' }, at + GROW * 0.8)
                    .to(blocks[i], { scaleX: 0, duration: RETRACT * 0.7, ease: 'power2.inOut' }, at + GROW * 0.8);
            });
            state.current.tl = tl;
            return tl;
        },
        reset: () => {
            state.current.tl?.kill();
            gsap.set(state.current.lines, { '--br-text': 0 });
            gsap.set(state.current.blocks, { scaleX: 0 });
        },
    }));

    useGSAP(
        () => {
            const el = root.current;
            if (!el) return;

            // line > span.br-inner(inline-block, relative) > [span.br-text, span.br-block]
            const wrap = (targets: HTMLElement[]) => {
                const blocks: HTMLElement[] = [];
                targets.forEach((line) => {
                    const inner = document.createElement('span');
                    inner.className = 'br-inner';
                    const text = document.createElement('span');
                    text.className = 'br-text';
                    while (line.firstChild) text.appendChild(line.firstChild);
                    const block = document.createElement('span');
                    block.className = 'br-block';
                    block.setAttribute('aria-hidden', 'true');
                    block.style.background = color;
                    inner.append(text, block);
                    line.appendChild(inner);
                    blocks.push(block);
                });
                state.current = { lines: targets, blocks, tl: undefined };
            };

            let splitter: SplitText | undefined;
            if (split) {
                splitter = SplitText.create(el, {
                    type: 'lines',
                    linesClass: 'br-line',
                    autoSplit: true,
                    onSplit: (self) => {
                        wrap(self.lines as HTMLElement[]);
                        if (el.dataset.revealed === '1') gsap.set(self.lines, { '--br-text': 1 });
                    },
                });
            } else {
                const block = el.querySelector<HTMLElement>(':scope > .br-inner > .br-block');
                if (block) state.current = { lines: [el], blocks: [block], tl: undefined };
            }
            el.classList.add('br-ready');

            if (trigger === 'mount')
                build(delay).eventCallback('onComplete', () => {
                    el.dataset.revealed = '1';
                });
            if (trigger === 'scroll' && perLine) {
                state.current.lines.forEach((line, i) => {
                    ScrollTrigger.create({
                        trigger: line,
                        start,
                        once: true,
                        onEnter: () => lineTl(line, state.current.blocks[i], delay, gsap.timeline()),
                    });
                });
            } else if (trigger === 'scroll') {
                ScrollTrigger.create({
                    trigger: el,
                    start,
                    once: true,
                    onEnter: () =>
                        build(delay).eventCallback('onComplete', () => {
                            el.dataset.revealed = '1';
                        }),
                });
            }

            return () => {
                state.current.tl?.kill();
                splitter?.revert();
            };
        },
        { scope: root },
    );

    const Element = Tag as 'div';
    return (
        <Element ref={root as RefObject<HTMLDivElement>} className={`br${split ? '' : ' br-line'}${className ? ` ${className}` : ''}`}>
            {split ? (
                children
            ) : (
                <span className="br-inner">
                    <span className="br-text">{children}</span>
                    <span className="br-block" aria-hidden="true" style={{ background: color }} />
                </span>
            )}
        </Element>
    );
}
