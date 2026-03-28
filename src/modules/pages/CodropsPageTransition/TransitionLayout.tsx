'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';

import { enterAnimation } from './animations/enter';
import { getTransition } from './animations/transitions';
import Nav from './components/Nav';

type PageEntry = {
    id: string;
    node: React.ReactNode;
    namespace: string;
};

function pathToNamespace(pathname: string): string {
    if (pathname.endsWith('/alternative-page')) return 'about';
    return 'home';
}

export default function TransitionLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const namespace = pathToNamespace(pathname);

    // Always-current children ref — updated every render, read in effects
    const latestChildren = useRef<React.ReactNode>(children);
    latestChildren.current = children;

    const [curr, setCurr] = useState<PageEntry>({ id: pathname, node: children, namespace });
    const [prev, setPrev] = useState<PageEntry | null>(null);

    const currRef = useRef<HTMLDivElement>(null);
    const prevRef = useRef<HTMLDivElement>(null);
    const isAnimating = useRef(false);

    // ── Initial enter animation ────────────────────────────────────────────────
    useEffect(() => {
        const el = currRef.current;
        if (!el) return;
        const result = enterAnimation(el, 0);
        // Cleanup ensures SplitText is reverted on React Strict Mode remount,
        // so the second run starts from clean markup (not double-split).
        return () => {
            result?.timeline.kill();
            result?.cleanup();
        };
    }, []); // intentionally empty — only on first mount

    // ── Navigation detection ───────────────────────────────────────────────────
    useEffect(() => {
        // Same page: no transition needed
        if (curr.id === pathname) return;

        // Snapshot old curr as prev (outgoing), set new page as curr (incoming).
        // latestChildren.current is always the fresh children from this render.
        const oldCurr = curr;
        setPrev(oldCurr);
        setCurr({ id: pathname, node: latestChildren.current, namespace });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]); // only pathname — children captured via ref

    // ── Run transition when prev is in DOM ─────────────────────────────────────
    useEffect(() => {
        if (!prev) return;
        if (isAnimating.current) return;

        const currentEl = prevRef.current;
        const nextEl = currRef.current;
        if (!currentEl || !nextEl) return;

        isAnimating.current = true;

        const transitionFn = getTransition(prev.namespace, namespace);
        const tl = transitionFn(currentEl, nextEl);
        const enterResult = enterAnimation(nextEl, 0.32);

        tl.then(() => {
            gsap.set(nextEl, {
                clearProps: 'clipPath,position,top,left,width,height,zIndex,opacity',
            });
            setPrev(null);
            isAnimating.current = false;
        });

        return () => {
            tl.kill();
            enterResult?.timeline.kill();
            enterResult?.cleanup();
            isAnimating.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prev]);

    return (
        <div className="codrops-root">
            <Nav />
            <main>
                {prev && (
                    <div ref={prevRef} data-transition="container" className="page_content">
                        {prev.node}
                    </div>
                )}
                <div ref={currRef} key={curr.id} data-transition="container" className="page_content">
                    {curr.node}
                </div>
            </main>
        </div>
    );
}
