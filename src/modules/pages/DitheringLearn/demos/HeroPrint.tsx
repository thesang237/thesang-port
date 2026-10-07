'use client';
import { useRef } from 'react';

import { PRINT_PRESETS } from '@/modules/pages/Dithering/settings';

import { FallbackPrint } from '../kit/FallbackPrint';
import type { LabParams } from '../kit/usePrintCanvas';
import { usePrintCanvas } from '../kit/usePrintCanvas';
const PARAMS: LabParams = {
    dither: { ...PRINT_PRESETS[2].settings, ink: '#22261f', paper: '#f2eee6', grain: 0.02 },
    subject: 1,
    phase: 1,
    frequency: 9,
    density: 1.5,
    play: false,
    preGlow: false,
    postGlow: false,
};
export default function HeroPrint() {
    const host = useRef<HTMLDivElement>(null);
    usePrintCanvas(host, PARAMS);
    return (
        <figure className="dl-hero-plate">
            <div ref={host} className="dl-stage">
                <FallbackPrint>Static orbital plate · the live shader needs WebGL.</FallbackPrint>
            </div>
            <figcaption>
                <span>Plate 001 / Orbital press</span>
                <span>Live shader · nine-pixel screen</span>
            </figcaption>
        </figure>
    );
}
