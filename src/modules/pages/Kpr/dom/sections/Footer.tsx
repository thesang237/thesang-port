'use client';

import { useRef } from 'react';

import { useGSAP } from '@/components/motion-kit/gsap';

import { FOOTER } from '../../data/copy';
import { onFrame } from '../../scroll/frame';
import { clamp01, ease } from '../../scroll/timeline';
import { film } from '../../scroll/useScrollStore';
import { Chevron, Download, External, KprLogo } from '../icons';
import BtnFrame from '../ui/BtnFrame';
import { Hacky, scrambleTween } from '../ui/Text';

/** Link with the reference's hover: a block slides in behind the label, colours flip, label decodes. */
export function LinkHover({ children, href = '#', active, className = '', external }: { children: string; href?: string; active?: boolean; className?: string; external?: boolean }) {
    return (
        <a
            href={href}
            className={`kpr-lh ${active ? 'is-active' : ''} ${className}`}
            data-sfx
            aria-current={active ? 'page' : undefined}
            onPointerEnter={(e) => scrambleTween(e.currentTarget, 0.45)}
            onFocus={(e) => scrambleTween(e.currentTarget, 0.45)}
        >
            <span className="kpr-lh__bg" aria-hidden="true" />
            <span className="kpr-lh__content">
                <Hacky text={children} reveal={false} />
                {external && <External className="kpr-lh__ext" />}
            </span>
        </a>
    );
}

function Head({ children }: { children: string }) {
    return (
        <div className="kpr-footer__head kpr-cap3">
            <i className="kpr-dot" aria-hidden="true" />
            {children}
        </div>
    );
}

export default function Footer() {
    const ref = useRef<HTMLElement>(null);

    // KPR logo rises out of its mask and the console text decodes as the footer scrolls in
    useGSAP(
        () => {
            const root = ref.current!;
            const logo = root.querySelector<HTMLElement>('.kpr-footer__logoInner')!;
            const consoleEl = root.querySelector<HTMLElement>('.kpr-footer__console')!;
            let top = 0;
            let height = 1;
            let decoded = false;
            const measure = () => {
                top = root.offsetTop;
                height = root.offsetHeight;
            };
            measure();
            const ro = new ResizeObserver(measure);
            ro.observe(root);
            ro.observe(document.body);
            const off = onFrame(() => {
                const y = window.scrollY;
                const vh = film.vh;
                // the stage is fully covered once the footer's top has passed the viewport top
                film.covered = y >= top + 2;
                const k = clamp01((y + vh - top - height * 0.45) / (height * 0.55));
                logo.style.transform = `translate3d(0, ${(1 - ease.outStrong(k)) * 100}%, 0)`;
                if (!decoded && y + vh > top + 200) {
                    decoded = true;
                    scrambleTween(consoleEl, 1.4);
                }
                if (decoded && y + vh < top) decoded = false;
            });
            return () => {
                off();
                ro.disconnect();
                film.covered = false;
            };
        },
        { scope: ref },
    );

    return (
        <footer ref={ref} className="kpr-footer">
            <div className="kpr-footer__top">
                <div className="kpr-footer__item">
                    <div />
                    <pre className="kpr-footer__console">
                        <Hacky text={FOOTER.console} reveal={false} />
                    </pre>
                </div>
                <div className="kpr-footer__item">
                    <Head>{FOOTER.discover}</Head>
                    <nav className="kpr-footer__links" aria-label="Footer">
                        {FOOTER.links.map((l, i) => (
                            <LinkHover key={l} active={i === 0} external={l === 'Careers'}>
                                {l}
                            </LinkHover>
                        ))}
                    </nav>
                </div>
                <div className="kpr-footer__item">
                    <Head>{FOOTER.join}</Head>
                    <div className="kpr-footer__links">
                        {FOOTER.socials.map((l) => (
                            <LinkHover key={l}>{l}</LinkHover>
                        ))}
                    </div>
                </div>
                <div className="kpr-footer__item">
                    <Head>{FOOTER.details}</Head>
                    <div className="kpr-footer__press">
                        <div>
                            <div className="kpr-footer__desc">{FOOTER.contact}</div>
                            <LinkHover href={`mailto:${FOOTER.email}`}>{FOOTER.email}</LinkHover>
                        </div>
                        <a className="kpr-btn kpr-btn--dark" href="#" data-sfx>
                            <BtnFrame />
                            <Download className="kpr-btn__icon" />
                            <Hacky text={FOOTER.brandbook} reveal={false} />
                        </a>
                    </div>
                </div>
            </div>
            <div className="kpr-footer__logo" aria-hidden="true">
                <div className="kpr-footer__logoInner">
                    <KprLogo />
                </div>
            </div>
            <div className="kpr-footer__bottom kpr-cap3">
                <button type="button" className="kpr-footer__region">
                    {FOOTER.region}
                    <Chevron className="kpr-footer__chev" />
                </button>
                <div className="kpr-footer__legal">
                    {FOOTER.legal.map((l) => (
                        <LinkHover key={l}>{l}</LinkHover>
                    ))}
                </div>
                <div className="kpr-footer__copy">{FOOTER.copyright}</div>
            </div>
        </footer>
    );
}
