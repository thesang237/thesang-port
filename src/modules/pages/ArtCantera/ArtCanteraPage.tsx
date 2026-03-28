'use client';

import { useEffect, useState } from 'react';

const TOKEN_ID = '39000019';

function randomHash(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return '0x' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

type Status = 'loading' | 'ready' | 'error';

export function ArtCanteraPage() {
    const [status, setStatus] = useState<Status>('loading');

    useEffect(() => {
        window.tokenData = { tokenId: TOKEN_ID, hash: randomHash() };

        // Patch setInterval to capture the animation loop ID for cleanup.
        // The patch is active only for the synchronous duration of the script's
        // IIFE — from appendChild until onload fires.
        const intervalIds: number[] = [];
        const origSetInterval = window.setInterval.bind(window);
        let capturing = true;

        window.setInterval = (fn: TimerHandler, delay?: number, ...args: unknown[]) => {
            const id = origSetInterval(fn as TimerHandler, delay, ...args);
            if (capturing) intervalIds.push(id);
            return id;
        };

        const prevBg = document.body.style.backgroundColor;
        document.body.style.backgroundColor = '#000';

        const script = document.createElement('script');
        script.src = '/scripts/cantera.js';

        script.onload = () => {
            capturing = false;
            window.setInterval = origSetInterval;
            setStatus('ready');
        };

        script.onerror = () => {
            capturing = false;
            window.setInterval = origSetInterval;
            setStatus('error');
        };

        document.head.appendChild(script);

        return () => {
            // Restore before any other cleanup in case onload never fired
            capturing = false;
            window.setInterval = origSetInterval;

            intervalIds.forEach(clearInterval);

            document.body.style.backgroundColor = prevBg;

            document.getElementById('sumCanvas')?.remove();
            document.getElementById('mainCanvas')?.remove();

            script.remove();
            delete window.tokenData;
        };
    }, []);

    return (
        <>
            <style>{`
                #sumCanvas, #mainCanvas {
                    padding: 0;
                    margin: auto;
                    display: block;
                    position: fixed;
                    top: 0; bottom: 0; left: 0; right: 0;
                }
            `}</style>

            {status === 'loading' && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#000',
                        color: '#999',
                        fontFamily: 'monospace',
                        fontSize: 13,
                        letterSpacing: '0.08em',
                    }}
                >
                    loading…
                </div>
            )}

            {status === 'error' && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#000',
                        color: '#c0392b',
                        fontFamily: 'monospace',
                        fontSize: 13,
                        letterSpacing: '0.08em',
                    }}
                >
                    failed to load art
                </div>
            )}
        </>
    );
}
