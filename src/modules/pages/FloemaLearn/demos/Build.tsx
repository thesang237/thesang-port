import { useState } from 'react';

import { Demo, Select, Slider } from '../kit/controls';
import { Code } from '../kit/ui';

const RECIPES = {
    postcard: {
        title: 'Postcard flip',
        trigger: 'A deliberate click',
        value: 'progress: 0 → 1',
        property: 'rotation: 0 → 180°; scale and position share progress',
        interrupt: 'Reverse from the current value on Close.',
        code: "const dial = { progress: 0 };\ngsap.to(dial, {\n  progress: 1, duration: DURATION, ease: 'expo.inOut',\n  onUpdate: () => draw(dial.progress)\n});\n// draw() uses mix(start, end, progress) for each property.",
    },
    archive: {
        title: 'Infinite archive',
        trigger: 'A drag or wheel input',
        value: 'target → damped current → wrapped position',
        property: 'horizontal card position; HTML captions read current',
        interrupt: 'A new gesture changes the target immediately.',
        code: 'target += inputDelta;\n// In the shared clock:\ncurrent = damp(current, target, 0.1, dt);\nconst x = wrap(baseX + current, min, max);\n// Write x to the photo and its HTML hit area.',
    },
    heading: {
        title: 'Once-only heading',
        trigger: 'The heading enters the viewport',
        value: 'played: false → true',
        property: 'text rises inside a stationary line mask',
        interrupt: 'Keep finished text visible after scroll-back and resize.',
        code: 'if (visible && !played) {\n  played = true;\n  gsap.fromTo(lines, { yPercent: 100 }, {\n    yPercent: 0, duration: DURATION, stagger: 0.1\n  });\n}',
    },
};
export default function Build() {
    const [recipe, setRecipe] = useState<keyof typeof RECIPES>('postcard'),
        [duration, setDuration] = useState(2),
        [copied, setCopied] = useState(false);
    const plan = RECIPES[recipe];
    const code = plan.code.replace('DURATION', String(duration));
    const brief = `${plan.title}\nTrigger: ${plan.trigger}\nDriver: ${plan.value}\nChanges: ${plan.property}\nInterruption: ${plan.interrupt}\nAccessibility: real button, keyboard operation, reduced-motion still state.\nBefore adding more: test phone layout, interruption, and cleanup.\n\n${code}`;
    return (
        <>
            <Demo
                title="Your first motion brief"
                hint="Choose a small idea. Leave with a rule and a starting point."
                onReset={() => {
                    setRecipe('postcard');
                    setDuration(2);
                    setCopied(false);
                }}
                controls={
                    <>
                        <Select
                            label="Build a study"
                            value={recipe}
                            choices={[
                                ['postcard', 'Postcard flip'],
                                ['archive', 'Infinite archive'],
                                ['heading', 'Once-only heading'],
                            ]}
                            help="Choose the smallest idea you can finish and explain."
                            onChange={(v) => {
                                setRecipe(v as keyof typeof RECIPES);
                                setCopied(false);
                            }}
                        />
                        <Slider label="Timed duration" value={duration} min={0.2} max={3} step={0.1} unit="s" help="Used by timed recipes; the archive follows input instead." onChange={setDuration} />
                        <button
                            className="fl-button fl-primary"
                            onClick={async () => {
                                try {
                                    await navigator.clipboard.writeText(brief);
                                    setCopied(true);
                                } catch {
                                    setCopied(false);
                                }
                            }}
                        >
                            {copied ? 'Copied ✓' : 'Copy the brief'}
                        </button>
                    </>
                }
            >
                <div className="fl-plan">
                    <span className="fl-label">YOUR STUDY</span>
                    <h4>{plan.title}</h4>
                    <dl>
                        <div>
                            <dt>TRIGGER</dt>
                            <dd>{plan.trigger}</dd>
                        </div>
                        <div>
                            <dt>DRIVER</dt>
                            <dd>{plan.value}</dd>
                        </div>
                        <div>
                            <dt>WHAT MOVES</dt>
                            <dd>{plan.property}</dd>
                        </div>
                        <div>
                            <dt>IF INTERRUPTED</dt>
                            <dd>{plan.interrupt}</dd>
                        </div>
                    </dl>
                </div>
            </Demo>
            <Code code={code} file="Teaching starter · adapt draw() to your layout" highlighted={[3, 4]} />
            <p className="fl-small-note">This is the core rule, not a complete application. The relevant chapter shows the surrounding layout and lifecycle.</p>
        </>
    );
}
