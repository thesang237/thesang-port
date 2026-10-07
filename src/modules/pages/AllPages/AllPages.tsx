'use client';

import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import Image from 'next/image';

import { CATEGORIES, type Category, type Project, PROJECTS, routeCount } from './data';

const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-ix-mono', display: 'swap' });

type Sort = 'category' | 'newest' | 'az';
type View = 'grid' | 'list';
type Theme = 'light' | 'dark';

const NEW_DAYS = 21;
const CHIP_LIMIT = 4;
const CAT_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label])) as Record<Category, string>;
const CAT_SINGULAR: Record<Category, string> = { studies: 'Site study', '3d': '3D & WebGL', art: 'Generative art', motion: 'Motion & scroll', ui: 'UI & notes' };

const thumb = (p: Project) => `/all/${p.id}.webp`;
const hasGuide = (p: Project) => !!p.pages?.some((s) => s.guide);
const guideCount = PROJECTS.filter(hasGuide).length;
const monthKey = (d: string) => d.slice(0, 7);
const monthLabel = (key: string, style: 'long' | 'month' | 'short' = 'long') =>
    new Date(`${key}-01T12:00:00`).toLocaleDateString('en', style === 'long' ? { month: 'long', year: 'numeric' } : { month: style === 'month' ? 'long' : 'short' });
const shortDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('en', { month: 'short', year: 'numeric' });
const isNew = (p: Project) => (Date.now() - new Date(`${p.added}T12:00:00`).getTime()) / 864e5 < NEW_DAYS;
const byNewest = (a: Project, b: Project) => b.added.localeCompare(a.added);

// oldest → newest, for the timeline strip
const TIMELINE = [...PROJECTS]
    .map((p, i) => ({ p, i }))
    .sort((a, b) => a.p.added.localeCompare(b.p.added) || b.i - a.i)
    .map(({ p }) => p);
const TIMELINE_MONTHS = TIMELINE.reduce<{ key: string; n: number }[]>((acc, p) => {
    const key = monthKey(p.added);
    const last = acc[acc.length - 1];
    if (last?.key === key) last.n++;
    else acc.push({ key, n: 1 });
    return acc;
}, []);

function haystack(p: Project) {
    return [p.title, p.desc, p.route, CAT_LABEL[p.category], ...p.tags, hasGuide(p) ? 'guide learn' : '', ...(p.pages ?? []).flatMap((s) => [s.label, s.route])].join(' ').toLowerCase();
}
const HAY = new Map(PROJECTS.map((p) => [p.id, haystack(p)]));
const matchesQuery = (p: Project, q: string) => !q || q.split(/\s+/).every((t) => HAY.get(p.id)!.includes(t));

// ─── icons (16/20px family, 1.75 stroke) ─────────────────────────────────────

const Icon = {
    search: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
        </svg>
    ),
    close: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" />
        </svg>
    ),
    arrow: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M7 17 17 7M8 7h9v9" />
        </svg>
    ),
    book: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" />
            <path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" />
        </svg>
    ),
    grid: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
            <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
            <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
            <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
        </svg>
    ),
    list: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <path d="M9 6h11M9 12h11M9 18h11" />
            <rect x="3.5" y="4.5" width="3" height="3" rx="0.75" />
            <rect x="3.5" y="10.5" width="3" height="3" rx="0.75" />
            <rect x="3.5" y="16.5" width="3" height="3" rx="0.75" />
        </svg>
    ),
    sun: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
        </svg>
    ),
    moon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
        </svg>
    ),
};

// ─── pieces ─────────────────────────────────────────────────────────────────

// screenshot, or a typographic cover when there is none (or it fails to load)
function Thumb({ p, sizes, cover = true, eager = false }: { p: Project; sizes: string; cover?: boolean; eager?: boolean }) {
    const [failed, setFailed] = useState(false);
    if (p.noThumb || failed)
        return cover ? (
            <span className="ix-cover" aria-hidden>
                <span className="ix-cover__title">{p.title}</span>
                <span className="ix-mono">{p.route}</span>
            </span>
        ) : null;
    // screenshots are already small webp files; skipping the optimiser keeps re-captures from going stale
    return <Image src={thumb(p)} alt="" fill unoptimized sizes={sizes} loading={eager ? 'eager' : 'lazy'} style={{ objectFit: 'cover' }} onError={() => setFailed(true)} />;
}

function Chips({ p, keepSlot }: { p: Project; keepSlot?: boolean }) {
    const [open, setOpen] = useState(false);
    const pages = [...(p.pages ?? [])].sort((a, b) => Number(!!b.guide) - Number(!!a.guide));
    if (!pages.length) return keepSlot ? <span className="ix-row__col" aria-hidden /> : null;
    const shown = open || pages.length <= CHIP_LIMIT ? pages : pages.slice(0, CHIP_LIMIT - 1);
    const hidden = pages.length - shown.length;

    return (
        <ul className="ix-chips" aria-label={`More pages in ${p.title}`}>
            {shown.map((s) => (
                <li key={s.route}>
                    <a className={`ix-chip${s.guide ? ' ix-chip--guide' : ''}`} href={s.route} target="_blank" rel="noopener noreferrer" title={s.route}>
                        {s.guide && Icon.book}
                        {s.label}
                    </a>
                </li>
            ))}
            {hidden > 0 && (
                <li>
                    <button type="button" className="ix-chip ix-chip--more" onClick={() => setOpen(true)} aria-label={`Show ${hidden} more pages`}>
                        +{hidden} more
                    </button>
                </li>
            )}
        </ul>
    );
}

function Card({ p, i, showCat, flash }: { p: Project; i: number; showCat: boolean; flash: boolean }) {
    return (
        <article id={`p-${p.id}`} className="ix-card" style={{ '--i': Math.min(i, 7) } as CSSProperties} data-flash={flash}>
            <div className="ix-card__media">
                <Thumb p={p} sizes="(min-width: 1200px) 310px, (min-width: 900px) 33vw, 50vw" eager={i < 4} />
                {isNew(p) && <span className="ix-card__new">New</span>}
                <span className="ix-card__open ix-mono" aria-hidden>
                    Open {Icon.arrow}
                </span>
            </div>
            <div className="ix-card__body">
                <div className="ix-card__meta ix-mono">
                    <span>{p.route}</span>
                    <span>{shortDate(p.added)}</span>
                </div>
                <h3 className="ix-card__title">
                    <a className="ix-card__link" href={p.route} target="_blank" rel="noopener noreferrer">
                        {p.title}
                    </a>
                </h3>
                {showCat && <span className="ix-card__cat">{CAT_SINGULAR[p.category]}</span>}
                <p className="ix-card__desc">{p.desc}</p>
                <Chips p={p} />
            </div>
        </article>
    );
}

function Row({ p, i, onPeek, flash }: { p: Project; i: number; onPeek: (p: Project | null) => void; flash: boolean }) {
    return (
        <div
            id={`p-${p.id}`}
            className="ix-row ix-card"
            style={{ '--i': Math.min(i, 7) } as CSSProperties}
            data-flash={flash}
            onPointerEnter={(e) => e.pointerType === 'mouse' && onPeek(p)}
            onPointerLeave={() => onPeek(null)}
        >
            <div className="ix-row__thumb">
                <Thumb p={p} sizes="96px" cover={false} eager={i < 4} />
            </div>
            <div className="ix-row__main">
                <div className="ix-row__title">
                    <a className="ix-card__link" href={p.route} target="_blank" rel="noopener noreferrer">
                        {p.title}
                    </a>
                    {isNew(p) && <span className="ix-row__badge">New</span>}
                </div>
                <p className="ix-row__desc">{p.desc}</p>
            </div>
            <span className="ix-row__col">{CAT_SINGULAR[p.category]}</span>
            <Chips p={p} keepSlot />
            <span className="ix-row__col ix-row__route ix-mono">{p.route}</span>
            <span className="ix-row__col ix-row__date ix-mono">{shortDate(p.added)}</span>
        </div>
    );
}

// Dock-style timeline: every project as a tile, oldest → newest; magnifies under the pointer.
function Strip({ visible, onJump }: { visible: Set<string>; onJump: (p: Project) => void }) {
    const rail = useRef<HTMLDivElement>(null);
    const tiles = useRef<(HTMLButtonElement | null)[]>([]);
    const caption = useRef<HTMLSpanElement>(null);
    const [hover, setHover] = useState<Project | null>(null);
    const [tabStop, setTabStop] = useState(TIMELINE.length - 1); // one tab stop; arrow keys move along the strip
    const st = useRef({ x: -1, active: false, scales: TIMELINE.map(() => 1), raf: 0, kick: () => {} });

    useEffect(() => {
        const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
        const MAX = 4;
        const SIGMA = 1.5;
        const s = st.current;

        const tick = () => {
            s.raf = 0;
            const r = rail.current;
            const els = tiles.current;
            if (!r || !els[0]) return;
            const w = els[0].offsetWidth;
            const centers = els.map((el) => (el ? el.offsetLeft + w / 2 : 0));
            let moving = false;

            const target = centers.map((c) => (s.active ? 1 + (MAX - 1) * Math.exp(-(((s.x - c) / (w + 4)) ** 2) / (2 * SIGMA * SIGMA)) : 1));
            s.scales = s.scales.map((v, i) => {
                const next = reduce ? target[i] : v + (target[i] - v) * 0.22;
                if (Math.abs(next - target[i]) > 0.002) moving = true;
                return Math.abs(next - target[i]) > 0.002 ? next : target[i];
            });

            // fisheye: the strip keeps its width, so every tile shares the room the magnified ones take
            const gap = 4;
            const fit = (els.length * w) / s.scales.reduce((a, v) => a + w * v, 0);
            let run = 0;
            let best = 0;
            const txs = els.map((el, i) => {
                const sc = s.scales[i] * fit;
                const tx = run + (w * sc) / 2 - (centers[i] - centers[0] + w / 2);
                run += w * sc + gap;
                if (el) {
                    el.style.transform = `translateX(${tx.toFixed(2)}px) scale(${sc.toFixed(4)})`;
                    el.style.zIndex = s.scales[i] > 1.01 ? '1' : '';
                }
                if (s.scales[i] > s.scales[best]) best = i;
                return tx;
            });

            if (caption.current && s.active) {
                const el = els[best]!;
                const cx = el.offsetLeft + w / 2 + txs[best];
                const h = el.offsetHeight * s.scales[best] * fit;
                caption.current.style.transform = `translate(${cx.toFixed(1)}px, ${(-h - 8).toFixed(1)}px) translateX(-50%)`;
            }
            if (moving) s.raf = requestAnimationFrame(tick);
        };

        const kick = () => {
            if (!s.raf) s.raf = requestAnimationFrame(tick);
        };
        s.kick = kick;
        const r = rail.current!;
        const move = (e: PointerEvent) => {
            if (e.pointerType !== 'mouse') return;
            const b = r.getBoundingClientRect();
            s.x = e.clientX - b.left;
            s.active = true;
            const w = tiles.current[0]?.offsetWidth ?? 1;
            const idx = Math.max(0, Math.min(TIMELINE.length - 1, Math.round((s.x - w / 2) / (w + 4))));
            setHover(TIMELINE[idx]);
            kick();
        };
        const leave = () => {
            s.active = false;
            setHover(null);
            kick();
        };
        r.addEventListener('pointermove', move);
        r.addEventListener('pointerleave', leave);
        window.addEventListener('resize', kick);
        return () => {
            r.removeEventListener('pointermove', move);
            r.removeEventListener('pointerleave', leave);
            window.removeEventListener('resize', kick);
            cancelAnimationFrame(s.raf);
        };
    }, []);

    // keyboard focus magnifies too
    const focusTile = (i: number | null) => {
        const s = st.current;
        const el = i === null ? null : tiles.current[i];
        s.active = !!el;
        if (el) s.x = el.offsetLeft + el.offsetWidth / 2;
        setHover(i === null ? null : TIMELINE[i]);
        s.kick();
    };

    return (
        <section className="ix-strip ix-wrap" aria-label="Timeline of every project, oldest to newest" style={{ '--i': 3 } as CSSProperties}>
            <div className="ix-strip__head">
                <span className="ix-label">Timeline</span>
                <span className="ix-label">Hover to scrub · click to jump</span>
            </div>
            <div className="ix-strip__rail" ref={rail} style={{ '--n': TIMELINE.length } as CSSProperties}>
                <span ref={caption} className="ix-strip__caption ix-mono" data-show={!!hover} aria-hidden>
                    {hover && (
                        <>
                            {hover.title} · {shortDate(hover.added)}
                        </>
                    )}
                </span>
                {TIMELINE.map((p, i) => (
                    <button
                        key={p.id}
                        ref={(el) => {
                            tiles.current[i] = el;
                        }}
                        type="button"
                        className="ix-strip__tile"
                        data-dim={!visible.has(p.id)}
                        aria-label={`Jump to ${p.title}, ${shortDate(p.added)}`}
                        // the pointer may sit on a shifted neighbour; jump to the magnified (captioned) tile
                        onClick={() => onJump(hover ?? p)}
                        tabIndex={i === tabStop ? 0 : -1}
                        onFocus={(e) => e.currentTarget.matches(':focus-visible') && focusTile(i)}
                        onBlur={() => focusTile(null)}
                        onKeyDown={(e) => {
                            const step = { ArrowLeft: -1, ArrowRight: 1, Home: -i, End: TIMELINE.length - 1 - i }[e.key];
                            if (step === undefined) return;
                            e.preventDefault();
                            const next = Math.max(0, Math.min(TIMELINE.length - 1, i + step));
                            setTabStop(next);
                            tiles.current[next]?.focus();
                        }}
                    >
                        <Thumb p={p} sizes="128px" cover={false} />
                    </button>
                ))}
            </div>
            <div className="ix-strip__months" style={{ '--n': TIMELINE.length } as CSSProperties}>
                {TIMELINE_MONTHS.map((m, i) => (
                    <span key={m.key} className="ix-strip__month ix-mono" style={{ gridColumn: `span ${m.n}` }}>
                        <b>{monthLabel(m.key, 'short')}</b>
                        {i === 0 && ` ${m.key.slice(0, 4)}`}
                        {m.n > 2 && <span> · {m.n}</span>}
                    </span>
                ))}
            </div>
        </section>
    );
}

// ─── page ───────────────────────────────────────────────────────────────────

export default function AllPages() {
    const root = useRef<HTMLDivElement>(null);
    const search = useRef<HTMLInputElement>(null);
    const sentinel = useRef<HTMLDivElement>(null);
    const peekEl = useRef<HTMLDivElement>(null);

    const [query, setQuery] = useState('');
    const [cat, setCat] = useState<Category | 'all'>('all');
    const [guides, setGuides] = useState(false);
    const [sort, setSort] = useState<Sort>('category');
    const [view, setView] = useState<View>('grid');
    const [theme, setTheme] = useState<Theme>('light');
    const [settled, setSettled] = useState(false);
    const [stuck, setStuck] = useState(false);
    const [peek, setPeek] = useState<Project | null>(null);
    const [flash, setFlash] = useState<string | null>(null);
    const [ready, setReady] = useState(false);

    // restore state: theme from storage / system, filters from the URL
    useEffect(() => {
        let stored: string | null = null;
        try {
            stored = localStorage.getItem('ix-theme');
        } catch {
            // storage can be blocked; the theme still works for this visit
        }
        setTheme(stored === 'dark' || stored === 'light' ? stored : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

        const sp = new URLSearchParams(location.search);
        setQuery(sp.get('q') ?? '');
        const c = sp.get('c');
        if (c && CATEGORIES.some((x) => x.id === c)) setCat(c as Category);
        setGuides(sp.get('guides') === '1');
        const s = sp.get('sort');
        if (s === 'newest' || s === 'az') setSort(s);
        if (sp.get('view') === 'list') setView('list');
        setReady(true);

        const t = setTimeout(() => setSettled(true), 1400);
        return () => clearTimeout(t);
    }, []);

    // keep the URL shareable
    useEffect(() => {
        if (!ready) return;
        const sp = new URLSearchParams();
        if (query) sp.set('q', query);
        if (cat !== 'all') sp.set('c', cat);
        if (guides) sp.set('guides', '1');
        if (sort !== 'category') sp.set('sort', sort);
        if (view !== 'grid') sp.set('view', view);
        const qs = sp.toString();
        history.replaceState(null, '', `${location.pathname}${qs ? `?${qs}` : ''}`);
    }, [ready, query, cat, guides, sort, view]);

    // the page colour also paints the document, so overscroll matches
    useEffect(() => {
        const el = root.current;
        if (!el) return;
        const prev = document.body.style.backgroundColor;
        document.body.style.backgroundColor = getComputedStyle(el).backgroundColor;
        return () => {
            document.body.style.backgroundColor = prev;
        };
    }, [theme]);

    // toolbar gets its hairline once it sticks
    useEffect(() => {
        const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting));
        if (sentinel.current) io.observe(sentinel.current);
        return () => io.disconnect();
    }, []);

    const q = query.trim().toLowerCase();
    const filtered = useMemo(() => PROJECTS.filter((p) => (cat === 'all' || p.category === cat) && (!guides || hasGuide(p)) && matchesQuery(p, q)), [cat, guides, q]);
    const visible = useMemo(() => new Set(filtered.map((p) => p.id)), [filtered]);

    // counts per category reflect the search and guide filter, so you can see where matches are
    const counts = useMemo(() => {
        const base = PROJECTS.filter((p) => (!guides || hasGuide(p)) && matchesQuery(p, q));
        const m = { all: base.length } as Record<Category | 'all', number>;
        CATEGORIES.forEach((c) => (m[c.id] = base.filter((p) => p.category === c.id).length));
        return m;
    }, [guides, q]);
    const guideMatches = useMemo(() => PROJECTS.filter((p) => (cat === 'all' || p.category === cat) && hasGuide(p) && matchesQuery(p, q)).length, [cat, q]);

    const sections = useMemo(() => {
        if (sort === 'category')
            return CATEGORIES.map((c) => ({ key: c.id, title: c.label, blurb: c.blurb, items: filtered.filter((p) => p.category === c.id).sort(byNewest) })).filter((s) => s.items.length);
        if (sort === 'newest') {
            const groups = new Map<string, Project[]>();
            [...filtered].sort(byNewest).forEach((p) => groups.set(monthKey(p.added), [...(groups.get(monthKey(p.added)) ?? []), p]));
            return [...groups].map(([key, items]) => ({ key, title: monthLabel(key), blurb: '', items }));
        }
        return [{ key: 'az', title: 'A to Z', blurb: '', items: [...filtered].sort((a, b) => a.title.localeCompare(b.title)) }];
    }, [filtered, sort]);

    const clearAll = useCallback(() => {
        setQuery('');
        setCat('all');
        setGuides(false);
    }, []);

    const jump = useCallback(
        (p: Project) => {
            const go = () => {
                const el = document.getElementById(`p-${p.id}`);
                if (!el) return;
                el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
                setFlash(null);
                requestAnimationFrame(() => setFlash(p.id));
            };
            if (!visible.has(p.id)) {
                clearAll();
                setTimeout(go, 60);
            } else go();
        },
        [visible, clearAll],
    );

    // "/" focuses search; Esc clears it, then leaves it
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const t = e.target as HTMLElement;
            if (e.key === '/' && !/input|textarea|select/i.test(t.tagName) && !t.isContentEditable) {
                e.preventDefault();
                search.current?.focus();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // list-view preview trails the pointer
    useEffect(() => {
        if (view !== 'list' || !matchMedia('(hover: hover)').matches) return;
        const el = peekEl.current!;
        const pos = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
        let raf = 0;
        const W = 360;
        const H = 225;
        const loop = () => {
            const k = pos.x < -999 ? 1 : 0.2;
            pos.x += (pos.tx - pos.x) * k;
            pos.y += (pos.ty - pos.y) * k;
            el.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0)`;
            raf = Math.abs(pos.tx - pos.x) + Math.abs(pos.ty - pos.y) > 0.3 ? requestAnimationFrame(loop) : 0;
        };
        const move = (e: PointerEvent) => {
            // sit just below the pointer so the hovered row stays readable; flip above near the bottom
            pos.tx = Math.min(Math.max(16, e.clientX - W * 0.25), innerWidth - W - 16);
            pos.ty = e.clientY + 32 + H < innerHeight - 16 ? e.clientY + 32 : e.clientY - 32 - H;
            if (pos.x < -999) {
                pos.x = pos.tx;
                pos.y = pos.ty;
            }
            if (!raf) raf = requestAnimationFrame(loop);
        };
        window.addEventListener('pointermove', move);
        return () => {
            window.removeEventListener('pointermove', move);
            cancelAnimationFrame(raf);
        };
    }, [view]);

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        try {
            localStorage.setItem('ix-theme', next);
        } catch {
            // storage can be blocked; the theme still works for this visit
        }
    };

    const firstMonth = TIMELINE_MONTHS[0].key;
    const lastMonth = TIMELINE_MONTHS[TIMELINE_MONTHS.length - 1].key;
    let idx = 0;

    return (
        <div ref={root} className={`ix ${mono.variable}`} data-theme={theme} data-settled={settled}>
            <header className="ix-head ix-wrap">
                <div className="ix-head__top" style={{ '--i': 0 } as CSSProperties}>
                    <span className="ix-label">Playground index</span>
                    <button type="button" className="ix-icon-btn" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
                        {theme === 'dark' ? Icon.sun : Icon.moon}
                    </button>
                </div>
                <div className="ix-head__row" style={{ '--i': 1 } as CSSProperties}>
                    <div>
                        <h1 className="ix-head__title">All pages</h1>
                        <p className="ix-head__lede" style={{ marginTop: 'var(--s4)' }}>
                            Every study, experiment and guide in this playground, built between{' '}
                            {firstMonth.slice(0, 4) === lastMonth.slice(0, 4) ? monthLabel(firstMonth, 'month') : monthLabel(firstMonth)} and {monthLabel(lastMonth)}. Pages open in a new tab.
                        </p>
                    </div>
                    <dl className="ix-head__stats">
                        {[
                            [PROJECTS.length, 'Projects'],
                            [routeCount, 'Pages'],
                            [guideCount, 'Guides'],
                        ].map(([n, label]) => (
                            <div key={label} className="ix-stat">
                                <dd className="ix-stat__n">{n}</dd>
                                <dt className="ix-label">{label}</dt>
                            </div>
                        ))}
                    </dl>
                </div>
            </header>

            <Strip visible={visible} onJump={jump} />

            <div ref={sentinel} aria-hidden />
            <div className="ix-bar" data-stuck={stuck}>
                <div className="ix-bar__inner ix-wrap">
                    <div className="ix-search">
                        {Icon.search}
                        <label htmlFor="ix-q" className="ix-sr">
                            Search projects
                        </label>
                        <input
                            id="ix-q"
                            ref={search}
                            type="search"
                            placeholder="Search — try “shader”"
                            value={query}
                            autoComplete="off"
                            spellCheck={false}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    if (query) setQuery('');
                                    else e.currentTarget.blur();
                                }
                                if (e.key === 'Enter' && sections[0]?.items[0]) window.open(sections[0].items[0].route, '_blank', 'noopener');
                            }}
                        />
                        <span className="ix-search__end">
                            {query ? (
                                <button type="button" className="ix-search__clear" onClick={() => (setQuery(''), search.current?.focus())} aria-label="Clear search">
                                    {Icon.close}
                                </button>
                            ) : (
                                <kbd className="ix-kbd" aria-hidden>
                                    /
                                </kbd>
                            )}
                        </span>
                    </div>

                    <div className="ix-bar__scroll">
                        <div className="ix-pills" role="group" aria-label="Category">
                            <button type="button" className="ix-pill" aria-pressed={cat === 'all'} onClick={() => setCat('all')}>
                                All <span className="ix-pill__n">{counts.all}</span>
                            </button>
                            {CATEGORIES.map((c) => (
                                <button key={c.id} type="button" className="ix-pill" aria-pressed={cat === c.id} data-empty={counts[c.id] === 0} onClick={() => setCat(cat === c.id ? 'all' : c.id)}>
                                    <span title={c.label}>{c.short}</span> <span className="ix-pill__n">{counts[c.id]}</span>
                                </button>
                            ))}
                        </div>

                        <div className="ix-bar__end">
                            <button type="button" className="ix-pill" aria-pressed={guides} data-empty={guideMatches === 0} onClick={() => setGuides(!guides)}>
                                {Icon.book} Has guide <span className="ix-pill__n">{guideMatches}</span>
                            </button>
                            <div className="ix-seg" role="group" aria-label="Sort by">
                                {(
                                    [
                                        ['category', 'Type'],
                                        ['newest', 'Newest'],
                                        ['az', 'A–Z'],
                                    ] as const
                                ).map(([v, label]) => (
                                    <button key={v} type="button" aria-pressed={sort === v} onClick={() => setSort(v)}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                            <div className="ix-seg" role="group" aria-label="Layout">
                                <button type="button" aria-pressed={view === 'grid'} onClick={() => setView('grid')} aria-label="Grid">
                                    {Icon.grid}
                                </button>
                                <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')} aria-label="List">
                                    {Icon.list}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="ix-main ix-wrap">
                <p className="ix-sr" aria-live="polite">
                    {filtered.length} projects shown
                </p>
                {sections.length === 0 ? (
                    <div className="ix-empty">
                        <p className="ix-empty__title">Nothing matches{q ? ` “${query.trim()}”` : ''}</p>
                        <p>Try a shorter word, another category, or one of these:</p>
                        <div className="ix-empty__try">
                            {['shader', 'scroll', 'canvas', 'guide'].map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    className="ix-pill"
                                    onClick={() => {
                                        setCat('all');
                                        setGuides(false);
                                        setQuery(t);
                                    }}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                        <button type="button" className="ix-btn" style={{ marginTop: 'var(--s4)' }} onClick={clearAll}>
                            Show all projects
                        </button>
                    </div>
                ) : (
                    sections.map((s) => (
                        <section key={s.key} className="ix-section" aria-labelledby={`h-${s.key}`}>
                            {(sections.length > 1 || sort !== 'az') && (
                                <div className="ix-section__head">
                                    <h2 id={`h-${s.key}`} className="ix-section__title">
                                        {s.title}
                                    </h2>
                                    <span className="ix-mono" style={{ color: 'var(--ink-faint)' }}>
                                        {s.items.length}
                                    </span>
                                    {s.blurb && <p className="ix-section__blurb">{s.blurb}</p>}
                                </div>
                            )}
                            {view === 'grid' ? (
                                <div className="ix-grid">
                                    {s.items.map((p) => (
                                        <Card key={p.id} p={p} i={idx++} showCat={sort !== 'category'} flash={flash === p.id} />
                                    ))}
                                </div>
                            ) : (
                                <div className="ix-list">
                                    {s.items.map((p) => (
                                        <Row key={p.id} p={p} i={idx++} onPeek={setPeek} flash={flash === p.id} />
                                    ))}
                                </div>
                            )}
                        </section>
                    ))
                )}
            </main>

            <footer className="ix-foot">
                <div className="ix-wrap ix-mono" style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--s4)', flexWrap: 'wrap' }}>
                    <span>
                        {PROJECTS.length} projects · {routeCount} pages
                    </span>
                    <span>
                        Press <kbd className="ix-kbd">/</kbd> to search
                    </span>
                </div>
            </footer>

            <div ref={peekEl} className="ix-peek" data-show={view === 'list' && !!peek} aria-hidden>
                {peek && <Thumb key={peek.id} p={peek} sizes="360px" />}
            </div>
        </div>
    );
}
