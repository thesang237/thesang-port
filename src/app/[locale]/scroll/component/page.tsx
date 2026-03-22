'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import { motion } from 'framer-motion';
import gsap from 'gsap';

import { CodeBlock } from '@/components/code-block';
import { E_OUT, FadeIn, NOISE_BG } from '@/components/fade-in';

gsap.registerPlugin(useGSAP);

// ─── primitives ───────────────────────────────────────────────────────────────

function Pill({ children }: { children: React.ReactNode }) {
    return (
        <code className="inline-block bg-zinc-800/80 border border-zinc-700/60 text-zinc-200 font-mono rounded px-1.5 py-0.5" style={{ fontSize: '12px' }}>
            {children}
        </code>
    );
}

function Step({ n, label }: { n: number; label: string }) {
    return (
        <div className="flex items-center gap-3 mb-5">
            <span
                className="inline-flex items-center justify-center size-8 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 font-black font-mono shrink-0"
                style={{ fontSize: '13px' }}
            >
                {n}
            </span>
            <h2 className="text-2xl font-black tracking-tight">{label}</h2>
        </div>
    );
}

function Rule() {
    return <div className="my-16 h-px bg-gradient-to-r from-orange-500/20 via-orange-500/5 to-transparent" />;
}

function _Tag({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded font-mono tracking-wider uppercase border bg-orange-500/10 text-orange-400 border-orange-500/20" style={{ fontSize: '10px' }}>
            {children}
        </span>
    );
}

function Callout({ children, variant = 'orange' }: { children: React.ReactNode; variant?: 'orange' | 'amber' | 'sky' | 'rose' }) {
    const c = {
        orange: 'bg-orange-500/5 border-orange-500/20 text-orange-200/90',
        amber: 'bg-amber-500/5  border-amber-500/20  text-amber-200/90',
        sky: 'bg-sky-500/5    border-sky-500/20    text-sky-200/90',
        rose: 'bg-rose-500/5   border-rose-500/20   text-rose-200/90',
    };
    return (
        <div className={`rounded-xl border px-5 py-4 leading-relaxed ${c[variant]}`} style={{ fontSize: '14px' }}>
            {children}
        </div>
    );
}

// Split two code blocks with a divider label
function Diff({
    beforeLang = 'html',
    afterLang = 'tsx',
    beforeLabel = 'Before (vanilla)',
    afterLabel = 'After (Next.js)',
    before,
    after,
    beforeHighlight,
    afterHighlight,
}: {
    beforeLang?: string;
    afterLang?: string;
    beforeLabel?: string;
    afterLabel?: string;
    before: string;
    after: string;
    beforeHighlight?: string[];
    afterHighlight?: string[];
}) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
                <p className="font-mono text-rose-400/80 flex items-center gap-2" style={{ fontSize: '11px' }}>
                    <span className="size-2 rounded-full bg-rose-400/60 inline-block" />
                    {beforeLabel}
                </p>
                <CodeBlock lang={beforeLang} highlight={beforeHighlight}>
                    {before}
                </CodeBlock>
            </div>
            <div className="flex flex-col gap-2">
                <p className="font-mono text-emerald-400/80 flex items-center gap-2" style={{ fontSize: '11px' }}>
                    <span className="size-2 rounded-full bg-emerald-400/60 inline-block" />
                    {afterLabel}
                </p>
                <CodeBlock lang={afterLang} highlight={afterHighlight}>
                    {after}
                </CodeBlock>
            </div>
        </div>
    );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
    const ref = useRef<HTMLElement>(null);
    useGSAP(
        () => {
            gsap.from('.cc-char', { y: 65, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.02 });
            gsap.from('.cc-sub', { y: 16, opacity: 0, duration: 0.55, ease: 'power2.out', delay: 0.5 });
            gsap.from('.cc-tag', { y: 8, opacity: 0, duration: 0.4, ease: 'power2.out', stagger: 0.06, delay: 0.75 });
        },
        { scope: ref },
    );

    const lines = ['HTML / JS', '→ Next.js'];
    const tags = ['use client', 'CSS modules', 'useRef', 'useGSAP', 'next/link', 'layout'];

    return (
        <section ref={ref} className="relative px-6 md:px-12 xl:px-24 pt-32 pb-20 overflow-hidden">
            <div
                className="absolute top-16 left-1/2 -translate-x-1/2 w-[600px] h-[260px] pointer-events-none"
                style={{ background: 'radial-gradient(ellipse, rgba(249,115,22,0.06) 0%, transparent 70%)' }}
            />

            <div className="flex flex-wrap gap-2 mb-8">
                {tags.map((t) => (
                    <span key={t} className="cc-tag px-3 py-1 rounded-full border border-orange-500/25 text-orange-400 font-mono" style={{ fontSize: '11px' }}>
                        {t}
                    </span>
                ))}
            </div>

            <h1 className="font-black leading-[0.9] tracking-tight mb-6" style={{ fontSize: 'clamp(44px, 7vw, 90px)' }}>
                {lines.map((line, li) => (
                    <div key={li} className="overflow-hidden">
                        {line.split('').map((ch, ci) => (
                            <span key={ci} className="cc-char inline-block" style={{ color: li === 1 ? '#fb923c' : '#fff', whiteSpace: ch === ' ' ? 'pre' : undefined }}>
                                {ch}
                            </span>
                        ))}
                    </div>
                ))}
            </h1>

            <p className="cc-sub text-zinc-400 max-w-2xl leading-relaxed mb-8" style={{ fontSize: '18px' }}>
                A step-by-step walkthrough converting the Horizontal Blinds demo from plain HTML&nbsp;+&nbsp;JS into a clean, idiomatic Next.js component — one decision at a time, nothing added that
                isn&apos;t needed.
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-10" style={{ fontSize: '14px' }}>
                <Link
                    href="/scroll/1"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-300 hover:bg-orange-500/25 transition-colors font-mono"
                >
                    /scroll/1 — see the result →
                </Link>
                <Link href="/scroll/learn" className="text-zinc-500 hover:text-zinc-300 transition-colors font-mono">
                    ← technique guide
                </Link>
            </div>

            <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.85, ease: E_OUT, delay: 0.95 }}
                style={{ transformOrigin: 'left' }}
                className="h-px bg-gradient-to-r from-orange-500/40 via-orange-500/10 to-transparent"
            />
        </section>
    );
}

// ─── 0. File structure ────────────────────────────────────────────────────────

function FileStructureSection() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-12">
            <FadeIn>
                <Step n={1} label="Decide the file structure first" />
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    Before writing a single line, decide where everything lives. The rule is simple: the <strong className="text-white">page file is a thin wrapper</strong> — it only imports the
                    component. All logic goes in <Pill>src/modules/</Pill>. Assets go in <Pill>public/</Pill>.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <p className="font-mono text-rose-400/80 flex items-center gap-2 mb-2" style={{ fontSize: '11px' }}>
                            <span className="size-2 rounded-full bg-rose-400/60 inline-block" />
                            Original file layout
                        </p>
                        <CodeBlock lang="bash">
                            {`Scroll-Transition-main/
├── index.html          ← HTML + inline nav
├── css/
│   └── style.css       ← global styles
├── js/
│   ├── gsap.min.js     ← bundled library
│   ├── ScrollTrigger.min.js
│   ├── lenis.min.js
│   └── script.js       ← all animation logic
└── img/
    ├── 1.webp
    └── ...`}
                        </CodeBlock>
                    </div>
                    <div>
                        <p className="font-mono text-emerald-400/80 flex items-center gap-2 mb-2" style={{ fontSize: '11px' }}>
                            <span className="size-2 rounded-full bg-emerald-400/60 inline-block" />
                            Next.js file layout
                        </p>
                        <CodeBlock lang="bash">
                            {`src/
├── app/[locale]/scroll/
│   ├── layout.tsx          ← Lenis lives here
│   ├── 1/page.tsx          ← thin wrapper only
│   └── component/page.tsx
├── modules/pages/ScrollTransition/
│   ├── HorizontalBlinds.tsx ← all logic here
│   └── scroll.module.css   ← scoped styles
public/
└── images/scroll-transition/
    ├── 1.webp              ← served statically
    └── ...`}
                        </CodeBlock>
                    </div>
                </div>
            </FadeIn>

            <FadeIn delay={0.2}>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                        { title: 'page.tsx = thin wrapper', body: 'Just imports and renders the component. No logic. Makes the component reusable outside this route if needed.' },
                        { title: 'modules/ = all logic', body: 'Component, CSS module, and types co-located. Portable — can move the folder without touching app/ routing.' },
                        { title: 'public/ = static assets', body: 'Files in public/ are served at the root URL. /images/scroll-transition/1.webp just works — no imports needed.' },
                    ].map(({ title, body }) => (
                        <div key={title} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                            <p className="text-orange-300 font-bold mb-2" style={{ fontSize: '13px' }}>
                                {title}
                            </p>
                            <p className="text-zinc-400 leading-relaxed" style={{ fontSize: '13px' }}>
                                {body}
                            </p>
                        </div>
                    ))}
                </div>
            </FadeIn>
        </section>
    );
}

// ─── 2. use client ────────────────────────────────────────────────────────────

function UseClientSection() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-12">
            <FadeIn>
                <Step n={2} label={`Add 'use client' — and only where needed`} />
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    Next.js App Router defaults to Server Components. Anything that uses browser APIs (<Pill>window</Pill>, <Pill>document</Pill>), React hooks (<Pill>useRef</Pill>,{' '}
                    <Pill>useEffect</Pill>), or event listeners needs <Pill>&apos;use client&apos;</Pill> at the top.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <CodeBlock lang="tsx" highlight={["'use client'"]}>
                        {`// src/modules/pages/ScrollTransition/HorizontalBlinds.tsx
'use client';
//  ^^^^^^^^^^
//  Must be first line — before any imports.
//  Tells Next.js this file runs in the browser.

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
// ...`}
                    </CodeBlock>
                    <div className="space-y-3">
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-2" style={{ fontSize: '13px' }}>
                            <p className="text-orange-400 font-mono mb-3" style={{ fontSize: '11px' }}>
                                NEEDS &apos;use client&apos;
                            </p>
                            {['useRef, useState, useEffect, useGSAP', 'window, document, navigator', 'Event listeners (scroll, resize)', 'GSAP, ScrollTrigger — browser-only'].map((item) => (
                                <div key={item} className="flex items-center gap-2">
                                    <span className="text-emerald-400">✓</span>
                                    <span className="text-zinc-300 font-mono" style={{ fontSize: '12px' }}>
                                        {item}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-2" style={{ fontSize: '13px' }}>
                            <p className="text-zinc-500 font-mono mb-3" style={{ fontSize: '11px' }}>
                                STAYS SERVER COMPONENT
                            </p>
                            {['layout.tsx (wraps children)', 'page.tsx thin wrapper (no hooks)', 'Pure display components (no state)'].map((item) => (
                                <div key={item} className="flex items-center gap-2">
                                    <span className="text-zinc-500">○</span>
                                    <span className="text-zinc-400 font-mono" style={{ fontSize: '12px' }}>
                                        {item}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <Callout>
                            The page file <Pill>1/page.tsx</Pill> does not need <Pill>&apos;use client&apos;</Pill> because it only imports and renders <Pill>{'<HorizontalBlinds />'}</Pill> — no
                            browser APIs.
                        </Callout>
                    </div>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── 3. HTML → JSX ────────────────────────────────────────────────────────────

function HtmlToJsxSection() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-12">
            <FadeIn>
                <Step n={3} label="Convert HTML to JSX" />
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    JSX looks like HTML but has a handful of strict rules. Most are mechanical find-and-replaces; the SVG attributes stay mostly unchanged (a plus of this approach).
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <Diff
                    before={`<!-- HTML -->
<section class="stage">
  <div class="layers">

    <!-- SVG mask layer -->
    <svg class="layer"
         viewBox="0 0 100 100"
         preserveAspectRatio="none">
      <defs>
        <mask id="mask1" maskUnits="userSpaceOnUse">
          <rect x="0" y="0"
                width="100" height="100"
                fill="black" />
          <g id="blinds1"></g>
        </mask>
      </defs>
      <image href="img/1.webp"
             x="0" y="0"
             width="100" height="100"
             preserveAspectRatio="xMidYMid slice"
             mask="url(#mask1)"
             style="filter: brightness(0.8)" />
    </svg>

  </div>
</section>`}
                    after={`{/* JSX */}
<section className="stage"> {/* class → className */}
  <div className="layers">

    {/* SVG — attributes unchanged */}
    <svg className="layer"
         viewBox="0 0 100 100"
         preserveAspectRatio="none">
      <defs>
        <mask id="mask1" maskUnits="userSpaceOnUse">
          <rect x="0" y="0"
                width="100" height="100"
                fill="black" />
          {/* self-closing if empty */}
          <g id="blinds1" />
        </mask>
      </defs>
      <image href="/images/.../1.webp"
             x="0" y="0"
             width="100" height="100"
             preserveAspectRatio="xMidYMid slice"
             mask="url(#mask1)"
             style={{ filter: 'brightness(0.8)' }} />
             {/*  ^^ object, not string       ^^ */}
    </svg>

  </div>
</section>`}
                    afterHighlight={['className', 'style={{', "'use client'"]}
                />
            </FadeIn>

            <FadeIn delay={0.2}>
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { html: 'class="stage"', jsx: 'className="stage"' },
                        { html: '<!-- comment -->', jsx: '{/* comment */}' },
                        { html: 'style="color: red"', jsx: 'style={{ color: "red" }}' },
                        { html: '<br>', jsx: '<br />' },
                    ].map(({ html, jsx }) => (
                        <div key={html} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 space-y-2">
                            <div className="font-mono text-rose-400/80" style={{ fontSize: '11px' }}>
                                {html}
                            </div>
                            <div className="w-4 h-px bg-zinc-700" />
                            <div className="font-mono text-emerald-400/80" style={{ fontSize: '11px' }}>
                                {jsx}
                            </div>
                        </div>
                    ))}
                </div>
            </FadeIn>

            <FadeIn delay={0.3}>
                <div className="mt-6">
                    <Callout variant="sky">
                        <strong className="text-sky-300">SVG attributes are the exception.</strong> SVG uses camelCase (<Pill>viewBox</Pill>, <Pill>preserveAspectRatio</Pill>, <Pill>maskUnits</Pill>)
                        in both HTML <em>and</em> JSX. You copy them verbatim — no changes needed.
                    </Callout>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── 4. CSS modules ───────────────────────────────────────────────────────────

function CssModuleSection() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-12">
            <FadeIn>
                <Step n={4} label="CSS file → CSS module" />
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    Rename <Pill>style.css</Pill> to <Pill>scroll.module.css</Pill>, co-locate it next to the component, and import it as an object. Next.js scopes every class name automatically — no
                    more global collisions.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <Diff
                    beforeLang="css"
                    afterLang="css"
                    beforeLabel="style.css (global)"
                    afterLabel="scroll.module.css (scoped)"
                    before={`/* style.css — loaded globally,
   can clash with any other page */

.stage {
  height: 500vh;
  position: relative;
}

.layers {
  position: sticky;
  top: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.txt {
  position: absolute;
  clip-path: inset(100% 0 0 0);
  transform: translateY(40px);
}`}
                    after={`/* scroll.module.css — scoped to this component.
   Class names are hashed at build time:
   .stage → ._stage_abc12_1  */

.stage {
  height: 500vh;
  position: relative;
}

.layers {
  position: sticky;
  top: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.txt {
  position: absolute;
  clip-path: inset(100% 0 0 0);
  transform: translateY(40px);
}`}
                />
            </FadeIn>

            <FadeIn delay={0.2}>
                <div className="mt-6">
                    <Diff
                        beforeLang="html"
                        afterLang="tsx"
                        beforeLabel="HTML: string class names"
                        afterLabel="JSX: import + object access"
                        before={`<!-- link tag in <head> -->
<link rel="stylesheet" href="css/style.css">

<!-- class names are bare strings -->
<section class="stage">
  <div class="layers">
    <div class="txt">...</div>
  </div>
</section>`}
                        after={`// import at top of component file
import styles from './scroll.module.css';

// access via styles object
<section className={styles.stage}>
  <div className={styles.layers}>
    <div className={styles.txt}>...</div>
  </div>
</section>`}
                        afterHighlight={['styles.']}
                    />
                </div>
            </FadeIn>

            <FadeIn delay={0.3}>
                <div className="mt-6">
                    <Callout variant="rose">
                        <strong className="text-rose-300">CSS modules break GSAP class selectors.</strong> <Pill>gsap.utils.toArray(&apos;.txt&apos;)</Pill> queries by the original class name, but the
                        module hashes it to something like <Pill>.txt_abc12</Pill>. The fix: use <Pill>useRef</Pill> arrays and pass elements directly to GSAP instead.
                    </Callout>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── 5. Script tags → imports ─────────────────────────────────────────────────

function ScriptTagsSection() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-12">
            <FadeIn>
                <Step n={5} label="Script tags → npm imports" />
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    Replace every <Pill>{'<script src="...">'} </Pill> with a proper npm import. Bundling via Next.js means one optimised bundle — no extra network requests for separate library files.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <Diff
                    before={`<!-- index.html — 4 separate script requests -->
<script src="js/gsap.min.js"></script>
<script src="js/ScrollTrigger.min.js"></script>
<script src="js/lenis.min.js"></script>
<script src="js/script.js" defer></script>

<!-- gsap.registerPlugin runs inside script.js -->
`}
                    after={`// HorizontalBlinds.tsx — single bundled entry
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
// Lenis is handled in layout.tsx — not here

// Register once at MODULE level (outside component)
// Running inside the component would re-register
// on every render
gsap.registerPlugin(useGSAP, ScrollTrigger);`}
                    afterHighlight={['gsap.registerPlugin', 'MODULE level']}
                />
            </FadeIn>

            <FadeIn delay={0.2}>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                        { pkg: 'gsap', install: 'pnpm add gsap', note: 'Core library' },
                        { pkg: '@gsap/react', install: 'pnpm add @gsap/react', note: 'useGSAP hook' },
                        { pkg: 'lenis', install: 'pnpm add lenis', note: 'Already in layout' },
                    ].map(({ pkg, install, note }) => (
                        <div key={pkg} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 font-mono">
                            <div className="text-orange-300 font-bold mb-1" style={{ fontSize: '13px' }}>
                                {pkg}
                            </div>
                            <div className="text-zinc-500 mb-2" style={{ fontSize: '11px' }}>
                                {note}
                            </div>
                            <div className="text-zinc-300 bg-zinc-950/60 rounded px-2 py-1" style={{ fontSize: '11px' }}>
                                {install}
                            </div>
                        </div>
                    ))}
                </div>
            </FadeIn>
        </section>
    );
}

// ─── 6. Lenis → layout ────────────────────────────────────────────────────────

function LenisLayoutSection() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-12">
            <FadeIn>
                <Step n={6} label="Move Lenis into layout.tsx" />
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    The original script initialises Lenis in every page. In Next.js, Lenis belongs in a <strong className="text-white">layout</strong> — it initialises once, persists across
                    navigation, and never re-creates itself when moving between <Pill>/scroll/1</Pill> and <Pill>/scroll/2</Pill>.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <Diff
                    beforeLang="js"
                    afterLang="tsx"
                    beforeLabel="script.js — Lenis per page"
                    afterLabel="layout.tsx — Lenis once for all /scroll/* pages"
                    before={`// script.js — runs on every page load
const isTouch = window.matchMedia(
  '(pointer: coarse)'
).matches;

const lenis = new Lenis({
  lerp: 0.15,
  smoothWheel: true,
  smoothTouch: !isTouch,
});

lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});`}
                    after={`// src/app/[locale]/scroll/layout.tsx
// Server component — no 'use client' needed here
import LenisScroller from '@/components/animation/lenis';

export default function ScrollLayout({ children }) {
  return <LenisScroller>{children}</LenisScroller>;
}

// LenisScroller (already exists in this project):
// - Creates ReactLenis with autoRaf: false
// - Drives lenis.raf() from gsap.ticker
// - Persists across /scroll/* navigations`}
                    afterHighlight={['layout.tsx', 'LenisScroller']}
                />
            </FadeIn>

            <FadeIn delay={0.2}>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Callout>
                        <strong className="text-orange-300">Layout vs Component:</strong> any route segment can have a <Pill>layout.tsx</Pill>. Children render inside it.{' '}
                        <Pill>src/app/[locale]/scroll/layout.tsx</Pill> wraps <em>all</em> four scroll pages — Lenis initialises once and stays alive while navigating between them.
                    </Callout>
                    <Callout variant="amber">
                        <strong className="text-amber-300">Don&apos;t import Lenis in the component.</strong> If you initialise Lenis inside the component, it re-creates on every mount (page
                        navigate). Worse, if two components both create a Lenis instance you get double-smoothing — the scroll feels broken.
                    </Callout>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── 7. getElementById → useRef ───────────────────────────────────────────────

function UseRefSection() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-12">
            <FadeIn>
                <Step n={7} label="getElementById → useRef" />
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    The original script queries elements by <Pill>id</Pill>. In React, refs are the idiomatic way to hold DOM references — they are set during render, available immediately after
                    mount, and co-located with the component rather than scattered globally.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <Diff
                    beforeLang="js"
                    afterLang="tsx"
                    beforeLabel="script.js — querying by id"
                    afterLabel="HorizontalBlinds.tsx — refs"
                    before={`// HTML has id="blinds1", id="blinds2" etc.
// Script queries them by string
function createBlinds(groupId) {
  const g = document.getElementById(groupId);
  if (!g) return null;
  // ...
}

// Called with string IDs
createBlinds('blinds1');
createBlinds('blinds2');
createBlinds('blinds3');`}
                    after={`// Declare ref array at component top level
const groupRefs = useRef<(SVGGElement | null)[]>(
  [null, null, null]
);

// Attach via inline ref callback in JSX
{IMAGES.map((_, i) => (
  <svg key={i}>
    <mask id={\`h-mask-\${i}\`} ...>
      <g ref={(el) => { groupRefs.current[i] = el; }} />
    </mask>
  </svg>
))}

// Use the ref directly — no string lookup
function createBlinds(g: SVGGElement) { ... }
groupRefs.current.forEach(g => {
  if (g) createBlinds(g);
});`}
                    afterHighlight={['useRef', 'groupRefs.current', 'ref={(el)']}
                />
            </FadeIn>

            <FadeIn delay={0.2}>
                <div className="mt-6">
                    <CodeBlock lang="tsx" highlight={['stageRef', 'svgRefs', 'groupRefs', 'textRefs', 'fillRefs']}>
                        {`// All refs declared once at the top of the component
// — one per "category" of DOM element

const stageRef  = useRef<HTMLElement>(null);
// ↑ the 500vh section — used as ScrollTrigger trigger

const svgRefs   = useRef<(SVGSVGElement | null)[]>([null, null, null]);
// ↑ the 3 SVG layers — viewBox updated on resize

const groupRefs = useRef<(SVGGElement | null)[]>([null, null, null]);
// ↑ the mask <g> elements — rects appended here

const textRefs  = useRef<(HTMLDivElement | null)[]>([null, null, null]);
// ↑ the .txt overlays — GSAP clip-path animations

const fillRefs  = useRef<(HTMLDivElement | null)[]>([null, null, null]);
// ↑ the progress bar fills — width written directly`}
                    </CodeBlock>
                </div>
            </FadeIn>

            <FadeIn delay={0.3}>
                <div className="mt-4">
                    <Callout variant="sky">
                        <strong className="text-sky-300">Inline ref callback for arrays:</strong> <Pill>{`ref={(el) => { refs.current[i] = el; }}`}</Pill> is the standard pattern for populating a ref
                        array inside a <Pill>.map()</Pill>. It runs during React&apos;s commit phase — by the time <Pill>useGSAP</Pill> fires, all refs are populated.
                    </Callout>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── 8. Global execution → useGSAP ───────────────────────────────────────────

function UseGSAPSection() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-12">
            <FadeIn>
                <Step n={8} label="Global JS execution → useGSAP" />
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    The original script runs top-to-bottom immediately when loaded. In React, any code touching the DOM must wait until after render. <Pill>useGSAP</Pill> is the equivalent — it fires
                    after mount, auto-cleans all GSAP instances on unmount, and accepts a cleanup return for non-GSAP teardown.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <Diff
                    beforeLang="js"
                    afterLang="tsx"
                    beforeLabel="script.js — runs immediately"
                    afterLabel="HorizontalBlinds.tsx — runs after mount"
                    before={`// script.js
// Everything here runs as soon as the browser
// parses this file — DOM is guaranteed to exist
// because the <script> tag is at the bottom

gsap.registerPlugin(ScrollTrigger);

// ...function definitions above...

// Direct execution — no wrapper needed
updateLayout();
initProgressBar();

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(updateLayout, 250);
});

// No cleanup — page reload resets everything`}
                    after={`// HorizontalBlinds.tsx
// useGSAP fires after React has committed the DOM
// Equivalent to componentDidMount

useGSAP(() => {
  // ↑ all functions defined inside here have
  //   closure access to refs.current

  // Direct execution — same as the original
  updateLayout();
  initProgressBar();

  let timer: ReturnType<typeof setTimeout>;
  const onResize = () => {
    clearTimeout(timer);
    timer = setTimeout(updateLayout, 250);
  };
  window.addEventListener('resize', onResize);

  // Return fn = non-GSAP cleanup on unmount
  // GSAP tweens/ScrollTriggers killed automatically
  return () => {
    window.removeEventListener('resize', onResize);
    clearTimeout(timer);
  };
}); // no deps = run once after first mount`}
                    afterHighlight={['useGSAP', 'return () =>', 'no deps']}
                />
            </FadeIn>

            <FadeIn delay={0.2}>
                <div className="mt-6">
                    <Callout variant="rose">
                        <strong className="text-rose-300">
                            Never access <Pill>ref.current</Pill> outside <Pill>useGSAP</Pill> (or useEffect).
                        </strong>{' '}
                        During the initial render, refs are <Pill>null</Pill>. The DOM doesn&apos;t exist yet. <Pill>useGSAP</Pill> fires <em>after</em> the commit phase — at that point all{' '}
                        <Pill>ref.current</Pill> values are populated and safe to use.
                    </Callout>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── 9. Navigation → next/link ────────────────────────────────────────────────

function NavigationSection() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-12">
            <FadeIn>
                <Step n={9} label={`<a href> → <Link href>`} />
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    Replace all internal <Pill>{'<a>'}</Pill> tags with Next.js <Pill>{'<Link>'}</Pill>. This enables client-side navigation — the page doesn&apos;t reload, Lenis stays alive, and
                    transitions are instant. External links keep using <Pill>{'<a>'}</Pill>.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <Diff
                    before={`<!-- index.html navigation -->
<nav class="frame__demos">
  <a href="index.html" class="current">
    Horizontal Blinds
  </a>
  <a href="index2.html">Random Grid</a>
  <a href="index3.html">Vertical Blinds</a>
  <a href="index4.html">Column Grid</a>
</nav>

<!-- footer next link -->
<div class="spacer">
  <h1>
    <a href="index2.html">Next: Random Grid</a>
  </h1>
</div>`}
                    after={`// HorizontalBlinds.tsx
import Link from 'next/link';

<nav className={styles.nav}>
  <div className={styles.navLinks}>
    {/* current page: plain span, not a link */}
    <span className={styles.navCurrent}>
      Horizontal Blinds
    </span>
    <Link href="/scroll/2">Random Grid</Link>
    <Link href="/scroll/3">Vertical Blinds</Link>
    <Link href="/scroll/4">Column Grid</Link>
  </div>
</nav>

<div className={styles.spacer}>
  <h1>
    <Link href="/scroll/2">Next: Random Grid →</Link>
  </h1>
</div>`}
                    afterHighlight={['Link', 'next/link']}
                />
            </FadeIn>

            <FadeIn delay={0.2}>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Callout>
                        <strong className="text-orange-300">current page = span, not Link.</strong> The active nav item should not be a clickable link. Using a <Pill>{'<span>'}</Pill> prevents the
                        page navigating to itself, matches the original <Pill>class=&quot;current&quot;</Pill> visual, and is more accessible.
                    </Callout>
                    <Callout variant="sky">
                        <strong className="text-sky-300">
                            External links still use <Pill>{'<a>'}</Pill>.
                        </strong>{' '}
                        Next.js <Pill>Link</Pill> is for internal routes only. For external URLs add <Pill>target=&quot;_blank&quot; rel=&quot;noopener noreferrer&quot;</Pill> to a regular anchor tag.
                    </Callout>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── 10. Page wrapper ─────────────────────────────────────────────────────────

function PageWrapperSection() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-12">
            <FadeIn>
                <Step n={10} label="The page file — keep it thin" />
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    The file at <Pill>app/[locale]/scroll/1/page.tsx</Pill> is a routing convention, not a component. Keep it as thin as possible — import and render. No logic, no hooks, no styles.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <CodeBlock lang="tsx" highlight={['HorizontalBlinds']}>
                        {`// src/app/[locale]/scroll/1/page.tsx
// ← This is a Server Component (no 'use client')
// ← It has no state, no hooks, no browser APIs

import HorizontalBlinds
  from '@/modules/pages/ScrollTransition/HorizontalBlinds';

export default function Page() {
  return <HorizontalBlinds />;
}

// That's it. 5 lines.`}
                    </CodeBlock>
                    <div className="space-y-3">
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-3" style={{ fontSize: '14px' }}>
                            <p className="text-orange-400 font-mono" style={{ fontSize: '11px' }}>
                                WHY SEPARATE THEM?
                            </p>
                            {[
                                { reason: 'Reusability', detail: 'The component can be rendered anywhere — another page, a modal, a test — without changing the route.' },
                                { reason: 'Testability', detail: 'You can unit-test HorizontalBlinds in isolation without the Next.js router.' },
                                { reason: 'Clarity', detail: 'The page file is the "router glue". The component file is the "feature". Mixing them makes both harder to read.' },
                            ].map(({ reason, detail }) => (
                                <div key={reason} className="flex gap-3 items-start">
                                    <span className="text-orange-400 font-mono shrink-0 mt-0.5" style={{ fontSize: '11px' }}>
                                        {reason}
                                    </span>
                                    <span className="text-zinc-400">{detail}</span>
                                </div>
                            ))}
                        </div>
                        <Callout variant="amber">
                            The locale segment <Pill>[locale]</Pill> is handled by <Pill>next-intl</Pill>. The layout at <Pill>app/[locale]/scroll/layout.tsx</Pill> applies to all four scroll pages
                            automatically — you only write Lenis setup once.
                        </Callout>
                    </div>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── Final: full result ───────────────────────────────────────────────────────

function FinalSection() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-12">
            <FadeIn>
                <h2 className="text-2xl font-black tracking-tight mb-2">The complete conversion at a glance</h2>
                <p className="text-zinc-400 mb-8 leading-relaxed" style={{ fontSize: '15px' }}>
                    Every decision mapped from the original to its Next.js equivalent.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse" style={{ fontSize: '13px' }}>
                        <thead>
                            <tr className="border-b border-zinc-800">
                                <th className="text-left py-3 pr-6 text-zinc-500 font-mono font-normal" style={{ fontSize: '11px' }}>
                                    ORIGINAL
                                </th>
                                <th className="text-left py-3 pr-6 text-zinc-500 font-mono font-normal" style={{ fontSize: '11px' }}>
                                    NEXT.JS
                                </th>
                                <th className="text-left py-3 text-zinc-500 font-mono font-normal" style={{ fontSize: '11px' }}>
                                    REASON
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { from: '<script src="gsap.min.js">', to: 'import gsap from "gsap"', why: 'npm bundle — one request, tree-shaken' },
                                { from: 'new Lenis() in script.js', to: 'LenisScroller in layout.tsx', why: 'persists across page navigations' },
                                { from: 'gsap.registerPlugin() inline', to: 'at module level, once', why: 're-registering on every render is a no-op but wasteful' },
                                { from: 'updateLayout() at top level', to: 'inside useGSAP()', why: 'DOM must exist before touching it' },
                                { from: 'document.getElementById()', to: 'useRef + ref={(el) => {}}', why: 'idiomatic React, co-located, no global DOM search' },
                                { from: 'gsap.utils.toArray(".txt")', to: 'textRefs.current array', why: 'CSS modules hash class names — string selectors break' },
                                { from: 'window.addEventListener cleanup', to: 'return () => removeEventListener', why: 'useGSAP cleanup prevents memory leak on unmount' },
                                { from: 'class="stage"', to: 'className={styles.stage}', why: 'JSX + CSS modules scoping' },
                                { from: '<a href="index2.html">', to: '<Link href="/scroll/2">', why: 'client-side navigation, no page reload' },
                                { from: 'style="filter: brightness(0.8)"', to: 'style={{ filter: "brightness(0.8)" }}', why: 'JSX inline style is an object, not a string' },
                            ].map(({ from, to, why }) => (
                                <tr key={from} className="border-b border-zinc-900 hover:bg-zinc-900/30 transition-colors">
                                    <td className="py-3 pr-6 font-mono text-rose-300/80" style={{ fontSize: '12px' }}>
                                        {from}
                                    </td>
                                    <td className="py-3 pr-6 font-mono text-emerald-300/80" style={{ fontSize: '12px' }}>
                                        {to}
                                    </td>
                                    <td className="py-3 text-zinc-400">{why}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </FadeIn>

            <FadeIn delay={0.25}>
                <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                        href="/scroll/1"
                        className="flex flex-col gap-1 rounded-xl border border-zinc-700 hover:border-orange-500/50 bg-zinc-900/40 hover:bg-orange-500/5 p-4 transition-colors group"
                    >
                        <span className="text-orange-400 font-mono" style={{ fontSize: '11px' }}>
                            RESULT
                        </span>
                        <span className="text-white font-bold group-hover:text-orange-300 transition-colors">/scroll/1 →</span>
                        <span className="text-zinc-500" style={{ fontSize: '13px' }}>
                            The live Horizontal Blinds page
                        </span>
                    </Link>
                    <Link
                        href="/scroll/learn"
                        className="flex flex-col gap-1 rounded-xl border border-zinc-700 hover:border-emerald-500/50 bg-zinc-900/40 hover:bg-emerald-500/5 p-4 transition-colors group"
                    >
                        <span className="text-emerald-400 font-mono" style={{ fontSize: '11px' }}>
                            TECHNIQUE
                        </span>
                        <span className="text-white font-bold group-hover:text-emerald-300 transition-colors">/scroll/learn →</span>
                        <span className="text-zinc-500" style={{ fontSize: '13px' }}>
                            How the SVG mask animations work
                        </span>
                    </Link>
                    <Link
                        href="/r3f-bulge/learn"
                        className="flex flex-col gap-1 rounded-xl border border-zinc-700 hover:border-violet-500/50 bg-zinc-900/40 hover:bg-violet-500/5 p-4 transition-colors group"
                    >
                        <span className="text-violet-400 font-mono" style={{ fontSize: '11px' }}>
                            RELATED
                        </span>
                        <span className="text-white font-bold group-hover:text-violet-300 transition-colors">/r3f-bulge/learn →</span>
                        <span className="text-zinc-500" style={{ fontSize: '13px' }}>
                            DOM → WebGL conversion guide
                        </span>
                    </Link>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ScrollComponentPage() {
    return (
        <main className="min-h-screen bg-[#080810] text-white overflow-x-hidden">
            <div className="absolute inset-0 pointer-events-none" style={NOISE_BG} />
            <div className="max-w-[1100px] mx-auto">
                <HeroSection />
                <FileStructureSection />
                <Rule />
                <UseClientSection />
                <Rule />
                <HtmlToJsxSection />
                <Rule />
                <CssModuleSection />
                <Rule />
                <ScriptTagsSection />
                <Rule />
                <LenisLayoutSection />
                <Rule />
                <UseRefSection />
                <Rule />
                <UseGSAPSection />
                <Rule />
                <NavigationSection />
                <Rule />
                <PageWrapperSection />
                <Rule />
                <FinalSection />
            </div>
            <footer className="border-t border-zinc-800/60 px-6 md:px-12 xl:px-24 py-10 text-center text-zinc-600 font-mono" style={{ fontSize: '13px' }}>
                HTML → Next.js Component Conversion · Horizontal Blinds scroll transition
            </footer>
        </main>
    );
}
