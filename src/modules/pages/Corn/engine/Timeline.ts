import { CHAPTERS, LAST, SECTIONS } from '../data/story';

/**
 * Scroll steps ↔ story. The scroller snaps on whole steps. Every chapter owns `dwell` steps where the
 * story stays on it (the scene travels on, the copy holds) and then one step that carries the story
 * to the next chapter (the wipe or blend). So with the default dwell of 1, one short scroll moves the
 * scene within the chapter, a second one (or one long scroll) moves on.
 *
 *   step:  0 ───── 1 ───── 2 ───── 3 …            (hero dwell 1)
 *   story: hero    hero    library  library …
 *          dwell 0 dwell 1 dwell 0  dwell 1
 *
 * The last step past the footer is the hero again (the loop).
 */
export class Timeline {
    /** Step at which each chapter has arrived (its dwell 0). */
    readonly starts: number[] = [];
    readonly dwells = CHAPTERS.map((c) => c.dwell ?? 1);
    /** Step of the looped hero (one past the end). */
    readonly total: number;

    constructor() {
        let s = 0;
        this.dwells.forEach((d) => {
            this.starts.push(s);
            s += d + 1;
        });
        this.total = s;
    }

    /** Story position (chapter index, fractional while moving between chapters) and the dwell 0..1 of
     * the chapter at floor(pos). */
    toStory(step: number) {
        if (step >= this.total) return { pos: LAST + 1, dwell: 0 };
        let i = LAST;
        while (i > 0 && step < this.starts[i]) i--;
        const u = step - this.starts[i];
        const d = this.dwells[i];
        if (u <= d) return { pos: i, dwell: d ? u / d : 0 };
        return { pos: i + (u - d), dwell: 1 };
    }

    /** Step for a story position (integer = arrival at that chapter). */
    fromStory(pos: number, dwell = 0) {
        const i = Math.max(0, Math.min(LAST, Math.floor(pos)));
        const f = pos - i;
        if (pos >= LAST + 1) return this.total;
        return f > 0 ? this.starts[i] + this.dwells[i] + f : this.starts[i] + dwell * this.dwells[i];
    }

    /** The section a step belongs to, how far through it (0..1) and how many snaps it has. */
    section(step: number) {
        const first = SECTIONS.map((s) => CHAPTERS.findIndex((c) => c.section === s.id));
        for (let k = SECTIONS.length - 1; k >= 0; k--) {
            const a = this.starts[first[k]];
            if (step >= a - 1e-6) {
                const b = k + 1 < SECTIONS.length ? this.starts[first[k + 1]] : this.total;
                return { index: k, progress: Math.min(1, (step - a) / (b - a)), segments: b - a };
            }
        }
        return { index: -1, progress: 0, segments: 1 };
    }

    /** Snap count of every section (for the nav rings). */
    segmentsOf(k: number) {
        return this.section(this.starts[CHAPTERS.findIndex((c) => c.section === SECTIONS[k].id)]).segments;
    }
}
