import { create } from 'zustand';

export type FloemaPage = 'home' | 'about' | 'collections';

type FloemaStore = {
    isPreloaded: boolean;
    currentPage: FloemaPage;
    scrollY: number;
    activeDetail: number | null;
    setPreloaded: () => void;
    setPage: (page: FloemaPage) => void;
    setScrollY: (y: number) => void;
    openDetail: (index: number) => void;
    closeDetail: () => void;
};

export const useFloemaStore = create<FloemaStore>((set) => ({
    isPreloaded: false,
    currentPage: 'home',
    scrollY: 0,
    activeDetail: null,
    setPreloaded: () => set({ isPreloaded: true }),
    setPage: (page) => set({ currentPage: page }),
    setScrollY: (y) => set({ scrollY: y }),
    openDetail: (index) => set({ activeDetail: index }),
    closeDetail: () => set({ activeDetail: null }),
}));
