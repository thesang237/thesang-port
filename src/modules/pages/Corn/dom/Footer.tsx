'use client';

import { FOOTER, FOOTER_LINKS, LAST, LEGAL_LINKS } from '../data/story';
import { useUi } from '../store';

/**
 * Footer stops (reference 52–62 s): five big links (cap 36 px, 150 px apart, centred) with a hairline
 * under each and a small arrow that jumps to the left on hover; legal row bottom-left. Link text is
 * transparent: the WebGL titles draw it (outline → fill) and the engine scrolls the list.
 */
export default function Footer() {
    const nearest = useUi((s) => s.nearest);
    const chapter = useUi((s) => s.chapter);
    const on = nearest >= FOOTER && nearest <= LAST;
    const settled = chapter >= FOOTER;
    return (
        <footer className={`corn-footer${on ? ' is-on' : ''}${settled ? ' is-settled' : ''}`} aria-hidden={!on}>
            <ul className="corn-footer__list" data-footer-list>
                {FOOTER_LINKS.map((label, k) => (
                    <li key={label} className="corn-footer__item" style={{ '--k': k } as React.CSSProperties}>
                        <a href="#" className="corn-footer__link" tabIndex={on ? 0 : -1} onClick={(e) => e.preventDefault()}>
                            <span className="corn-gl-anchor" data-gl-link={k}>
                                {label}
                            </span>
                            <i className="corn-footer__arrow" aria-hidden />
                        </a>
                    </li>
                ))}
            </ul>
            <ul className="corn-footer__legal">
                {LEGAL_LINKS.map((l) => (
                    <li key={l}>
                        <a href="#" tabIndex={on ? 0 : -1} onClick={(e) => e.preventDefault()}>
                            {l}
                        </a>
                    </li>
                ))}
            </ul>
        </footer>
    );
}
