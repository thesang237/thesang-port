import { gsap } from './gsap';

/** The source's block-reveal numbers (motion-kit/BlockReveal.tsx), measured at 30 fps in the reference. */
export const BLOCK = { grow: 0.24, hold: 0.05, retract: 0.3, stagger: 0.06, ease: 'power2.inOut' } as const;

export type BlockOpts = { grow?: number; hold?: number; retract?: number; stagger?: number; ease?: string; flipOrigin?: boolean };

/**
 * Teaching copy of BlockReveal's per-line timeline. `lines` hold the --br-text variable,
 * `blocks` are the absolutely-positioned colour bars inside each line.
 */
export function blockReveal(lines: HTMLElement[], blocks: HTMLElement[], o: BlockOpts = {}, tl = gsap.timeline()) {
    const grow = o.grow ?? BLOCK.grow;
    const hold = o.hold ?? BLOCK.hold;
    const retract = o.retract ?? BLOCK.retract;
    const stagger = o.stagger ?? BLOCK.stagger;
    const ease = o.ease ?? BLOCK.ease;
    const flip = o.flipOrigin ?? true;
    lines.forEach((line, i) => {
        const at = i * stagger;
        const block = blocks[i];
        tl.set(line, { '--br-text': 0 }, at)
            .fromTo(block, { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: grow, ease }, at)
            .set(line, { '--br-text': 1 }, at + grow)
            .set(block, { transformOrigin: flip ? '100% 50%' : '0% 50%' }, at + grow + hold)
            .to(block, { scaleX: 0, duration: retract, ease }, at + grow + hold);
    });
    return tl;
}

/** Hide text + blocks again (before a replay). */
export function blockReset(lines: HTMLElement[], blocks: HTMLElement[]) {
    gsap.set(lines, { '--br-text': 0 });
    gsap.set(blocks, { scaleX: 0 });
}
