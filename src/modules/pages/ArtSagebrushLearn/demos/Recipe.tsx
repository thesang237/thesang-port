'use client';

import { useState } from 'react';

import { Slider } from '../kit/controls';

export default function Recipe() {
    const [seed, setSeed] = useState(42);
    const [noise, setNoise] = useState(1337);
    const [brief, setBrief] = useState('Botanical atlas');
    const [message, setMessage] = useState('');
    const recipe = `// ${brief} · edition ${seed}\nimport { createNoise } from '@/modules/pages/ArtSagebrush/art/noise';\nimport { createRandom } from '@/modules/pages/ArtSagebrush/art/random';\n\nconst choiceSeed = ${seed};\nconst noiseSeed = ${noise};\nconst random = createRandom(choiceSeed);\nconst noise = createNoise(noiseSeed);\n\n// Keep these streams alive for the entire composition.\n// Study: ${brief === 'Botanical atlas' ? 'reuse createPlantBuilders; hold height steady, vary seed.' : brief === 'Contour edition' ? 'reuse createHeightfield; vary band count, hold noise seed.' : 'reuse InkStroke; hold the path steady, vary wobble.'}`;
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(recipe);
            setMessage('Recipe copied.');
        } catch {
            setMessage('Copy unavailable. Select the recipe text below.');
        }
    };
    return (
        <div className="sg-recipe">
            <div>
                <span className="sg-label">Your edition record</span>
                <label className="sg-select">
                    Creative brief
                    <select value={brief} onChange={(event) => setBrief(event.target.value)}>
                        <option>Botanical atlas</option>
                        <option>Contour edition</option>
                        <option>Ink lettering</option>
                    </select>
                </label>
                <Slider label="Choice seed" help="An identifier for this edition’s sequence of choices." value={seed} min={0} max={100} onChange={setSeed} />
                <Slider label="Noise seed" help="Hold this steady to keep the terrain family related." value={noise} min={1300} max={1400} onChange={setNoise} />
                <div className="sg-actions">
                    <button
                        type="button"
                        onClick={() => {
                            setSeed(42);
                            setNoise(1337);
                            setBrief('Botanical atlas');
                            setMessage('');
                        }}
                    >
                        Reset
                    </button>
                    <button type="button" onClick={copy}>
                        Copy starter
                    </button>
                    <a href={`/art-sagebrush?seed=${seed}&noise=${noise}`} target="_blank" rel="noreferrer">
                        Open seeded landscape ↗
                    </a>
                </div>
                <p role="status">{message}</p>
                <p className="sg-note">
                    The landscape link applies the two seeds to the original artwork. The creative brief describes your next composition; it does not change that route into a new artwork.
                </p>
            </div>
            <pre>
                <code>{recipe}</code>
            </pre>
        </div>
    );
}
