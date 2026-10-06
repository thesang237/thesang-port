'use client';

import { useRef, useState } from 'react';

import { drawAll, paintClaims, paintZones } from '../kit/art';
import { Demo, Segmented } from '../kit/controls';
import { useCanvas2D } from '../kit/loop';
import { buildScene } from '../kit/source';

import { SeedPicker } from './SeedPicker';

const VIEWS = [
    { value: 'claims', label: 'Which dune' },
    { value: 'zones', label: 'Zones' },
    { value: 'sand', label: 'Sand' },
] as const;
type View = (typeof VIEWS)[number]['value'];

/** A whole scene: which dune answered each point (front dune first), the zones, the sand. */
export default function ZoneOrder() {
    const host = useRef<HTMLDivElement>(null);
    const [seed, setSeed] = useState('r5');
    const [view, setView] = useState<View>('claims');

    useCanvas2D(
        host,
        (ctx, w) => {
            const scene = buildScene(seed, w);
            if (view === 'claims') paintClaims(ctx, scene, w, 2);
            else if (view === 'zones') paintZones(ctx, scene, w, 2);
            else drawAll(ctx, scene, w);
        },
        [seed, view],
    );

    return (
        <Demo
            title="Front to back: the first dune that answers wins"
            hint="Each hue is one dune (darker = its core, paler = its slope). Dunes are asked front first; a point only reaches a back dune if every dune in front said “not me”."
            controls={
                <>
                    <SeedPicker seed={seed} onChange={setSeed} />
                    <Segmented<View> label="View" options={VIEWS} value={view} onChange={setView} />
                </>
            }
        >
            <div className="p-4 sm:p-6">
                <div ref={host} className="mx-auto aspect-square w-full max-w-[520px]" role="img" aria-label={`Seed ${seed}, ${view}`} />
            </div>
        </Demo>
    );
}
