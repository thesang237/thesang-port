'use client';

import 'dialkit/styles.css';

import { useEffect, useRef, useState } from 'react';
import { DialRoot, useDialKit } from 'dialkit';
import { gsap } from 'gsap';

import { motion, useIglooUI } from '../store';
import { COLONY_CONFIG, colonyParams, IGLOO_CONFIG, iglooParams, tweakCommands } from '../tweaks';
import { ambience } from '../utils/sound';

import { GLYPHS } from './scramble';

type Target = 'igloo' | 'colony';

function ColonyBinder() {
    const v = useDialKit('Colony particles', COLONY_CONFIG, {
        id: 'igloo-colony',
        onAction: (action) => {
            if (action === 'shockwave') tweakCommands.shock = true;
            if (action === 'burst') {
                const ui = useIglooUI.getState();
                ui.set({ social: (ui.social + 1) % 3 });
            }
        },
    });
    useEffect(() => {
        Object.assign(colonyParams, {
            idleAmp: v.idle.amplitude,
            idleFreq: v.idle.frequency,
            idleSpeed: v.idle.speed,
            jitter: v.idle.jitter,
            breathe: v.idle.breathe,
            wisps: v.idle.wisps,
            radius: v.cursor.radius,
            radiusGain: v.cursor.radiusGain,
            drag: v.cursor.drag,
            chaos: v.cursor.chaos,
            accelChaos: v.cursor.accelChaos,
            spring: v.physics.spring,
            looseSpring: v.physics.looseSpring,
            damping: v.physics.damping,
            energyDecay: v.physics.energyDecay,
            burst: v.transition.burst,
            plume: v.transition.plume,
            morphDuration: v.transition.duration,
            size: v.look.size,
            glow: v.look.glow,
            tint: v.look.tint,
            tintA: v.look.tintA,
            tintB: v.look.tintB,
            tintC: v.look.tintC,
            paletteSpeed: v.look.paletteSpeed,
            scanline: v.look.scanline,
            twinkle: v.look.twinkle,
            autoSpin: v.figure.autoSpin,
        });
    }, [v]);
    return null;
}

function IglooBinder() {
    const v = useDialKit('Igloo', IGLOO_CONFIG, { id: 'igloo-hero' });
    useEffect(() => {
        Object.assign(iglooParams, {
            lift: v.hover.lift,
            reach: v.hover.reach,
            tilt: v.hover.tilt,
            response: v.hover.response,
            brickColor: v.bricks.color,
            roughness: v.bricks.roughness,
            sun: v.bricks.sun,
            sky: v.bricks.sky,
            lightIntensity: v.innerLight.intensity,
            lightColor: v.innerLight.color,
            lightDistance: v.innerLight.distance,
            lightHeight: v.innerLight.height,
            flicker: v.innerLight.flicker,
            shadows: v.innerLight.shadows,
            coreSize: v.source.coreSize,
            coreGlow: v.source.coreGlow,
            seamBacking: v.source.seamBacking,
            entranceGlow: v.source.entranceGlow,
        });
    }, [v]);
    return null;
}

/** Top-right "[ Tweak ]" toggle → inline DialKit panel for the scene on screen. */
export default function TweakPanel() {
    const section = useIglooUI((s) => s.section);
    const introDone = useIglooUI((s) => s.introDone);
    const detailOpen = useIglooUI((s) => s.detail >= 0);
    const [open, setOpen] = useState<Target | null>(null);
    const target: Target | null = !introDone || detailOpen ? null : section === 0 ? 'igloo' : section === 3 ? 'colony' : null;
    const shown = open && open === target ? open : null;

    const btn = useRef<HTMLButtonElement>(null);
    const label = useRef<HTMLSpanElement>(null);
    const panel = useRef<HTMLDivElement>(null);
    const text = shown ? 'Close' : 'Tweak';

    // button enters/leaves with the scenes that have a panel
    useEffect(() => {
        gsap.to(btn.current, { autoAlpha: target ? 1 : 0, y: target ? 0 : -8, duration: 0.5, ease: 'expo.out' });
    }, [target]);

    useEffect(() => {
        if (label.current) gsap.to(label.current, { duration: 0.45, scrambleText: { text, chars: GLYPHS, speed: 1 } });
    }, [text]);

    useEffect(() => {
        if (shown && panel.current)
            gsap.fromTo(panel.current, { autoAlpha: 0, y: -10, clipPath: 'inset(0 0 100% 0)' }, { autoAlpha: 1, y: 0, clipPath: 'inset(0 0 0% 0)', duration: 0.6, ease: 'expo.out' });
    }, [shown]);

    return (
        <div
            data-ig-ui
            data-lenis-prevent
            className="fixed right-[var(--ig-gutter)] top-[var(--ig-gutter)] z-[25] flex flex-col items-end"
            onPointerEnter={() => (motion.overUI = true)}
            onPointerLeave={() => (motion.overUI = false)}
        >
            <button
                ref={btn}
                type="button"
                onClick={() => {
                    ambience.tick(shown ? 900 : 1900);
                    setOpen(shown ? null : target);
                }}
                onMouseEnter={() => {
                    ambience.tick(2300);
                    if (label.current && !gsap.isTweening(label.current)) gsap.to(label.current, { duration: 0.4, scrambleText: { text, chars: GLYPHS, speed: 1 } });
                }}
                className="ig-bracket ig-tweak-btn invisible flex items-center gap-2 px-4 py-2 text-[11px] opacity-0 sm:text-xs"
                aria-expanded={!!shown}
            >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden className="ig-tweak-icon">
                    <path d="M1 3h6M10 3h1M1 9h2M6 9h5" />
                    <circle cx="8.5" cy="3" r="1.5" />
                    <circle cx="4.5" cy="9" r="1.5" />
                </svg>
                <span ref={label}>{text}</span>
            </button>

            {shown && (
                <div ref={panel} className="ig-tweak-panel mt-3 max-h-[min(72vh,640px)] w-[min(86vw,300px)] overflow-y-auto">
                    <DialRoot mode="inline" theme="dark" productionEnabled />
                    {shown === 'colony' ? <ColonyBinder /> : <IglooBinder />}
                </div>
            )}
        </div>
    );
}
