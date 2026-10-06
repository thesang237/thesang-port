'use client';

import { useMemo, useRef, useState } from 'react';

import { bakeSeed } from '../kit/bake';
import { Demo, Segmented } from '../kit/controls';
import { DUNES, GRAIN, HASH, UNWARP } from '../kit/glsl';
import { Code } from '../kit/ui';
import { useDune } from '../kit/useDune';

// each step: the main() shown to the reader, and the pieces it needs pasted in front
const POS = `vec2 c = vec2(gl_FragCoord.x / uResolution.x, 1.0 - gl_FragCoord.y / uResolution.y);`;
const STEPS = {
    '1': {
        label: '1 · Position',
        note: 'Every pixel runs main() at the same time and only knows its own position. Here it just shows it: red grows across, green grows down.',
        head: '',
        main: `void main() {
    // this pixel's position, 0..1, y down like the art's canvas
    vec2 c = vec2(gl_FragCoord.x / uResolution.x, 1.0 - gl_FragCoord.y / uResolution.y);
    fragColor = vec4(c.x, c.y, 0.55, 1.0);   // red = across, green = down
}`,
    },
    '2': {
        label: '2 · Unwarp',
        note: 'Each pixel asks unwarp() where it came from, then draws grid lines in model space. The bent grid is chapter 06, computed per pixel.',
        head: UNWARP,
        main: `void main() {
    ${POS}
    vec2 m = unwarp(c) * 10.0;                       // model space, 10 cells across
    vec2 g = abs(fract(m - 0.5) - 0.5) / fwidth(m);  // distance to the nearest grid line, in pixels
    float line = 1.0 - min(min(g.x, g.y), 1.0);
    fragColor = vec4(mix(vec3(0.98, 0.96, 0.94), vec3(0.12, 0.11, 0.13), line), 1.0);
}`,
    },
    '3': {
        label: '3 · Shade',
        note: 'Now each pixel runs the boundary-map test (chapter 05) against the baked maps: three flat zones, no grain yet.',
        head: UNWARP + DUNES,
        main: `void main() {
    ${POS}
    int which;
    int zone = shadeAt(unwarp(c), which);           // 0 core · 1 slope · 2 sky
    vec3 col = zone == 0 ? vec3(0.12, 0.11, 0.13)
             : zone == 1 ? vec3(0.87, 0.52, 0.44)
             :             vec3(0.95, 0.90, 0.85);
    fragColor = vec4(col, 1.0);
}`,
    },
    '4': {
        label: '4 · Grain',
        note: 'Finally the brush: each dot-sized cell hashes its position into a few dice rolls and keeps ink with the zone’s chance. That’s the whole artwork.',
        head: HASH + UNWARP + DUNES + GRAIN + 'uniform vec3 uDensity; uniform vec3 uPaper; uniform vec3 uInk;\n',
        main: `void main() {
    ${POS}
    int which;
    int zone = shadeAt(unwarp(c), which);
    float density = zone == 0 ? uDensity.x : zone == 1 ? uDensity.y : uDensity.z;
    float ink = inkAt(c, density);                  // how many grains landed in this cell?
    fragColor = vec4(mix(uPaper, uInk, ink), 1.0);
}`,
    },
} as const;
type Step = keyof typeof STEPS;

/** The dune shader built up in four steps, each a complete, running fragment shader. */
export default function ShaderSteps() {
    const host = useRef<HTMLDivElement>(null);
    const [step, setStep] = useState<Step>('1');
    const { scene, baked } = useMemo(() => bakeSeed('r10'), []);
    const s = STEPS[step];

    useDune(host, s.head + s.main, scene, baked, () => {});

    return (
        <Demo
            title="A shader in four steps"
            hint={s.note}
            stacked
            controls={<Segmented<Step> label="Step" options={(Object.keys(STEPS) as Step[]).map((k) => ({ value: k, label: STEPS[k].label }))} value={step} onChange={setStep} />}
        >
            <div className="grid items-start gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
                <div className="aspect-square w-full">
                    <div ref={host} className="relative size-full" />
                </div>
                <Code file={`step ${step} · main()`} lang="glsl">
                    {s.main}
                </Code>
            </div>
        </Demo>
    );
}
