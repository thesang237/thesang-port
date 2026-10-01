import type { MouseEvent, RefObject } from 'react';

import { HERO_LINES, MODERNISTS } from '../data';
import { AimLogoLockup, ArrowDown } from '../icons';

import Nav, { MenuBar, type NavActions } from './Nav';

type Props = NavActions & {
    scrollLottieRef: RefObject<HTMLDivElement | null>;
    onExplore: (e: MouseEvent) => void;
};

export default function Hero({ scrollLottieRef, onExplore, ...nav }: Props) {
    return (
        <section id="Home-hero" className="aim-hero">
            <div className="aim-hero__screen">
                {/* phones: "Menu" bar at the top of the first screen */}
                <MenuBar onMenu={nav.onMenu} data-aim="mnav-hero" style={{ opacity: 0 }} />

                {/* scroll-scrubbed logo: breaks apart, falls, turns into three pillars that fill the screen */}
                <div className="aim-lottie-fixed" data-aim="lottie-fixed" style={{ opacity: 0 }} aria-hidden>
                    <div className="aim-lottie-col">
                        <div ref={scrollLottieRef} className="aim-lottie aim-lottie--scroll" data-aim="lottie-scroll" />
                    </div>
                </div>

                <div className="aim-hero__top">
                    <div className="aim-hero__gap">
                        <div className="aim-bar aim-bar--small" />
                    </div>
                    <div className="aim-hero__barwrap">
                        <div className="aim-bar" data-aim="hero-bar" style={{ height: 0 }} />
                    </div>
                    <div data-aim="hero-nav" style={{ opacity: 0 }}>
                        <Nav variant="hero" {...nav} />
                    </div>
                    <div className="aim-line aim-line--1" data-aim="hero-line-1" style={{ width: 0 }} />
                </div>

                <div className="aim-hero__home">
                    <div className="aim-hero__left">
                        <div className="aim-mlist" data-aim="hero-list" style={{ opacity: 0 }}>
                            <div className="aim-mlist__row aim-mlist__row--hero">
                                <div className="aim-mlist__label">
                                    <p className="aim-t">Modernists:</p>
                                </div>
                                <ul>
                                    {MODERNISTS.map((name) => (
                                        <li key={name} className="aim-mlist__item">
                                            <span className="aim-t">{name}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="aim-line aim-line--3" data-aim="hero-line-3" style={{ height: 0 }} />
                    </div>

                    <div className="aim-hero__right" data-aim="hero-right">
                        <h1 className="aim-hero__heading">
                            {HERO_LINES.map((line, i) => (
                                <span key={line} className="aim-mask" style={{ display: 'block' }}>
                                    <span className="aim-h2" data-aim={`hero-h-${i + 1}`} style={{ display: 'block', transform: 'translate3d(0, 110%, 0)' }}>
                                        {line}
                                    </span>
                                </span>
                            ))}
                        </h1>
                        <a href="#Home-about" className="aim-hero__scroll" data-aim="hero-scroll" style={{ opacity: 0 }} onClick={onExplore}>
                            <span className="aim-t aim-desk">Scroll to Explore</span>
                            <span className="aim-t aim-mob">Explore</span>
                            <span className="aim-scroll-arrow">
                                <ArrowDown />
                            </span>
                        </a>
                    </div>
                    <div className="aim-line aim-line--2" />
                </div>

                <div className="aim-hero__logo" data-aim="hero-logo" style={{ opacity: 0 }}>
                    <AimLogoLockup />
                </div>
            </div>
        </section>
    );
}
