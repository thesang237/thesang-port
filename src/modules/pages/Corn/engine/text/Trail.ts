import * as THREE from 'three';

export const TRAIL_SIZE = 16;
const LIFE = 1.0; // s until a trail point has healed (letters re-form ≈1 s after the pointer passes)
const SPACING = 12; // px of pointer travel between recorded points
const HOLD_IN = 0.55; // s for a press to open the big field
const HOLD_OUT = 1.1; // s for it to close after release

/**
 * The pointer's influence on the titles, shared by all of them (uniforms):
 * - hover: recent pointer positions with fading strength (small area, follows the movement)
 * - press & hold: one disc that grows while the button is down and shrinks after release
 *   (big area; each title scales its radius by its cap height).
 */
export class Trail {
    readonly uniform = Array.from({ length: TRAIL_SIZE }, () => new THREE.Vector3(-1e4, -1e4, 0));
    /** x, y (px), strength 0..1 of the press field. */
    readonly hold = new THREE.Vector3(-1e4, -1e4, 0);
    /**
     * x, y (px), strength 0..1 of the resting field: stays open at the default size for as long as
     * the pointer is on a title, moving or not (pass 4), and closes gently once it leaves.
     */
    readonly hover = new THREE.Vector3(-1e4, -1e4, 0);
    private hoverOn = false;
    private age = new Float32Array(TRAIL_SIZE).fill(LIFE);
    private head = 0;
    private last = new THREE.Vector2(-1e4, -1e4);
    private pressed = false;
    private holdT = 0;

    /** Record the pointer (screen px) while it is over a title. */
    push(x: number, y: number) {
        if (this.pressed) this.hold.set(x, y, this.hold.z);
        if (Math.hypot(x - this.last.x, y - this.last.y) < SPACING) return;
        this.last.set(x, y);
        this.head = (this.head + 1) % TRAIL_SIZE;
        this.uniform[this.head].set(x, y, 1);
        this.age[this.head] = 0;
    }

    press(x: number, y: number) {
        this.pressed = true;
        this.hold.set(x, y, this.hold.z);
    }

    release() {
        this.pressed = false;
    }

    /** The pointer (screen px) and whether it is over a drawn title, every frame. */
    rest(x: number, y: number, on: boolean) {
        this.hoverOn = on;
        if (!on) return;
        if (this.hover.z < 0.01) this.hover.set(x, y, this.hover.z);
        this.hover.x = x;
        this.hover.y = y;
    }

    update(dt: number) {
        // open in ≈ 0.35 s, close in ≈ 0.8 s (ease toward the target)
        this.hover.z += ((this.hoverOn ? 1 : 0) - this.hover.z) * (1 - Math.exp(-(this.hoverOn ? 7 : 3.5) * dt));
        for (let i = 0; i < TRAIL_SIZE; i++) {
            if (this.age[i] >= LIFE) {
                this.uniform[i].z = 0;
                continue;
            }
            this.age[i] += dt;
            const k = Math.min(1, this.age[i] / LIFE);
            this.uniform[i].z = Math.min(1, (1 - k) * (1 - k) * 1.5); // quick break-up, slow heal
        }
        this.holdT = Math.min(1, Math.max(0, this.holdT + (this.pressed ? dt / HOLD_IN : -dt / HOLD_OUT)));
        // ease out while opening, ease in-out while closing
        const t = this.holdT;
        this.hold.z = this.pressed ? 1 - Math.pow(1 - t, 3) : t * t * (3 - 2 * t);
    }

    clear() {
        this.age.fill(LIFE);
        this.uniform.forEach((v) => (v.z = 0));
        this.last.set(-1e4, -1e4);
        this.pressed = false;
        this.holdT = 0;
        this.hold.z = 0;
        this.hover.z = 0;
        this.hoverOn = false;
    }
}
