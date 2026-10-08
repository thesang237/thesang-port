import { useState } from 'react';

import { Demo, Readout, Slider, Toggle } from '../kit/controls';
import { Artwork } from '../kit/ui';

export default function Map() {
    const [progress, setProgress] = useState(0.35);
    const [shared, setShared] = useState(true);
    return (
        <Demo
            title="Two layers, one position"
            hint="Scrub the shared number. The outline is the HTML click area."
            onReset={() => {
                setProgress(0.35);
                setShared(true);
            }}
            controls={
                <>
                    <Slider label="Shared progress" value={progress} min={0} max={1} step={0.01} help="The same 0→1 number moves the photo and HTML area." onChange={setProgress} />
                    <Toggle label="Share the values" checked={shared} onChange={setShared} help="Disable it to show why independently driven layers drift." />
                    <Readout>input → current → HTML + canvas</Readout>
                </>
            }
        >
            <div className="fl-map-diagram">
                <span>INPUT</span>
                <b>→</b>
                <span>NUMBERS</span>
                <b>→</b>
                <span>PIXELS</span>
            </div>
            <div className="fl-map-space">
                <div className="fl-map-photo" style={{ transform: `translateX(${(progress - 0.5) * 150}px) rotate(${(progress - 0.5) * 8}deg)` }}>
                    <Artwork />
                </div>
                <div className="fl-map-label" style={{ transform: `translateX(${((shared ? progress : 0.35) - 0.5) * 150}px) rotate(${((shared ? progress : 0.35) - 0.5) * 8}deg)` }}>
                    <span>HTML HIT AREA</span>
                </div>
            </div>
            <p className="fl-stage-caption">This study uses SVG as the image layer; Floema uses WebGL.</p>
        </Demo>
    );
}
