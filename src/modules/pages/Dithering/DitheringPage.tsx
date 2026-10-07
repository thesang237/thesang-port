'use client';
import './dithering.css';

import type { ReactNode } from 'react';
import { Component, useCallback, useState, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';

import { Link } from '@/i18n/navigation';

import { Poster } from './Poster';
import { DEFAULT_STUDIO } from './settings';
import { StudioPanel } from './StudioPanel';

const Scene = dynamic(() => import('./Scene'), { ssr: false, loading: () => <p className="studio-fallback">Preparing the print…</p> });
const subscribeMotion = (notify: () => void) => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    media.addEventListener('change', notify);
    return () => media.removeEventListener('change', notify);
};
class CanvasBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
    state = { failed: false };
    static getDerivedStateFromError() {
        return { failed: true };
    }
    render() {
        return this.state.failed ? <Poster message="The renderer could not start. Explore the settings or open the field guide." /> : this.props.children;
    }
}
export default function DitheringPage() {
    const [settings, setSettings] = useState(() => structuredClone(DEFAULT_STUDIO));
    const [panelOpen, setPanelOpen] = useState(true);
    const [lost, setLost] = useState(false);
    const [motionOverride, setMotionOverride] = useState(false);
    const reduced = useSyncExternalStore(
        subscribeMotion,
        () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        () => true,
    );
    const animate = settings.animate && (!reduced || motionOverride);
    const handleLost = useCallback(() => setLost(true), []);
    return (
        <main className={`dithering-page print-ui ${panelOpen ? 'has-panel' : ''}`}>
            <div className="studio-stage">
                <CanvasBoundary>
                    {lost ? <Poster message="The graphics context was lost. Reload to restart the renderer." /> : <Scene settings={{ ...settings, animate }} onLost={handleLost} />}
                </CanvasBoundary>
                <nav className="studio-top">
                    <Link href="/dithering/learn">Explore the field guide ↗</Link>
                    <div>
                        <button
                            type="button"
                            onClick={() => {
                                if (reduced) setMotionOverride(!animate);
                                setSettings((s) => ({ ...s, animate: !animate }));
                            }}
                        >
                            {animate ? 'Pause motion' : 'Play motion'}
                        </button>
                        {!panelOpen && (
                            <button type="button" onClick={() => setPanelOpen(true)}>
                                Open controls
                            </button>
                        )}
                    </div>
                </nav>
                <div className="dithering-demo-container">
                    <span className="print-eyebrow">Nine screens. One image.</span>
                    <h1>Dithering studio</h1>
                    <p>Drag to orbit · Scroll to zoom · Change the ink</p>
                    <p className="studio-credit">
                        Based on{' '}
                        <a href="https://niccolofanton.dev" target="_blank" rel="noreferrer">
                            niccolofanton
                        </a>
                        &apos;s{' '}
                        <a href="https://github.com/niccolofanton/dithering-shader" target="_blank" rel="noreferrer">
                            dithering shader ↗
                        </a>
                        {' · Helmet: '}
                        <a href="https://sketchfab.com/3d-models/jousting-helmet-a4eea31d9d9441af9434a7da5ae46b54" target="_blank" rel="noreferrer">
                            The Royal Armoury · CC BY 4.0
                        </a>
                    </p>
                </div>
            </div>
            {panelOpen && <StudioPanel settings={settings} onChange={setSettings} onClose={() => setPanelOpen(false)} />}
        </main>
    );
}
