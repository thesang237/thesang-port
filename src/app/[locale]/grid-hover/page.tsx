'use client';

import { useEffect, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

gsap.registerPlugin(useGSAP);

// ─── Types ────────────────────────────────────────────────────────────────────

type BoxPos = 'a' | 'b' | 'c' | 'd';
type Effect = 1 | 2 | 3;
type Direction = 'top' | 'right' | 'bottom' | 'left';

type BoxDef = {
    pos: BoxPos;
    number?: string;
    tags?: string;
    category?: string;
};

type CardDef = {
    img?: string;
    isEmpty?: boolean;
    boxes?: BoxDef[];
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const GRID_DATA: { effect: Effect; label: string; cards: CardDef[] }[] = [
    {
        effect: 1,
        label: 'Effect\n01',
        cards: [
            {
                img: '/img/grid-hover/3.jpg',
                boxes: [
                    { pos: 'c', number: '02', tags: '#techno #rave' },
                    { pos: 'd', category: 'Pulse Club' },
                ],
            },
            { isEmpty: true },
            {
                img: '/img/grid-hover/22.jpg',
                boxes: [
                    { pos: 'a', number: '07', tags: '#house #deephouse' },
                    { pos: 'd', category: 'Stellar Lounge' },
                ],
            },
            {
                img: '/img/grid-hover/2.jpg',
                boxes: [
                    { pos: 'b', number: '09', tags: '#dubstep #bass' },
                    { pos: 'c', category: 'Bass Arena' },
                ],
            },
            { isEmpty: true },
            {
                img: '/img/grid-hover/21.jpg',
                boxes: [
                    { pos: 'b', number: '13', tags: '#trance #progressive' },
                    { pos: 'c', category: 'Euphoria Hall' },
                ],
            },
            {
                img: '/img/grid-hover/17.jpg',
                boxes: [
                    { pos: 'b', number: '17', tags: '#drumandbass #jungle' },
                    { pos: 'd', category: 'Groove Hive' },
                ],
            },
            {
                img: '/img/grid-hover/20.jpg',
                boxes: [
                    { pos: 'c', number: '19', tags: '#ambient #chillout' },
                    { pos: 'd', category: 'Tranquil Gardens' },
                ],
            },
        ],
    },
    {
        effect: 2,
        label: 'Effect\n02',
        cards: [
            {
                img: '/img/grid-hover/4.jpg',
                boxes: [
                    { pos: 'b', number: '21', tags: '#trap #bassmusic' },
                    { pos: 'c', category: 'SubBass Arena' },
                ],
            },
            { isEmpty: true },
            {
                img: '/img/grid-hover/19.jpg',
                boxes: [
                    { pos: 'a', number: '23', tags: '#hardstyle #euphoric' },
                    { pos: 'b', category: 'HyperPulse Club' },
                ],
            },
            {
                img: '/img/grid-hover/5.jpg',
                boxes: [
                    { pos: 'a', number: '26', tags: '#futurebass #melodic' },
                    { pos: 'd', category: 'SynthScape Dome' },
                ],
            },
            { isEmpty: true },
            {
                img: '/img/grid-hover/18.jpg',
                boxes: [
                    { pos: 'b', number: '30', tags: '#breakbeat #bigbeat' },
                    { pos: 'c', category: 'BeatBunker Hall' },
                ],
            },
            {
                img: '/img/grid-hover/6.jpg',
                boxes: [
                    { pos: 'b', number: '13', tags: '#trance #progressive' },
                    { pos: 'c', category: 'Euphoria Hall' },
                ],
            },
            {
                img: '/img/grid-hover/1.jpg',
                boxes: [
                    { pos: 'b', number: '17', tags: '#drumandbass #jungle' },
                    { pos: 'd', category: 'Groove Hive' },
                ],
            },
            {
                img: '/img/grid-hover/7.jpg',
                boxes: [
                    { pos: 'c', number: '19', tags: '#ambient #chillout' },
                    { pos: 'd', category: 'Tranquil Gardens' },
                ],
            },
        ],
    },
    {
        effect: 3,
        label: 'Effect\n03',
        cards: [
            {
                img: '/img/grid-hover/16.jpg',
                boxes: [
                    { pos: 'c', number: '02', tags: '#techno #rave' },
                    { pos: 'd', category: 'Pulse Club' },
                ],
            },
            { isEmpty: true },
            {
                img: '/img/grid-hover/8.jpg',
                boxes: [
                    { pos: 'a', number: '07', tags: '#house #deephouse' },
                    { pos: 'd', category: 'Stellar Lounge' },
                ],
            },
            {
                img: '/img/grid-hover/15.jpg',
                boxes: [
                    { pos: 'b', number: '09', tags: '#dubstep #bass' },
                    { pos: 'c', category: 'Bass Arena' },
                ],
            },
            { isEmpty: true },
            {
                img: '/img/grid-hover/9.jpg',
                boxes: [
                    { pos: 'b', number: '13', tags: '#trance #progressive' },
                    { pos: 'c', category: 'Euphoria Hall' },
                ],
            },
            {
                img: '/img/grid-hover/14.jpg',
                boxes: [
                    { pos: 'b', number: '17', tags: '#drumandbass #jungle' },
                    { pos: 'd', category: 'Groove Hive' },
                ],
            },
            {
                img: '/img/grid-hover/10.jpg',
                boxes: [
                    { pos: 'c', number: '19', tags: '#ambient #chillout' },
                    { pos: 'd', category: 'Tranquil Gardens' },
                ],
            },
        ],
    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Module-level mouse position for direction-aware effect 2
let mouseX = 0;
let mouseY = 0;

function getEnterDirection(el: HTMLElement): Direction {
    const { top, right, bottom, left } = el.getBoundingClientRect();
    if (mouseY <= Math.floor(top)) return 'top';
    if (mouseY >= Math.floor(bottom)) return 'bottom';
    if (mouseX <= Math.floor(left)) return 'left';
    if (mouseX >= Math.floor(right)) return 'right';
    return 'left';
}

const BOX_GRID_CLASSES: Record<BoxPos, string> = {
    a: 'col-start-1 row-start-1',
    b: 'col-start-2 row-start-1',
    c: 'col-start-1 row-start-2',
    d: 'col-start-2 row-start-2',
};

function getBoxClipPath(pos: BoxPos): string {
    if (pos === 'a' || pos === 'd') {
        return 'polygon(0 0,calc(100% - 20px) 0,100% 20px,100% 100%,20px 100%,0 calc(100% - 20px))';
    }
    return 'polygon(0 20px,20px 0,100% 0,100% calc(100% - 20px),calc(100% - 20px) 100%,0 100%)';
}

// ─── SplitChars ───────────────────────────────────────────────────────────────

function SplitChars({ text }: { text: string }) {
    return (
        <>
            {text.split('').map((char, i) => (
                <span key={i} data-char style={{ display: 'inline-block' }}>
                    {char === ' ' ? '\u00A0' : char}
                </span>
            ))}
        </>
    );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function GridCard({ effect, img, isEmpty, boxes = [] }: { effect: Effect; img?: string; isEmpty?: boolean; boxes?: BoxDef[] }) {
    const cardRef = useRef<HTMLDivElement>(null);
    const enterTl = useRef<gsap.core.Timeline | null>(null);
    const leaveTl = useRef<gsap.core.Timeline | null>(null);
    const dirRef = useRef<Direction>('left');

    useGSAP(
        (_ctx, contextSafe) => {
            if (isEmpty || !cardRef.current) return;

            const card = cardRef.current;
            const imgEl = card.querySelector<HTMLElement>('[data-card-img]')!;
            const boxEls = [...card.querySelectorAll<HTMLElement>('[data-card-box]')];
            const numberChars = [...card.querySelectorAll<HTMLElement>('[data-card-number] [data-char]')];
            const categoryChars = [...card.querySelectorAll<HTMLElement>('[data-card-category] [data-char]')];

            // Set initial img scale — runs safely inside the GSAP context
            if (effect === 2) gsap.set(imgEl, { scale: 1.3 });
            if (effect === 3) gsap.set(imgEl, { scale: 1.2 });

            // Wrap handlers with contextSafe: they run after useGSAP executes (via events),
            // so without contextSafe their animations won't be tracked/reverted on unmount.
            const onEnter = contextSafe!(() => {
                leaveTl.current?.kill();

                if (effect === 1) {
                    enterTl.current = gsap
                        .timeline({ defaults: { duration: 0.5, ease: 'expo' } })
                        .addLabel('start', 0)
                        .fromTo(imgEl, { filter: 'saturate(100%) brightness(100%)' }, { scale: 0.85, filter: 'saturate(200%) brightness(70%)' }, 'start')
                        .fromTo(
                            boxEls,
                            {
                                opacity: 0,
                                xPercent: (_i: number, t: Element) => (['a', 'c'].includes((t as HTMLElement).dataset.pos!) ? -100 : 100),
                                yPercent: (_i: number, t: Element) => (['a', 'b'].includes((t as HTMLElement).dataset.pos!) ? -100 : 100),
                            },
                            { opacity: 1, xPercent: 0, yPercent: 0 },
                            'start',
                        )
                        .fromTo(numberChars, { opacity: 0 }, { duration: 0.3, opacity: 1, stagger: 0.1 }, 'start+=.2')
                        .fromTo(categoryChars, { opacity: 0 }, { duration: 0.1, opacity: 1, stagger: { from: 'random' as const, each: 0.05 } }, 'start+=.2');
                } else if (effect === 2) {
                    dirRef.current = getEnterDirection(card);
                    const dir = dirRef.current;
                    const xPct = dir === 'left' ? -10 : dir === 'right' ? 10 : 0;
                    const yPct = dir === 'top' ? -10 : dir === 'bottom' ? 10 : 0;
                    const boxXPct = dir === 'left' ? -20 : dir === 'right' ? 20 : 0;
                    const boxYPct = dir === 'top' ? -20 : dir === 'bottom' ? 20 : 0;

                    enterTl.current = gsap
                        .timeline({ defaults: { duration: 0.7, ease: 'expo' } })
                        .addLabel('start', 0)
                        .fromTo(imgEl, { filter: 'grayscale(0%)' }, { xPercent: xPct, yPercent: yPct, filter: 'grayscale(40%)' }, 'start')
                        .fromTo(boxEls, { opacity: 0, xPercent: boxXPct, yPercent: boxYPct, rotation: -10 }, { opacity: 1, xPercent: 0, yPercent: 0, rotation: 0, stagger: 0.08 }, 'start')
                        .fromTo(numberChars, { opacity: 0 }, { duration: 0.3, opacity: 1, stagger: 0.1 }, 'start+=.2')
                        .fromTo(categoryChars, { opacity: 0 }, { duration: 0.1, opacity: 1, stagger: { from: 'random' as const, each: 0.05 } }, 'start+=.2');
                } else {
                    enterTl.current = gsap
                        .timeline({ defaults: { duration: 0.7, ease: 'expo' } })
                        .addLabel('start', 0)
                        .fromTo(imgEl, { filter: 'grayscale(0%)' }, { filter: 'grayscale(90%)' }, 'start')
                        .to(imgEl, { ease: 'power4', duration: 0.6, scaleY: 1 }, 'start')
                        .to(imgEl, { duration: 1.5, scaleX: 1 }, 'start')
                        .fromTo(boxEls, { opacity: 0, scale: 0, rotation: -10 }, { opacity: 1, scale: 1, rotation: 0, stagger: 0.08 }, 'start')
                        .fromTo(numberChars, { opacity: 0 }, { duration: 0.3, opacity: 1, stagger: 0.1 }, 'start+=.2')
                        .fromTo(categoryChars, { opacity: 0 }, { duration: 0.1, opacity: 1, stagger: { from: 'random' as const, each: 0.05 } }, 'start+=.2');
                }
            });

            const onLeave = contextSafe!(() => {
                enterTl.current?.kill();

                if (effect === 1) {
                    leaveTl.current = gsap
                        .timeline({ defaults: { duration: 0.8, ease: 'expo' } })
                        .addLabel('start', 0)
                        .to(imgEl, { scale: 1, filter: 'saturate(100%) brightness(100%)' }, 'start')
                        .to(
                            boxEls,
                            {
                                opacity: 0,
                                xPercent: (_i: number, t: Element) => (['a', 'c'].includes((t as HTMLElement).dataset.pos!) ? -100 : 100),
                                yPercent: (_i: number, t: Element) => (['a', 'b'].includes((t as HTMLElement).dataset.pos!) ? -100 : 100),
                            },
                            'start',
                        );
                } else if (effect === 2) {
                    const dir = dirRef.current;
                    const boxXPct = dir === 'left' ? -20 : dir === 'right' ? 20 : 0;
                    const boxYPct = dir === 'top' ? -20 : dir === 'bottom' ? 20 : 0;

                    leaveTl.current = gsap
                        .timeline({ defaults: { duration: 0.8, ease: 'expo' } })
                        .addLabel('start', 0)
                        .to(imgEl, { xPercent: 0, yPercent: 0, filter: 'grayscale(0%)' }, 'start')
                        .to(boxEls, { opacity: 0, xPercent: boxXPct, yPercent: boxYPct, rotation: -10 }, 'start');
                } else {
                    leaveTl.current = gsap
                        .timeline({ defaults: { duration: 0.8, ease: 'expo' } })
                        .addLabel('start', 0)
                        .to(imgEl, { scale: 1.3, filter: 'grayscale(0%)' }, 'start')
                        .to(boxEls, { scale: 0, opacity: 0, rotation: -10 }, 'start');
                }
            });

            card.addEventListener('mouseenter', onEnter);
            card.addEventListener('mouseleave', onLeave);

            // Remove listeners on unmount — GSAP context auto-reverts all tweens/timelines
            return () => {
                card.removeEventListener('mouseenter', onEnter);
                card.removeEventListener('mouseleave', onLeave);
            };
        },
        { scope: cardRef, dependencies: [effect, isEmpty] },
    );

    if (isEmpty) {
        return <div style={{ width: 300, aspectRatio: '1' }} />;
    }

    return (
        <div ref={cardRef} className="relative overflow-hidden cursor-pointer grid grid-cols-2 grid-rows-2 gap-2 p-2" style={{ width: 300, height: 300 }}>
            {/* Background image */}
            <div data-card-img className="absolute inset-0 bg-cover bg-center z-[1]" style={{ backgroundImage: `url(${img})`, willChange: 'filter, transform' }} />

            {/* Overlay boxes */}
            {boxes.map((box) => (
                <div
                    key={box.pos}
                    data-card-box
                    data-pos={box.pos}
                    className={`
                        opacity-0 z-[2] p-4 flex flex-col relative overflow-hidden
                        backdrop-blur-[5px]
                        ${BOX_GRID_CLASSES[box.pos]}
                        ${box.pos === 'b' || box.pos === 'd' ? 'items-end text-right' : ''}
                    `}
                    style={{
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        clipPath: getBoxClipPath(box.pos),
                    }}
                >
                    {box.number && (
                        <span data-card-number className="leading-none font-extralight" style={{ fontSize: 'clamp(2rem, 10vw, 3.5rem)', fontFamily: 'Georgia, serif' }}>
                            <SplitChars text={box.number} />
                        </span>
                    )}
                    {box.tags && (
                        <span className="font-semibold mt-auto" style={{ fontSize: '0.65rem' }}>
                            {box.tags}
                        </span>
                    )}
                    {box.category && (
                        <span data-card-category className="font-semibold mt-auto" style={{ fontSize: '0.85rem' }}>
                            <SplitChars text={box.category} />
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GridHoverPage() {
    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };
        document.addEventListener('mousemove', onMove);
        return () => document.removeEventListener('mousemove', onMove);
    }, []);

    return (
        <main
            className="min-h-screen"
            style={{
                background: '#000',
                color: '#fdf17b',
                fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace',
            }}
        >
            {GRID_DATA.map(({ effect, label, cards }) => (
                <section
                    key={effect}
                    className="relative"
                    style={{
                        width: 'min-content',
                        margin: '0 0 30vh auto',
                        padding: '13vw 10vh 3vh 3vh',
                    }}
                >
                    {/* Large effect label — absolutely positioned left */}
                    <h2
                        className="absolute top-0 font-extralight uppercase leading-none opacity-40 pointer-events-none select-none"
                        style={{
                            left: '-13vw',
                            fontSize: '6.75vw',
                            lineHeight: 0.8,
                            fontFamily: 'Georgia, "Times New Roman", serif',
                            background: 'linear-gradient(45deg, #fdf17b, #54ad8a, #a054fd)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            whiteSpace: 'pre-line',
                        }}
                    >
                        {label}
                    </h2>

                    {/* 2-column card grid */}
                    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(2, 300px)', gridAutoRows: '300px' }}>
                        {cards.map((card, i) => (
                            <GridCard key={i} effect={effect} {...card} />
                        ))}
                    </div>
                </section>
            ))}
        </main>
    );
}
