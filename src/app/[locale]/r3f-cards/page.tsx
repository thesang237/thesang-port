'use client';

// https://cydstumpel.nl/ — original concept by Cyd Stumpel
// Ported to Next.js / R3F v9

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Canvas } from '@react-three/fiber';

const Scene = dynamic(() => import('@/modules/pages/R3fCards/Scene'), { ssr: false });

export default function R3fCardsPage() {
    return (
        <main
            className="w-full h-screen overflow-hidden"
            style={{
                background: '#fdfdfd',
                cursor: 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxMCIgZmlsbD0iI0U4QjA1OSIvPjwvc3ZnPg==") 16 16, auto',
            }}
        >
            {/* ── Full-screen R3F canvas ── */}
            <div className="absolute inset-0">
                <Canvas camera={{ position: [0, 0, 100], fov: 15 }} style={{ animation: 'r3f-cards-fade-in 5s ease 1s forwards', opacity: 0, touchAction: 'none' }}>
                    <Scene />
                </Canvas>
            </div>

            {/* ── Overlay UI (pointer-events: none so it never blocks the canvas) ── */}
            <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-6 md:p-10">
                <div className="flex items-start justify-between">
                    <p className="font-sans font-bold text-black/80 text-sm tracking-tight">thesang.dev</p>
                    <div className="flex flex-col items-end gap-1">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-black/40">R3F Carousel</p>
                        <p className="font-mono text-[10px] text-black/30">{new Date().getFullYear()}</p>
                    </div>
                </div>
                <div className="flex items-end justify-between">
                    <p className="font-sans text-xs text-black/40">Scroll to rotate &nbsp;·&nbsp; Hover to interact</p>
                    <Link
                        href="/r3f-cards/learn"
                        className="pointer-events-auto font-mono text-[10px] uppercase tracking-widest text-black/50 hover:text-black/80 transition-colors border border-black/20 hover:border-black/40 px-3 py-1.5 rounded-full"
                    >
                        How it&apos;s built →
                    </Link>
                </div>
            </div>

            <style>{`
                @keyframes r3f-cards-fade-in {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
            `}</style>
        </main>
    );
}
