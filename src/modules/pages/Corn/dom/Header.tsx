'use client';

import { useUi } from '../store';

import Logo from './Logo';

/** Burger (x 60–92, y 60–74) and logo (x 160, y 52). Fades in once the hero title has drawn. */
export default function Header({ onMenu, onHome }: { onMenu: () => void; onHome: () => void }) {
    const ready = useUi((s) => s.heroReady);
    const menuOpen = useUi((s) => s.menuOpen);
    return (
        <header className={`corn-header${ready ? ' is-ready' : ''}${menuOpen ? ' is-menu' : ''}`}>
            <button type="button" className="corn-burger" aria-label="Open menu" aria-expanded={menuOpen} onClick={onMenu}>
                <span />
                <span />
                <span />
            </button>
            <button type="button" className="corn-header__home" aria-label="Back to the start" onClick={onHome}>
                <Logo />
            </button>
        </header>
    );
}
