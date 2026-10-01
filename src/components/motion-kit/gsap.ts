'use client';

/**
 * Single client-only place where GSAP plugins are registered.
 * Import gsap + plugins from here instead of from 'gsap' directly.
 */
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { Flip } from 'gsap/Flip';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, CustomEase, DrawSVGPlugin, Flip);
    ScrollTrigger.config({ ignoreMobileResize: true });
    // verification tooling (Playwright replays) — only exposed when the URL has ?replay
    if (new URLSearchParams(window.location.search).has('replay')) Object.assign(window, { __ScrollTrigger: ScrollTrigger, __gsap: gsap });
}

export { CustomEase, DrawSVGPlugin, Flip, gsap, ScrollTrigger, SplitText, useGSAP };
