import { forwardRef, type MouseEvent } from 'react';

type Props = {
    onClose: (e: MouseEvent) => void;
    onIndex: (e: MouseEvent) => void;
    onPage: (e: MouseEvent<HTMLAnchorElement>) => void;
};

/** Phone menu: dark sheet drops in from the top, big links rise out of masks one after another. */
const MobileMenu = forwardRef<HTMLDivElement, Props>(function MobileMenu({ onClose, onIndex, onPage }, ref) {
    return (
        <div ref={ref} className="aim-mmenu" role="dialog" aria-modal="true" aria-label="Menu">
            <button type="button" className="aim-mmenu__close" data-aim="mmenu-close" onClick={onClose}>
                <span className="aim-t aim-menu-label">Close</span>
            </button>
            <nav className="aim-mmenu__links" aria-label="Menu">
                <a href="#Home-hero" className="aim-mmenu__link is-active" onClick={onIndex}>
                    <span className="aim-mmenu__word" data-aim="mmenu-word">
                        Index
                    </span>
                </a>
                <a href="#experiment" className="aim-mmenu__link" onClick={onPage}>
                    <span className="aim-mmenu__word" data-aim="mmenu-word">
                        Experiment
                    </span>
                </a>
                <a href="#about" className="aim-mmenu__link" onClick={onPage}>
                    <span className="aim-mmenu__word" data-aim="mmenu-word">
                        About
                    </span>
                </a>
            </nav>
            <div className="aim-mmenu__text">
                <div className="aim-mmenu__desc" data-aim="mmenu-desc">
                    <p className="aim-t">
                        An AI Experiment
                        <br />
                        Based on the Kharkiv Modernism.
                    </p>
                </div>
                <p className="aim-t" data-aim="mmenu-credit">
                    Obys Agency ©2023
                </p>
            </div>
            <div className="aim-mmenu__bg" data-aim="mmenu-bg" />
        </div>
    );
});

export default MobileMenu;
