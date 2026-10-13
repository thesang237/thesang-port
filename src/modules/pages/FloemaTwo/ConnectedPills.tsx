'use client';

import type { RefObject } from 'react';
import { useEffect, useId, useRef } from 'react';

import { gsap, motion } from './motion';
import { useFloema } from './Shell';

/** One small SVG surface keeps the necks attached while the HTML controls separate. */
export default function ConnectedPills({ rootRef, selector }: { rootRef: RefObject<HTMLElement | null>; selector: string }) {
    const svgRef = useRef<SVGSVGElement>(null);
    const pathRef = useRef<SVGPathElement>(null);
    const glowRef = useRef<SVGPathElement>(null);
    const gradientRef = useRef<SVGRadialGradientElement>(null);
    const id = useId().replace(/:/g, '');
    const { reduced } = useFloema();
    useEffect(() => {
        const root = rootRef.current;
        if (!root || !svgRef.current) return;
        const items = Array.from(root.querySelectorAll<HTMLElement>(selector));
        if (!items.length) return;
        let bounds = root.getBoundingClientRect();
        let sizes = items.map((item) => ({ x: item.offsetLeft, width: item.offsetWidth, height: item.offsetHeight }));
        let selected = -1;
        const gaps: Record<string, number> = Object.fromEntries(items.slice(1).map((_, i) => [`gap${i}`, 0]));
        const glow = { x: 0, y: 0, opacity: 0 };
        const shifts = items.map(() => 0);
        const draw = () => {
            const h = sizes[0].height;
            const radiusFor = (width: number) => Math.min(h * (width <= h * 1.1 ? 0.5 : 0.36), width / 2);
            let path = '';
            for (let i = 0; i < items.length; i++) {
                shifts[i] = items.slice(0, i).reduce((sum, _, j) => sum + gaps[`gap${j}`], 0);
                items[i].style.transform = `translateX(${shifts[i]}px)`;
                const { x: base, width: w } = sizes[i];
                const x = base + shifts[i];
                const radius = radiusFor(w);
                path += `M${x + radius},0H${x + w - radius}Q${x + w},0 ${x + w},${radius}V${h - radius}Q${x + w},${h} ${x + w - radius},${h}H${x + radius}Q${x},${h} ${x},${h - radius}V${radius}Q${x},0 ${x + radius},0Z`;
                if (i > 0) {
                    const previous = sizes[i - 1];
                    const left = previous.x + shifts[i - 1] + previous.width - radiusFor(previous.width);
                    const right = x + radius;
                    const mid = (left + right) / 2;
                    const shoulder = (right - left) * 0.25;
                    path += `M${left},0C${left + shoulder},0 ${mid - shoulder},${h * 0.32} ${mid},${h * 0.32}C${mid + shoulder},${h * 0.32} ${right - shoulder},0 ${right},0V${h}C${right - shoulder},${h} ${mid + shoulder},${h * 0.68} ${mid},${h * 0.68}C${mid - shoulder},${h * 0.68} ${left + shoulder},${h} ${left},${h}Z`;
                }
            }
            pathRef.current?.setAttribute('d', path);
            glowRef.current?.setAttribute('d', path);
            glowRef.current?.setAttribute('opacity', String(glow.opacity));
            gradientRef.current?.setAttribute('cx', String(glow.x));
            gradientRef.current?.setAttribute('cy', String(glow.y));
            gradientRef.current?.setAttribute('r', String(h * 1.6));
        };
        const choose = (index: number) => {
            if (selected === index) return;
            selected = index;
            items.slice(1).forEach((_, i) => {
                gsap.to(gaps, {
                    [`gap${i}`]: !reduced && index >= 0 && (i === index || i === index - 1) ? sizes[0].height * 0.58 : 0,
                    duration: motion.pillStretch,
                    ease: motion.ease,
                    overwrite: 'auto',
                    onUpdate: draw,
                });
            });
        };
        const move = (event: PointerEvent) => {
            if (event.pointerType === 'touch') return;
            const x = event.clientX - bounds.left;
            let closest = 0;
            let distance = Infinity;
            sizes.forEach((size, i) => {
                const next = Math.abs(x - (size.x + shifts[i] + size.width / 2));
                if (next < distance) {
                    distance = next;
                    closest = i;
                }
            });
            choose(closest);
            gsap.to(glow, { x, y: event.clientY - bounds.top, opacity: 1, duration: motion.pillGlow, ease: motion.ease, overwrite: true, onUpdate: draw });
        };
        const enter = (event: PointerEvent) => {
            bounds = root.getBoundingClientRect();
            move(event);
        };
        const reset = () => {
            choose(-1);
            gsap.to(glow, { opacity: 0, duration: motion.pillGlow, overwrite: true, onUpdate: draw });
        };
        const focus = (event: FocusEvent) => {
            const index = items.findIndex((item) => item === event.target || item.contains(event.target as Node));
            choose(index < 0 ? items.length - 1 : index);
        };
        const blur = (event: FocusEvent) => {
            if (!root.contains(event.relatedTarget as Node | null)) reset();
        };
        const resize = new ResizeObserver(() => {
            sizes = items.map((item) => ({ x: item.offsetLeft, width: item.offsetWidth, height: item.offsetHeight }));
            bounds = root.getBoundingClientRect();
            draw();
        });
        resize.observe(root);
        root.dataset.connected = 'true';
        draw();
        root.addEventListener('pointerenter', enter);
        root.addEventListener('pointermove', move);
        root.addEventListener('pointerleave', reset);
        root.addEventListener('focusin', focus);
        root.addEventListener('focusout', blur);
        return () => {
            resize.disconnect();
            gsap.killTweensOf(gaps);
            gsap.killTweensOf(glow);
            root.removeEventListener('pointerenter', enter);
            root.removeEventListener('pointermove', move);
            root.removeEventListener('pointerleave', reset);
            root.removeEventListener('focusin', focus);
            root.removeEventListener('focusout', blur);
            delete root.dataset.connected;
            items.forEach((item) => item.style.removeProperty('transform'));
        };
    }, [reduced, rootRef, selector]);
    return (
        <svg className="f2-connected-surface" ref={svgRef} aria-hidden="true">
            <defs>
                <radialGradient id={`f2-glow-${id}`} ref={gradientRef} gradientUnits="userSpaceOnUse">
                    <stop stopColor="var(--f2-yellow)" stopOpacity="0.42" />
                    <stop offset="1" stopColor="var(--f2-yellow)" stopOpacity="0" />
                </radialGradient>
            </defs>
            <path ref={pathRef} fill="var(--f2-pill-fill, white)" />
            <path ref={glowRef} fill={`url(#f2-glow-${id})`} opacity="0" />
        </svg>
    );
}
