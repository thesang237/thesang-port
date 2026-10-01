import type { CSSProperties, MouseEvent } from 'react';

import { NAV_CREDIT, NAV_TITLE } from '../data';

export type NavActions = {
    onIndex: (e: MouseEvent) => void;
    onPage: (e: MouseEvent<HTMLAnchorElement>) => void;
    onGallery: (e: MouseEvent) => void;
    onMenu: (e: MouseEvent) => void;
};

type MenuBarProps = { onMenu: (e: MouseEvent) => void; fixed?: boolean; style?: CSSProperties; 'data-aim'?: string };

/** Phones only: the whole navigation collapses into a "Menu" button. */
export function MenuBar({ onMenu, fixed, ...rest }: MenuBarProps) {
    return (
        <div className={`aim-mnav${fixed ? ' aim-mnav--fixed' : ''}`} {...rest}>
            <div className="aim-mnav__item">
                <button type="button" className="aim-mnav__btn" onClick={onMenu} aria-haspopup="dialog">
                    <span className="aim-t aim-menu-label">Menu</span>
                </button>
            </div>
        </div>
    );
}

type Props = NavActions & { variant: 'hero' | 'fixed' };

export default function Nav({ variant, onIndex, onPage, onGallery, onMenu }: Props) {
    return (
        <nav className={`aim-nav aim-nav--${variant}`} data-aim={variant === 'fixed' ? 'nav-fixed' : 'nav-hero'} aria-label={variant === 'hero' ? 'Main' : 'Main (pinned)'}>
            <div className="aim-nav__bar">
                <div className="aim-nav__title">
                    <p className="aim-t">{NAV_TITLE}</p>
                </div>
                <div className="aim-nav__links">
                    <div className="aim-nav__group">
                        <a href="#Home-hero" className="aim-navlink" onClick={onIndex}>
                            <span className="aim-t">Index</span>
                        </a>
                        <span className="aim-t">/</span>
                        <a href="#experiment" className="aim-navlink" onClick={onPage}>
                            <span className="aim-t">Experiment</span>
                        </a>
                        <span className="aim-t">/</span>
                        <a href="#about" className="aim-navlink" onClick={onPage}>
                            <span className="aim-t">About</span>
                        </a>
                    </div>
                    <div className="aim-nav__right">
                        <a href="#gallery" className="aim-navlink aim-navlink--modal" onClick={onGallery}>
                            <span className="aim-t">[Gallery]</span>
                        </a>
                        <p className="aim-t">{NAV_CREDIT}</p>
                    </div>
                </div>
            </div>
            {variant === 'fixed' && <MenuBar onMenu={onMenu} fixed />}
            <div className="aim-nav__bg" />
            {variant === 'fixed' && <div className="aim-line aim-line--fixed" />}
        </nav>
    );
}
