import { create } from 'zustand';

export type HeaderTheme = 'light' | 'dark' | 'dim';

type State = {
    /** preloader finished (hero intro may play) */
    loaded: boolean;
    menuOpen: boolean;
    headerCompact: boolean;
    /** theme of the section currently under the header */
    headerTheme: HeaderTheme;
    /** hide the centre monogram (scrolled or menu open) */
    transition: 'idle' | 'cover' | 'hold' | 'reveal';
    set: (s: Partial<Omit<State, 'set'>>) => void;
};

export const useLN = create<State>((set) => ({
    loaded: false,
    menuOpen: false,
    headerCompact: false,
    headerTheme: 'light',
    transition: 'idle',
    set: (s) => set(s),
}));

/** fire-and-forget page events (enter animations, etc.) */
export const LN_ENTER = 'ln:enter';
export const emitEnter = () => {
    window.dispatchEvent(new CustomEvent(LN_ENTER));
};
