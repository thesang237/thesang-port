'use client';

import { useRef } from 'react';

import { Btn, Demo, Readout, Slider } from '../kit/controls';
import { gsap } from '../kit/gsap';
import { useParams } from '../kit/loop';
import { footerLottie, setLottieProgress, useLottie } from '../kit/source';

const DEFAULTS = { progress: 28 };

// the eight blocks are the first eight layers; each layer’s “in point” is its start frame (60 fps file)
const STARTS = (footerLottie.layers as { ip: number }[])
    .slice(0, 8)
    .map((l) => l.ip)
    .sort((a, b) => a - b);
const GAP_MS = ((STARTS[1] - STARTS[0]) / 60) * 1000;

/** The footer logo: eight blocks tumble in, each starting two frames after the last. The stagger lives inside the animation file. */
export default function FooterStagger() {
    const { p, set, reset } = useParams(DEFAULTS);
    const box = useRef<HTMLDivElement>(null);
    const anim = useLottie(box, footerLottie, (a) => a.goToAndStop((a.totalFrames * DEFAULTS.progress) / 100, true));
    const proxy = useRef({ v: 0 });

    const apply = (v: number) => {
        set('progress', v);
        setLottieProgress(anim.current, v);
    };
    const play = () => {
        gsap.killTweensOf(proxy.current);
        proxy.current.v = 0;
        apply(0);
        gsap.to(proxy.current, { v: 99, duration: 2.8, ease: 'none', onUpdate: () => apply(proxy.current.v) });
    };

    return (
        <Demo
            title="Stagger inside the file: the footer logo’s eight blocks"
            hint="Drag the progress slowly between 15% and 45%: the blocks rise one after another, each two frames behind the last. The page just plays the whole file in 2.8s when the footer comes into view."
            onReset={() => {
                gsap.killTweensOf(proxy.current);
                reset();
                setLottieProgress(anim.current, DEFAULTS.progress);
            }}
            controls={
                <>
                    <Slider label="file progress" value={p.progress} min={0} max={99} step={0.1} onChange={apply} format={(v) => `${v.toFixed(1)}%`} />
                    <Btn primary onClick={play}>
                        ▶ Play 2.8s
                    </Btn>
                    <Readout
                        items={[
                            { label: 'layer in-points', value: `${STARTS[0]} → ${STARTS[7]} frames` },
                            { label: 'gap between blocks', value: `${GAP_MS.toFixed(0)} ms` },
                            { label: 'house rule', value: '70 ms' },
                        ]}
                    />
                </>
            }
        >
            <div className="bg-[#e7e4df] p-4">
                <div ref={box} className="w-full" style={{ aspectRatio: '1440 / 368' }} />
            </div>
        </Demo>
    );
}
