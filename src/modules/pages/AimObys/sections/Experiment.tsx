'use client';

import type { MouseEvent } from 'react';
import { useRef } from 'react';

import { gsap, useGSAP } from '@/components/motion-kit/gsap';

import { FEATURED, RISE } from '../data';
import { ArrowRight } from '../icons';

type Props = { onLearnMore: (e: MouseEvent<HTMLAnchorElement>) => void };

/** "Learn More": arrow swap + top rule wipe on hover. */
function LearnMore({ onClick }: { onClick: Props['onLearnMore'] }) {
    const ref = useRef<HTMLAnchorElement>(null);
    const q = (s: string) => ref.current?.querySelector(s) ?? null;

    useGSAP(
        () => {
            gsap.set('.aim-btn__arrow--2', { xPercent: -150 });
            gsap.set('.aim-btn__line--2', { xPercent: -110 });
        },
        { scope: ref },
    );

    const onEnter = () => {
        gsap.to(q('.aim-btn__arrow--1'), { xPercent: 150, duration: 0.4, ease: 'aimInOutCubic', overwrite: true });
        gsap.to(q('.aim-btn__arrow--2'), { xPercent: 0, duration: 0.4, ease: 'aimInOutCubic', overwrite: true });
        gsap.fromTo(q('.aim-btn__line--1'), { xPercent: 0 }, { xPercent: 110, duration: 0.8, ease: 'aimOutCubic', overwrite: true });
        gsap.fromTo(q('.aim-btn__line--2'), { xPercent: -100 }, { xPercent: 0, duration: 0.8, delay: 0.1, ease: 'aimOutCubic', overwrite: true });
    };
    const onLeave = () => {
        gsap.to(q('.aim-btn__arrow--1'), { xPercent: 0, duration: 0.3, ease: 'power1.out', overwrite: true });
        gsap.to(q('.aim-btn__arrow--2'), { xPercent: -150, duration: 0.3, ease: 'power1.out', overwrite: true });
        gsap.to(q('.aim-btn__line--2'), { xPercent: -110, duration: 0.5, ease: 'aimInOutCubic', overwrite: true });
        gsap.to(q('.aim-btn__line--1'), { xPercent: 0, duration: 0.5, delay: 0.1, ease: 'aimInOutCubic', overwrite: true });
    };

    return (
        <a ref={ref} href="#experiment" className="aim-btn aim-exp__fade" data-aim="exp-btn" onClick={onClick} onMouseEnter={onEnter} onMouseLeave={onLeave}>
            <span className="aim-btn__content">
                <span className="aim-t">Learn More</span>
                <span className="aim-btn__arrows">
                    <span className="aim-btn__arrow aim-btn__arrow--1">
                        <ArrowRight />
                    </span>
                    <span className="aim-btn__arrow aim-btn__arrow--2">
                        <ArrowRight />
                    </span>
                </span>
            </span>
            <span className="aim-btn__lines">
                <span className="aim-btn__line aim-btn__line--1" />
                <span className="aim-btn__line aim-btn__line--2" />
            </span>
        </a>
    );
}

export default function Experiment({ onLearnMore }: Props) {
    return (
        <section className="aim-exp" data-aim="exp">
            <div className="aim-exp__track">
                <div className="aim-exp__sticky">
                    {/* three columns rising out of the black, then sliding right */}
                    <div className="aim-exp__photos aim-no-events">
                        <div className="aim-exp__cols">
                            {/* phones: the first featured photo leads the stack */}
                            <div className="aim-exp__col aim-exp__col--2 aim-mob">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={RISE.left} alt="" loading="lazy" />
                            </div>
                            <div className="aim-exp__col aim-exp__col--2" data-aim="exp-col-2">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={RISE.mid} alt="" loading="eager" />
                            </div>
                            <div className="aim-exp__col aim-exp__col--3" data-aim="exp-col-3">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={RISE.right} alt="Borys Kosarev" loading="eager" />
                            </div>
                        </div>
                    </div>

                    <div className="aim-exp__ui">
                        <div className="aim-exp__left">
                            <div className="aim-exp__top">
                                <h2 className="aim-exp__headings">
                                    <span className="aim-exp__hmask" style={{ display: 'block' }}>
                                        <span className="aim-big-heading" data-aim="exp-h-1" style={{ display: 'block' }}>
                                            Explore
                                        </span>
                                    </span>
                                    <span className="aim-exp__hmask" style={{ display: 'block' }}>
                                        <span className="aim-big-heading" data-aim="exp-h-2" style={{ display: 'block' }}>
                                            Experiment
                                        </span>
                                    </span>
                                </h2>
                                <LearnMore onClick={onLearnMore} />
                            </div>
                            <div className="aim-exp__fade" data-aim="exp-foot">
                                <p className="aim-t">Kharkiv Modernism × Obys × AI</p>
                            </div>
                        </div>

                        <div className="aim-exp__right aim-exp__fade" data-aim="exp-right">
                            <div className="aim-exp__counter" aria-label="Featured 1 of 6">
                                <div className="aim-exp__digits">
                                    {FEATURED.map((_, i) => (
                                        <div key={i} className="aim-exp__digit" data-aim="exp-digit">
                                            <span className="aim-t">{i + 1}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="aim-exp__static">
                                    <span className="aim-t">—</span>
                                </div>
                                <div className="aim-exp__static">
                                    <span className="aim-t">{FEATURED.length}</span>
                                </div>
                            </div>
                            <div className="aim-mlist">
                                <div className="aim-mlist__row">
                                    <div className="aim-mlist__label">
                                        <p className="aim-t">[06] Featured:</p>
                                    </div>
                                    <ul className="aim-mlist__names">
                                        <li className="aim-mlist__item aim-mlist__item--name">
                                            <span className="aim-t">Name:</span>
                                        </li>
                                        {FEATURED.map((f, i) => (
                                            <li key={f.name} className="aim-mlist__item" data-aim="exp-name" style={{ opacity: i === 0 ? 1 : 0.4 }}>
                                                <span className="aim-t">{f.name}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            <div className="aim-exp__fade" data-aim="exp-foot">
                                <p className="aim-t">©2025</p>
                            </div>
                        </div>
                    </div>

                    {/* right-hand slider: first photo is the left rising column, then it becomes the slide deck */}
                    <div className="aim-exp__slider" data-aim="exp-slider">
                        {FEATURED.map((f, i) => (
                            <div key={f.name} className={`aim-exp__slide${i ? ' aim-exp__slide--next' : ''}`} data-aim="exp-slide" style={{ zIndex: i ? i + 1 : undefined }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={f.img} alt={f.name} loading="eager" data-aim="exp-slide-img" style={{ opacity: i ? 0 : 1 }} />
                                <div className="aim-exp__slide-bg" style={{ backgroundColor: f.bg }} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* phones: the slide deck becomes a plain list of the six featured works */}
            <div className="aim-exp__phone aim-mob-flex">
                {FEATURED.map((f, i) => (
                    <figure key={f.name} className="aim-exp__card">
                        <div className="aim-exp__card-img">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={f.img} alt={f.name} loading="lazy" />
                        </div>
                        <figcaption className="aim-exp__card-name">
                            <span className="aim-t">{i === 0 ? 'Suprematist' : f.name}</span>
                        </figcaption>
                    </figure>
                ))}
            </div>
        </section>
    );
}
