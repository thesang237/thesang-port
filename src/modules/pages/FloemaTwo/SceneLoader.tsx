'use client';

import type { ReactNode } from 'react';
import { Component, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

import { asset, heroTiles } from './data';
import type { SceneDialsRef } from './motion';
import { useFloema } from './Shell';
const Scene = dynamic(() => import('./Scene'), { ssr: false });

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
    state = { failed: false };
    static getDerivedStateFromError() {
        return { failed: true };
    }
    render() {
        return this.state.failed ? this.props.fallback : this.props.children;
    }
}
export default function SceneLoader({ mode, dialsRef, active = true }: { mode: 'home' | 'outline' | 'cube'; dialsRef: SceneDialsRef; active?: boolean }) {
    const { reduced } = useFloema();
    const [visible, setVisible] = useState(true);
    const [ready, setReady] = useState(false);
    const [lost, setLost] = useState(false);
    useEffect(() => {
        const update = () => setVisible(document.visibilityState === 'visible');
        document.addEventListener('visibilitychange', update);
        return () => document.removeEventListener('visibilitychange', update);
    }, []);
    const poster = (
        <div className={`f2-scene-poster f2-poster-${mode}`} aria-hidden="true">
            {mode === 'home' ? (
                heroTiles.map((tile, i) => (
                    <img key={i} src={asset(tile.image)} alt="" style={{ left: `${tile.x}%`, top: `${tile.y}%`, width: `${tile.w}%`, height: `${tile.h}%`, opacity: tile.depth < 0.4 ? 0.3 : 0.8 }} />
                ))
            ) : mode === 'outline' ? (
                <img className="f2-charger-poster" src={asset('outline-charger.svg')} alt="" />
            ) : (
                <div className="f2-cube-poster">
                    <div />
                    <div />
                    <div />
                </div>
            )}
        </div>
    );
    return (
        <div className={`f2-scene f2-scene-${mode}`} aria-hidden="true" style={{ visibility: active ? 'visible' : 'hidden' }}>
            {(!ready || reduced || lost) && poster}
            {!reduced && !lost && (
                <SceneBoundary fallback={poster}>
                    <Scene mode={mode} dialsRef={dialsRef} active={active && visible} onReady={() => setReady(true)} onLost={() => setLost(true)} />
                </SceneBoundary>
            )}
        </div>
    );
}
