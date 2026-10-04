'use client';

import './corn.scss';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

import Footer from './dom/Footer';
import Header from './dom/Header';
import Hotspots from './dom/Hotspots';
import Loader from './dom/Loader';
import Menu from './dom/Menu';
import SideNav from './dom/SideNav';
import { Chapters, HeroCopy } from './dom/Story';
import type { Engine } from './engine/Engine';
import { getUi, type HotspotId, resetUi, useUi } from './store';

const ModelDebug = dynamic(() => import('./debug/ModelDebug'), { ssr: false });

/**
 * /corn — study clone (see NOTES.md). One fixed WebGL canvas (engine/Engine.ts) under a DOM layer
 * that owns layout, copy, links and accessibility. Query: `?ch=3` start at a stop, `?skip` skip
 * the loader/intro, `?debug=model&name=…` asset viewer.
 */
export default function CornPage() {
    const host = useRef<HTMLDivElement>(null);
    const engine = useRef<Engine | null>(null);
    const [debug, setDebug] = useState<string | null | undefined>(undefined);
    const menuOpen = useUi((s) => s.menuOpen);

    useEffect(() => setDebug(new URLSearchParams(window.location.search).get('debug')), []);

    useEffect(() => {
        if (debug !== null || !host.current) return;
        const q = new URLSearchParams(window.location.search);
        let alive = true;
        resetUi();
        document.documentElement.classList.add('corn-lock');
        import('./engine/Engine').then(({ Engine }) => {
            if (!alive || !host.current) return;
            const e = new Engine(host.current, { start: Number(q.get('ch') ?? 0), skipIntro: q.has('skip') });
            engine.current = e;
            if (process.env.NODE_ENV !== 'production') (window as unknown as { __corn: unknown }).__corn = e.debug();
            void e.init();
        });
        return () => {
            alive = false;
            engine.current?.dispose();
            engine.current = null;
            document.documentElement.classList.remove('corn-lock');
        };
    }, [debug]);

    const onLoaded = useCallback(() => engine.current?.startIntro(), []);
    const toggleMenu = useCallback(() => engine.current?.setMenu(!getUi().menuOpen), []);
    const closeMenu = useCallback(() => engine.current?.setMenu(false), []);
    const go = useCallback((chapter: number) => {
        engine.current?.setMenu(false);
        engine.current?.closeHotspot();
        engine.current?.goTo(chapter);
    }, []);
    const openHotspot = useCallback((id: HotspotId) => engine.current?.openHotspot(id), []);
    const closeHotspot = useCallback(() => engine.current?.closeHotspot(), []);
    const pick = useCallback((k: number) => engine.current?.setCondition(k), []);
    const fact = useCallback((k: number) => engine.current?.setFact(k), []);
    const hotspot = useUi((s) => s.hotspot);

    if (debug === undefined) return <div className="corn-root" />;
    if (debug === 'model') return <ModelDebug />;

    return (
        <div className="corn-root">
            <div ref={host} className="corn-canvas" aria-hidden />
            <main className={`corn-ui${menuOpen ? ' is-menu' : ''}${hotspot ? ` is-hotspot is-hs-${hotspot}` : ''}`}>
                <HeroCopy />
                <Chapters onOpen={openHotspot} />
                <Footer />
                <Hotspots onClose={closeHotspot} onPick={pick} onFact={fact} />
            </main>
            <SideNav onGo={go} />
            <Header onMenu={toggleMenu} onHome={() => go(0)} />
            <Menu onClose={closeMenu} onGo={go} />
            <Loader onDone={onLoaded} />
        </div>
    );
}
