'use client';

import './lando.scss';

import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { ScrollTrigger } from '@/components/motion-kit/gsap';
import PageTransition from '@/components/motion-kit/PageTransition';
import SmoothScroll from '@/components/motion-kit/SmoothScroll';

import Header from './shell/Header';
import Menu from './shell/Menu';
import Overlay from './shell/Overlay';

type Props = { className?: string; children: ReactNode };

const LENIS_OPTIONS = { lerp: 0.1 };

export default function LandoShell({ className, children }: Props) {
    useEffect(() => {
        window.history.scrollRestoration = 'manual';
        const refresh = () => ScrollTrigger.refresh();
        document.fonts.ready.then(refresh);
        window.addEventListener('load', refresh);
        return () => window.removeEventListener('load', refresh);
    }, []);

    return (
        <div className={`ln${className ? ` ${className}` : ''}`}>
            <SmoothScroll options={LENIS_OPTIONS}>
                <PageTransition>
                    <Header />
                    <Menu />
                    <div className="ln-page">{children}</div>
                    <Overlay />
                </PageTransition>
            </SmoothScroll>
        </div>
    );
}
