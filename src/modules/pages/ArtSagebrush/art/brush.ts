import { atan2, cos, cv, distance, lerp, mapRange, max, PI, round, sin, sq, sqrt, TAU, type Vec, vmag, vrot } from './math';
import { type Noise } from './noise';
import { col2css, type InkColor } from './palette';
import { type createRandom } from './random';

/** A target path is a score; the pen performs it. Each update is one simulation
 * step, not one animation frame. Finish a stroke before advancing the depth stack.
 * maxV = speed limit, acc = attraction, wt = dot-cloud diameter, c[3] = ink alpha.
 */
type RNG = ReturnType<typeof createRandom>;
export type Point = { x: number; y: number };

export class InkStroke {
    x = 0;
    y = 0;
    z = 0;
    angle = 0;
    wt = 1;
    maxV = 3;
    acc = 0.005;
    c: InkColor = [0, 0, 0, 64];
    density = 1;
    wobble = 0;
    lineLen = 0;
    pen: Vec = cv(0, 0);
    _pen: Vec = cv(0, 0);
    penV: Vec = cv(0, 0);
    penTargetIndex = 1;
    points: Point[] = [];

    update(ctx: CanvasRenderingContext2D, noise: Noise, rng: RNG): 'done' | 'continue' {
        if (this.points.length < 2 || this.penTargetIndex >= this.points.length) return 'done';
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        const target = this.points[this.penTargetIndex];
        const dx = target.x - this.pen.x,
            dy = target.y - this.pen.y;
        this.penV.x += dx * this.acc;
        this.penV.y += dy * this.acc;

        const wv = vrot(cv(this.wobble, 0), rng.r01() * TAU, 0, 0);
        this.penV.x += wv.x;
        this.penV.y += wv.y;
        this.penV.x *= 0.8;
        this.penV.y *= 0.8;

        const vm = vmag(this.penV);
        if (vm > this.maxV) {
            const s = this.maxV / vm;
            this.penV.x *= s;
            this.penV.y *= s;
        }

        this.lineLen += vm;
        this._pen.x = this.pen.x;
        this._pen.y = this.pen.y;
        this.pen.x += this.penV.x;
        this.pen.y += this.penV.y;

        if (sq(target.x - this.pen.x) + sq(target.y - this.pen.y) < 9) {
            this.penTargetIndex++;
            if (this.penTargetIndex >= this.points.length) {
                ctx.restore();
                this.points = [];
                return 'done';
            }
        }

        ctx.fillStyle = col2css(this.c);
        const noiseV = mapRange(noise(this.lineLen * 0.001), 0, 1, 0.5, 1);
        for (let i = 0; i < this.density; i++) {
            const offDist = (sqrt(rng.r01()) * noiseV * this.wt) / 2;
            const offA = rng.r01() * TAU;
            ctx.fillRect(this.pen.x + cos(offA) * offDist - 0.5, this.pen.y + sin(offA) * offDist - 0.5, 1, 1);
        }
        ctx.restore();
        return 'continue';
    }

    setWeight(v: number) {
        this.wt = v;
    }
    setMaxV(v: number) {
        this.maxV = v;
    }
    setAcc(v: number) {
        this.acc = v;
    }
    setColor(v: InkColor) {
        this.c = v;
    }
    setDensity(v: number) {
        this.density = v;
    }
    setWobble(v: number) {
        this.wobble = v;
    }
    setAngle(v: number) {
        this.angle = v;
    }
}

export class InkEllipse extends InkStroke {
    constructor(cx: number, cy: number, rx: number, ry: number, hatchDensity: number, outline: boolean) {
        super();
        this.x = cx;
        this.y = cy;
        this.points = [];

        if (outline) {
            const n = max(2, round(rx / hatchDensity) * 10);
            for (let i = 0; i < n; i++) {
                const a = mapRange(i, 0, n - 2, 0, TAU);
                this.points.push({ x: rx * cos(a), y: ry * sin(a) });
            }
        } else {
            const n = max(2, round(rx / hatchDensity));
            for (let i = 0; i < n; i++) {
                const x = mapRange(i, 0, n - 1, -rx, rx);
                const ht = ry * sqrt(max(0, 1 - sq(x) / sq(rx)));
                this.points.push({ x, y: ht });
                this.points.push({ x, y: -ht });
            }
        }
        this.pen = cv(this.points[0].x, this.points[0].y);
        this._pen = cv(this.pen.x, this.pen.y);
        this.penV = cv(0, 0);
        this.penTargetIndex = 1;
    }
}

export class InkQuad extends InkStroke {
    constructor(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number, hatchDensity: number, noise: Noise) {
        super();
        this.x = (x1 + x2 + x3 + x4) / 4;
        this.y = (y1 + y2 + y3 + y4) / 4;
        const lx1 = x1 - this.x,
            ly1 = y1 - this.y,
            lx2 = x2 - this.x,
            ly2 = y2 - this.y;
        const lx3 = x3 - this.x,
            ly3 = y3 - this.y,
            lx4 = x4 - this.x,
            ly4 = y4 - this.y;
        const d12 = distance(lx1, ly1, lx2, ly2),
            d34 = distance(lx3, ly3, lx4, ly4);
        const n = max(2, round(max(d12, d34) / hatchDensity));
        this.points = [];
        for (let i = 0; i < n; i++) {
            const m = mapRange(i, 0, n - 1, 0, 1);
            let px = lerp(lx1, lx2, m),
                py = lerp(ly1, ly2, m);
            let na = noise(px * 0.08, py * 0.08) * TAU;
            this.points.push({ x: px + cos(na), y: py + sin(na) });
            px = lerp(lx4, lx3, m);
            py = lerp(ly4, ly3, m);
            na = noise(px * 0.08, py * 0.08) * TAU;
            this.points.push({ x: px + cos(na), y: py + sin(na) });
        }
        this.pen = cv(this.points[0].x, this.points[0].y);
        this._pen = cv(this.pen.x, this.pen.y);
        this.penV = cv(0, 0);
        this.penTargetIndex = 1;
    }
}

export class InkRect extends InkQuad {
    constructor(cx: number, cy: number, w: number, h: number, hatchDensity: number, noise: Noise) {
        super(cx - w / 2, cy - h / 2, cx + w / 2, cy - h / 2, cx + w / 2, cy + h / 2, cx - w / 2, cy + h / 2, hatchDensity, noise);
    }
}

export class InkLine extends InkRect {
    constructor(x1: number, y1: number, x2: number, y2: number, weight: number, hatchDensity: number, noise: Noise) {
        const ht = distance(x1, y1, x2, y2);
        const ang = atan2(y2 - y1, x2 - x1);
        super(lerp(x1, x2, 0.5), lerp(y1, y2, 0.5), weight, ht, hatchDensity, noise);
        this.angle = ang + PI / 2;
    }
}
