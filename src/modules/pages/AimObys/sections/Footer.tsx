import type { RefObject } from 'react';

import { FOOTER_CREDIT, FOOTER_TEXT } from '../data';

type Props = { lottieRef: RefObject<HTMLDivElement | null> };

export default function Footer({ lottieRef }: Props) {
    return (
        <footer className="aim-footer" data-aim="footer">
            <div className="aim-footer__inner">
                <div className="aim-footer__text">
                    <p className="aim-t aim-desk">{FOOTER_TEXT}</p>
                    <p className="aim-t">{FOOTER_CREDIT}</p>
                </div>
                <div className="aim-bar" />
            </div>
            {/* eight blocks tumble into the AIM logo when the footer comes into view (full-bleed, like the reference) */}
            <div className="aim-footer__anim" aria-hidden>
                <div ref={lottieRef} className="aim-lottie aim-lottie--footer" />
            </div>
        </footer>
    );
}
