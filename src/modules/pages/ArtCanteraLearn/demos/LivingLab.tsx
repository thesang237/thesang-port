'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

import { LocalRandom, PAPER } from '../kit/art';
import { useStudyCanvas, useStudyClock } from '../kit/canvas';
import { Dial, Lab } from '../kit/ui';

type Bird = { x: number; y: number; vx: number; vy: number };
// Mutable simulation buffers live outside React state.
function advanceFlock(flock: Bird[], cohesion: number, separation: number) {
    for (const bird of flock) {
        let cx = 0,
            cy = 0,
            sx = 0,
            sy = 0,
            ax = 0,
            ay = 0,
            n = 0;
        for (const other of flock) {
            if (other === bird) continue;
            const dx = other.x - bird.x,
                dy = other.y - bird.y,
                d = Math.hypot(dx, dy);
            if (d < 0.25) {
                cx += dx * 0.33;
                cy += dy * 0.33;
                ax += other.vx;
                ay += other.vy;
                n++;
                if (d < 0.07 && d > 0.001) {
                    sx -= (dx / d) * (0.07 - d);
                    sy -= (dy / d) * (0.07 - d);
                }
            }
        }
        bird.vx += cx * cohesion + sx * separation;
        bird.vy += cy * cohesion + sy * separation;
        if (n) {
            bird.vx += (ax / n - bird.vx) * 0.08;
            bird.vy += (ay / n - bird.vy) * 0.08;
        }
        const speed = Math.hypot(bird.vx, bird.vy);
        if (speed > 0.012) {
            bird.vx *= 0.012 / speed;
            bird.vy *= 0.012 / speed;
        }
        bird.x = (bird.x + bird.vx + 1) % 1;
        bird.y = (bird.y + bird.vy + 1) % 1;
    }
}
export default function LivingLab() {
    const [running, setRunning] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    useEffect(() => {
        const media = window.matchMedia('(prefers-reduced-motion: reduce)');
        const change = (event: MediaQueryListEvent) => {
            if (event.matches) setRunning(false);
        };
        media.addEventListener('change', change);
        return () => media.removeEventListener('change', change);
    }, []);
    const [cohesion, setCohesion] = useState(0.02),
        [separation, setSeparation] = useState(0.04),
        [count, setCount] = useState(24),
        [depth, setDepth] = useState(1);
    const birds = useRef<Bird[]>([]),
        elapsed = useRef(0),
        host = useRef<HTMLDivElement>(null);
    const populate = useCallback(() => {
        const rng = new LocalRandom(19);
        birds.current = Array.from({ length: count }, () => ({
            x: 0.2 + rng.next() * 0.6,
            y: 0.2 + rng.next() * 0.4,
            vx: (rng.next() - 0.5) * 0.004,
            vy: (rng.next() - 0.5) * 0.004,
        }));
    }, [count]);
    const draw = useCallback(
        (ctx: CanvasRenderingContext2D, w: number, h: number) => {
            if (birds.current.length !== count) populate();
            ctx.fillStyle = PAPER;
            ctx.fillRect(0, 0, w, h);
            ctx.strokeStyle = '#d6ccbe';
            ctx.lineWidth = 1;
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.moveTo(0, h * (0.55 + i * 0.08));
                ctx.lineTo(w, h * (0.4 + i * 0.08));
                ctx.stroke();
            }
            ctx.fillStyle = '#b9afa0';
            ctx.fillRect(w * 0.35, h * 0.48, w * 0.3, h * 0.4);
            for (const bird of birds.current) {
                const x = bird.x * w,
                    y = bird.y * h;
                if (depth === 1 && x > w * 0.35 && x < w * 0.65 && y > h * 0.48) continue;
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(Math.atan2(bird.vy, bird.vx));
                ctx.beginPath();
                ctx.moveTo(-5, -4);
                ctx.lineTo(2, 0);
                ctx.lineTo(-5, 4);
                ctx.strokeStyle = '#292724';
                ctx.lineWidth = 1.3;
                ctx.stroke();
                ctx.restore();
            }
        },
        [count, depth, populate],
    );
    const canvas = useStudyCanvas(draw);
    useStudyClock(host, (dt) => {
        if (!running) return;
        elapsed.current += dt;
        if (elapsed.current >= 0.08) {
            elapsed.current -= 0.08;
            // Teaching copy in 2D, with the source's cohesion/separation final weights.
            advanceFlock(birds.current, cohesion, separation);
        }
        const ctx = canvas.current?.getContext('2d');
        const element = host.current;
        if (ctx && element) draw(ctx, element.clientWidth, element.clientHeight);
    });
    return (
        <Lab
            title="A few marks make a city"
            hint="Remove separation to collapse the flock. Toggle depth to let birds pass behind the wall."
            reset={() => {
                setCohesion(0.02);
                setSeparation(0.04);
                setCount(24);
                setDepth(1);
                populate();
                setRunning(false);
            }}
            note="Teaching copy in 2D. Source flocks live in 3D, avoid occupied cells, and compare projected distance with a depth map. This clock pauses off screen."
            controls={
                <>
                    <button type="button" className="cl-button" aria-pressed={running} onClick={() => setRunning(!running)}>
                        {running ? 'Pause flock' : 'Play flock'}
                    </button>
                    <Dial label="Cohesion" help="Pulls nearby marks together. Source final weight: 0.02." value={cohesion} min={0} max={0.12} step={0.01} onChange={setCohesion} />
                    <Dial label="Separation" help="Keeps neighbours from overlapping. Source final weight: 0.04." value={separation} min={0} max={0.2} step={0.01} onChange={setSeparation} />
                    <Dial label="Birds" help="A teaching flock. The artwork starts 45 flocks of varying sizes." value={count} min={4} max={64} onChange={setCount} />
                    <button type="button" className="cl-button" aria-pressed={depth === 1} onClick={() => setDepth(depth ? 0 : 1)}>
                        {depth ? 'Depth test on' : 'Depth test off'}
                    </button>
                </>
            }
        >
            <div ref={host} className="cl-canvas-host">
                <canvas ref={canvas} aria-label="Animated flock with adjustable steering and wall occlusion" />
            </div>
        </Lab>
    );
}
