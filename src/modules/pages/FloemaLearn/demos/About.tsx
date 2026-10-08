import { useRef, useState } from 'react';

import { Demo, Select, Slider, Toggle } from '../kit/controls';
import { useParams, useTicker } from '../kit/loop';
import { mix, wrap } from '../kit/motion';
import { Artwork } from '../kit/ui';

const DEFAULTS = { progress: 0.5, travel: 50, curve: 1, speed: 60, playing: false, variant: 'photos' };
export default function About() {
    const host = useRef<HTMLDivElement>(null),
        row = useRef<HTMLDivElement>(null),
        runtime = useRef({ offset: 0 });
    const [defaults] = useState(() => ({ ...DEFAULTS, travel: window.innerWidth < 1024 ? 10 : 50 }));
    const { values, live, set, reset } = useParams(defaults);
    useTicker(host, (_t, dt) => {
        const element = row.current;
        if (!element) return;
        const p = live.current;
        if (p.playing) runtime.current.offset += p.speed * dt;
        const width = element.clientWidth,
            cycle = 600;
        element.querySelectorAll<HTMLElement>('[data-arc-card]').forEach((card, i) => {
            const x = wrap(i * 120 + runtime.current.offset, -120, cycle - 120),
                center = (x + 50 - width / 2) / width;
            const curve = (Math.cos(center * Math.PI * 0.1) - 1) * 60;
            card.style.transform = `translate3d(${x}px,${-curve * 40 * p.curve}px,0) rotate(${center * 36 * p.curve}deg)`;
        });
    });
    return (
        <Demo
            stageRef={host}
            title="Parallax above, curved loop below"
            hint="Scrub the photo’s viewport journey, then play the row."
            onReset={() => {
                reset();
                runtime.current.offset = 0;
            }}
            controls={
                <>
                    <Slider
                        label="Viewport progress"
                        value={values.progress}
                        min={0}
                        max={1}
                        step={0.01}
                        help="0 enters below; 1 leaves above. Maps the image shift and scale."
                        onChange={(v) => set('progress', v)}
                    />
                    <Slider label="Image travel" value={values.travel} min={0} max={100} unit="px" help="Source uses ±50px desktop and ±10px on narrow screens." onChange={(v) => set('travel', v)} />
                    <Slider
                        label="Arc strength"
                        value={values.curve}
                        min={0}
                        max={4}
                        step={0.1}
                        help="1 uses the source curve formula, scaled for this small study."
                        onChange={(v) => set('curve', v)}
                    />
                    <Toggle label="Play the row" checked={values.playing} help="60px/s source drift; pauses outside the viewport." onChange={(v) => set('playing', v)} />
                    <Select
                        label="Row variation"
                        value={values.variant}
                        choices={[
                            ['photos', 'Photo archive'],
                            ['records', 'Record shelf'],
                        ]}
                        help="Same wrap and arc rules, different content shape."
                        onChange={(v) => set('variant', v)}
                    />
                </>
            }
        >
            <div className="fl-parallax-study">
                <div className="fl-parallax-frame">
                    <div style={{ transform: `translateY(${mix(values.travel, -values.travel, values.progress)}px) scale(${mix(1, 1.15, values.progress)})` }}>
                        <Artwork index={3} />
                    </div>
                </div>
                <span className="fl-stage-caption">
                    frame stays still
                    <br />
                    image moves inside
                </span>
            </div>
            <div ref={row} className={`fl-arc-row ${values.variant === 'records' ? 'is-records' : ''}`}>
                {Array.from({ length: 5 }, (_, i) => (
                    <div data-arc-card key={i}>
                        {values.variant === 'records' ? (
                            <div className="fl-record">
                                <i />
                                <span>VOL. {i + 1}</span>
                            </div>
                        ) : (
                            <Artwork index={i} />
                        )}
                    </div>
                ))}
            </div>
        </Demo>
    );
}
