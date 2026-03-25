'use client';
import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import SceneCanvas from './canvas/SceneCanvas';
import FloemaTransition from './components/FloemaTransition';
import Navigation from './components/Navigation';
import Preloader from './components/Preloader';
import { type FloemaPage, useFloemaStore } from './store/floemaStore';

const PAGE_COLORS: Record<FloemaPage, { bg: string; color: string }> = {
    home: { bg: '#c97164', color: '#f9f1e7' },
    collections: { bg: '#bc978c', color: '#f9f1e7' },
    about: { bg: '#b2b8c3', color: '#37384c' },
};

export default function FloemaLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isPreloaded = useFloemaStore((s) => s.isPreloaded);
    const currentPage = useFloemaStore((s) => s.currentPage);
    const setPage = useFloemaStore((s) => s.setPage);
    const setPreloaded = useFloemaStore((s) => s.setPreloaded);

    // Derive page from pathname and sync to store
    useEffect(() => {
        const page: FloemaPage = pathname.includes('/about') ? 'about' : pathname.includes('/collections') ? 'collections' : 'home';
        setPage(page);
    }, [pathname, setPage]);

    const { bg: bgColor, color: textColor } = PAGE_COLORS[currentPage];

    // Set rem scale on <html> (1rem ≈ 10px at 1920px)
    useEffect(() => {
        const prev = document.documentElement.style.fontSize;
        document.documentElement.style.fontSize = 'calc(100vw / 1920 * 10)';
        return () => {
            document.documentElement.style.fontSize = prev;
        };
    }, []);

    // Update page background/text colour
    useEffect(() => {
        document.documentElement.style.background = bgColor;
        document.documentElement.style.color = textColor;
    }, [bgColor, textColor]);

    return (
        <div
            className="floema-root"
            style={{
                position: 'fixed',
                inset: 0,
                overflow: 'hidden',
                background: bgColor,
                color: textColor,
                transition: 'background 0.8s ease, color 0.8s ease',
                fontFamily: "'Suisse BP', sans-serif",
            }}
        >
            {/* Layer 1 — fixed WebGL canvas, always mounted */}
            <SceneCanvas />

            {/* Preloader — shown until textures finish */}
            {!isPreloaded && <Preloader onDone={setPreloaded} />}

            {/* Layer 2 — DOM content */}
            <Navigation currentPage={currentPage} />
            <div style={{ position: 'absolute', inset: 0 }}>{children}</div>

            {/* Page transition wipe overlay — z-index 4 from CSS */}
            <FloemaTransition />
        </div>
    );
}
