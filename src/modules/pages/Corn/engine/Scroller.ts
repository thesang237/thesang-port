/**
 * Virtual story scroll, in steps (see Timeline: a chapter's dwell segments, then the move to the next
 * chapter). The page never scrolls natively: wheel / touch / keys move a `target` continuously and
 * `pos` follows on a critically damped spring — it keeps its momentum, starts softly and lands
 * without overshoot. When input stops, the target settles on a whole step, biased toward the
 * direction of travel, and the spring carries the view there slowly.
 *
 * Feel (2026-10-03, Sang: "slower, gentler, premium"): one mouse-wheel notch or a short swipe = one
 * step; a long swipe can carry two (enough to leave a chapter from its first frame). A step takes
 * ≈ 1.6 s to land.
 *
 * One step past the last is the hero again: settling there wraps `pos` back to 0.
 */

const WHEEL_PER_STEP = 420; // px of wheel delta for one step
const MAX_EVENT = 0.32; // steps per wheel event at most (line-mode wheels, huge deltas)
const LEAD = 2.1; // the target may run at most this far ahead of the view
const IDLE_MS = 170; // input silence before settling
const COMMIT = 0.1; // past this fraction of a step in the direction of travel, settle forward
const W_FOLLOW = 3.4; // rad/s, spring while the hand is on the wheel (responsive)
const W_SETTLE = 2.5; // rad/s, spring while landing (≈ 1.6 s to settle, no overshoot)

export class Scroller {
    pos = 0;
    target = 0;
    vel = 0;
    enabled = false;
    private dir = 0;
    private lastInput = 0;
    private touchY: number | null = null;

    constructor(
        private total: number,
        private onSettle: (step: number) => void,
    ) {}

    /** Jump without animation (debug, restore). */
    set(step: number) {
        this.pos = this.target = step;
        this.vel = 0;
        this.lastInput = 0;
        this.onSettle(step);
    }

    /** Glide to a step (menu, nav, keys). */
    goTo(step: number) {
        this.target = Math.min(this.total, Math.max(0, step));
        this.dir = Math.sign(this.target - this.pos);
        this.lastInput = 0;
    }

    private nudge(delta: number) {
        if (!this.enabled || !delta) return;
        const lo = Math.max(0, this.pos - LEAD);
        const hi = Math.min(this.total, this.pos + LEAD);
        this.target = Math.min(hi, Math.max(lo, this.target + delta));
        this.dir = Math.sign(delta);
        this.lastInput = performance.now();
    }

    onWheel = (e: WheelEvent) => {
        e.preventDefault();
        const dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY;
        this.nudge(Math.max(-MAX_EVENT, Math.min(MAX_EVENT, dy / WHEEL_PER_STEP)));
    };

    onTouchStart = (e: TouchEvent) => {
        this.touchY = e.touches[0]?.clientY ?? null;
    };

    onTouchMove = (e: TouchEvent) => {
        const y = e.touches[0]?.clientY;
        if (this.touchY === null || y === undefined) return;
        this.nudge((this.touchY - y) / (window.innerHeight * 0.45));
        this.touchY = y;
    };

    onTouchEnd = () => {
        this.touchY = null;
    };

    onKey = (e: KeyboardEvent) => {
        if (!this.enabled) return;
        const base = Math.round(this.target);
        if (['ArrowDown', 'PageDown', ' '].includes(e.key)) this.goTo(base + 1);
        else if (['ArrowUp', 'PageUp'].includes(e.key)) this.goTo(base - 1);
        else return;
        e.preventDefault();
    };

    update(dt: number) {
        // input over: settle on a whole step, biased toward the direction of travel
        if (this.lastInput && performance.now() - this.lastInput > IDLE_MS && this.touchY === null) {
            this.lastInput = 0;
            const base = Math.floor(this.target);
            const frac = this.target - base;
            const forward = this.dir > 0 ? frac > COMMIT : frac > 1 - COMMIT;
            this.target = Math.min(this.total, base + (forward ? 1 : 0));
        }
        // critically damped spring, integrated in small steps (stable at any frame rate)
        const w = this.lastInput ? W_FOLLOW : W_SETTLE;
        const n = Math.max(1, Math.ceil(dt / (1 / 120)));
        const h = dt / n;
        for (let i = 0; i < n; i++) {
            const acc = w * w * (this.target - this.pos) - 2 * w * this.vel;
            this.vel += acc * h;
            this.pos += this.vel * h;
        }
        if (!this.lastInput && Math.abs(this.target - this.pos) < 0.0006 && Math.abs(this.vel) < 0.002 && this.pos !== this.target) {
            this.pos = this.target;
            this.vel = 0;
            if (this.target >= this.total)
                this.set(0); // looped past the footer
            else this.onSettle(this.target);
        }
    }

    get settled() {
        return this.pos === this.target && !this.lastInput;
    }
}
