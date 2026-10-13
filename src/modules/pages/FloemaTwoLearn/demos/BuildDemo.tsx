'use client';
import { useParams } from '../kit/runtime';
import { Code, Demo, Slider } from '../kit/ui';
const defaults = { scenes: 5, screens: 9, parallax: 4 };
export default function BuildDemo() {
    const { p, set, reset } = useParams(defaults);
    const code = `'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
export default function ScrollStory() {
  const root = useRef(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray('[data-shot]');
      gsap.set(panels.slice(1), { clipPath: 'inset(100% 0 0)' });
      const tl = gsap.timeline({ scrollTrigger: {
        trigger: root.current, start: 'top top',
        end: 'bottom bottom', scrub: true,
      }});
      panels.slice(1).forEach((panel, i) => {
        tl.to(panel, { clipPath: 'inset(0% 0 0)', duration: 1, ease: 'none' }, i);
        tl.fromTo(panel.firstChild, { yPercent: -${p.parallax} },
          { yPercent: 0, duration: 1.6, ease: 'none' }, i);
      });
    }, root);
    return () => ctx.revert();
  }, []);
  return <section ref={root} style={{ height: '${p.screens * 100}vh' }}>
    <div style={{ position: 'sticky', top: 0, height: '100svh', overflow: 'hidden' }}>
      {Array.from({ length: ${p.scenes} }, (_, i) => <div data-shot key={i}
        style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div style={{ height: '120%', background: 'hsl(' + (150+i*25) + ' 20% 45%)' }}>
          <h2>Scene {i + 1}</h2>
        </div>
      </div>)}
    </div>
  </section>;
}`;
    return (
        <>
            <Demo
                title="Turn the storyboard into a starter"
                hint="Choose the number of scenes and their available scroll distance."
                reset={reset}
                tryThis="Give eight scenes only two screens of travel. The storyboard gets crowded: fewer scenes or more distance restores time to read."
                controls={
                    <>
                        <Slider label="Scenes" value={p.scenes} min={2} max={8} onChange={(v) => set('scenes', v)} help="How many distinct compositions the story contains." />
                        <Slider
                            label="Track length"
                            value={p.screens}
                            min={2}
                            max={16}
                            onChange={(v) => set('screens', v)}
                            help="Total viewport heights. One is occupied by the sticky stage."
                            suffix=" screens"
                        />
                        <Slider label="Image parallax" value={p.parallax} min={0} max={20} onChange={(v) => set('parallax', v)} help="Small image offset inside each revealing mask." suffix="%" />
                    </>
                }
            >
                <div className="f2l-storyboard">
                    <span className="f2l-eyebrow">YOUR SCROLL SCORE</span>
                    <div>
                        {Array.from({ length: p.scenes }, (_, i) => (
                            <div key={i}>
                                <span>0{i + 1}</span>
                                <i style={{ height: `${36 + (i % 3) * 16}px` }} />
                                <small>{((i / p.scenes) * 100).toFixed(0)}%</small>
                            </div>
                        ))}
                    </div>
                    <p>
                        <strong>{((p.screens - 1) / p.scenes).toFixed(2)} screens</strong> of travel per scene on average
                    </p>
                    <span className="f2l-plan-note">
                        {(p.screens - 1) / p.scenes < 0.5
                            ? 'Tight pacing: simplify the content or add scroll distance.'
                            : 'Room to read: tune the enter, hold, and exit while comparing the reference.'}
                    </span>
                </div>
            </Demo>
            <details className="f2l-generated">
                <summary>
                    Open your generated React starter <span>↓</span>
                </summary>
                <p>Plain JavaScript component with GSAP. Replace the coloured panels with your content. Add your reduced-motion layout before shipping.</p>
                <Code file="Generated teaching starter / ScrollStory.jsx" code={code} lines={[12, 14, 17]} />
            </details>
            <div className="f2l-build-checklist">
                <span className="f2l-eyebrow">BEFORE YOU SHIP</span>
                {[
                    'Static composition and meaningful reading order',
                    'One owner for each animated property',
                    'Keyboard, reduced motion, and WebGL fallback',
                    'Matching captures, scroll reversal, and measured performance',
                ].map((item) => (
                    <label key={item}>
                        <input type="checkbox" />
                        {item}
                    </label>
                ))}
            </div>
        </>
    );
}
