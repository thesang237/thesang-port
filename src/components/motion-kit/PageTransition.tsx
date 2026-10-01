'use client';

import { type AnchorHTMLAttributes, createContext, type MouseEvent, type ReactNode, use, useEffect, useRef } from 'react';

import { usePathname, useRouter } from '@/i18n/navigation';

import { ScrollTrigger } from './gsap';

type Hooks = {
    /** cover the screen; resolves when it is safe to swap the route */
    exit: (href: string) => Promise<void>;
    /** called after the new route rendered; reveal it */
    enter: (href: string) => Promise<void>;
};

type Ctx = {
    navigate: (href: string) => void;
    register: (hooks: Hooks) => () => void;
    busy: () => boolean;
};

const PageTransitionContext = createContext<Ctx | null>(null);
export const usePageTransition = () => use(PageTransitionContext);

const norm = (p: string) => (p.replace(/\/+$/, '') || '/').split('?')[0].split('#')[0];

/**
 * Minimal route-transition orchestrator for the App Router:
 * exit() → router.push → wait for the pathname to change + a paint → kill/refresh ScrollTriggers → enter().
 * Visuals live in whatever registers the hooks (one overlay per layout).
 */
export default function PageTransition({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const hooks = useRef<Hooks | null>(null);
    const pending = useRef<{ href: string; resolve: () => void } | null>(null);
    const running = useRef(false);

    useEffect(() => {
        const p = pending.current;
        if (p && norm(pathname) === norm(p.href)) {
            pending.current = null;
            // let the new tree mount & lay out before measuring/revealing
            requestAnimationFrame(() => requestAnimationFrame(p.resolve));
        }
    }, [pathname]);

    const navigate = async (href: string) => {
        if (running.current) return;
        const h = hooks.current;
        if (!h || norm(href) === norm(pathname)) {
            router.push(href);
            return;
        }
        running.current = true;
        try {
            await h.exit(href);
            await new Promise<void>((resolve) => {
                pending.current = { href, resolve };
                router.push(href, { scroll: false });
            });
            window.__lenis?.scrollTo(0, { immediate: true, force: true });
            window.scrollTo(0, 0);
            ScrollTrigger.refresh();
            await h.enter(href);
        } finally {
            running.current = false;
        }
    };

    const value: Ctx = {
        navigate: (href) => void navigate(href),
        register: (next) => {
            hooks.current = next;
            return () => {
                if (hooks.current === next) hooks.current = null;
            };
        },
        busy: () => running.current,
    };

    return <PageTransitionContext value={value}>{children}</PageTransitionContext>;
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string; children: ReactNode };

/** <a> that routes through the page transition (external / modified clicks behave natively) */
export function TransitionLink({ href, onClick, children, ...rest }: LinkProps) {
    const ctx = usePageTransition();
    const handle = (e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        if (e.defaultPrevented || !ctx) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        if (/^(https?:|mailto:|tel:|#)/.test(href)) return;
        e.preventDefault();
        ctx.navigate(href);
    };
    return (
        <a href={href} onClick={handle} {...rest}>
            {children}
        </a>
    );
}
