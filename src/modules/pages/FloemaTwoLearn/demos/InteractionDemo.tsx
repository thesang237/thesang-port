'use client';
import { useState } from 'react';

import { Demo, Landscape, Slider } from '../kit/ui';
export default function InteractionDemo() {
    const [split, setSplit] = useState(50);
    const [hotspot, setHotspot] = useState<number | null>(null);
    const [size, setSize] = useState(44);
    return (
        <div className="f2l-lab-pair">
            <Demo
                title="One landscape, two seasons"
                hint="Drag the dial, then focus it and try the arrow keys."
                reset={() => setSplit(50)}
                tryThis="Move to 0% and 100%. Neither image should drift; the crop and its picture move in opposite directions."
                controls={
                    <>
                        <Slider label="Amount of winter" value={split} min={0} max={100} onChange={setSplit} help="A native range input supplies pointer, touch, and keyboard behavior." suffix="%" />
                        <p className="f2l-live-status" aria-live="polite">
                            {split}% winter / {100 - split}% summer
                        </p>
                    </>
                }
            >
                <div className="f2l-comparison">
                    <Landscape variant={1} />
                    <div className="f2l-winter" style={{ transform: `translateX(${split - 100}%)` }}>
                        <div style={{ transform: `translateX(${100 - split}%)` }}>
                            <Landscape variant={4} />
                        </div>
                    </div>
                    <span style={{ left: `${split}%` }}>
                        <i>↔</i>
                    </span>
                    <b>WINTER / SUMMER</b>
                </div>
            </Demo>
            <Demo
                title="A hotspot you can reach"
                hint="Hover, tap, or Tab to a point. Each input reveals the same label."
                reset={() => {
                    setHotspot(null);
                    setSize(44);
                }}
                tryThis="Reduce the target to 24px and compare how easy it is to acquire. Restore 44px before designing touch interactions."
                controls={
                    <>
                        <Slider label="Target size" value={size} min={24} max={64} onChange={setSize} help="Changes the hit area, not the amount of information." suffix="px" />
                        <p className="f2l-live-status">Focus shows the label. Enter or Space toggles it. Escape closes it.</p>
                    </>
                }
            >
                <div className="f2l-hotspot-stage">
                    <div className="f2l-hotspot-object" />
                    <div className="f2l-hotspot-buttons">
                        {['Replaceable face', 'Protected joint', 'Recycled base'].map((text, i) => (
                            <div key={text} style={{ left: `${[35, 67, 43][i]}%`, top: `${[23, 48, 78][i]}%` }}>
                                <button
                                    style={{ width: size, height: size }}
                                    aria-label={text}
                                    aria-expanded={hotspot === i}
                                    aria-controls={`f2l-hotspot-${i}`}
                                    onMouseEnter={() => setHotspot(i)}
                                    onMouseLeave={() => setHotspot(null)}
                                    onFocus={() => setHotspot(i)}
                                    onBlur={() => setHotspot(null)}
                                    onClick={() => setHotspot(hotspot === i ? null : i)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape') setHotspot(null);
                                    }}
                                >
                                    +
                                </button>
                                <span id={`f2l-hotspot-${i}`} hidden={hotspot !== i}>
                                    {text}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </Demo>
        </div>
    );
}
