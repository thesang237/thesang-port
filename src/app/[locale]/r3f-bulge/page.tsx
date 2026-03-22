'use client';

import dynamic from 'next/dynamic';
import { Canvas } from '@react-three/fiber';

const Scene = dynamic(() => import('@/modules/pages/R3fBulge/Scene'), { ssr: false });

function Title3D() {
    return (
        <div className="absolute top-0 left-0 h-screen w-screen">
            <Canvas
                dpr={[1, 2]}
                gl={{
                    antialias: true,
                    preserveDrawingBuffer: true,
                }}
                camera={{
                    fov: 55,
                    near: 0.1,
                    far: 200,
                }}
            >
                <Scene />
            </Canvas>
        </div>
    );
}

function Header() {
    return (
        <header className="relative z-50 mx-7 flex max-lg:flex-col justify-between py-6 border-b border-white/60 pointer-events-auto">
            <div className="whitespace-nowrap">
                <h1 className="font-bold inline align-middle mr-2">Bulge Text Effect</h1>
            </div>
        </header>
    );
}

function Aside() {
    return (
        <div className="absolute top-1/2 right-16 text-lg">
            <p className="mb-4 opacity-50">TENDER</p>
            <p>
                App that helps <br />
                to find your best partner
            </p>
            <p className="mt-40 opacity-50">LAUNCH IN 2024</p>
        </div>
    );
}

function Credits() {
    return (
        <div className="flex fixed w-full justify-between bottom-0 p-8 pointer-events-none">
            <p className="pointer-events-auto">
                Made by{' '}
                <a href="https://twitter.com/romanjeanelie" className="underline">
                    @romanjeanelie
                </a>{' '}
                for{' '}
                <a href="https://twitter.com/codrops" className="underline">
                    @codrops
                </a>
            </p>
        </div>
    );
}

export default function BulgeTextPage() {
    return (
        <main
            className="font-sans min-h-screen overflow-hidden"
            style={{
                backgroundColor: '#101014',
                color: '#f0f0f0',
            }}
        >
            <Header />
            <Title3D />
            <Aside />
            <Credits />
        </main>
    );
}
