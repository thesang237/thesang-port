import styles from './ControlPanel.module.css';

import { useEffect, useRef, useState } from 'react';
import type * as THREE from 'three';

type ControlPanelProps = {
    visible: boolean;
    colorState: React.MutableRefObject<{
        colorGrnd1: THREE.Color;
        colorGrnd2: THREE.Color;
        colorEdge: THREE.Color;
        colorPeak: THREE.Color;
        targetColorGrnd1: THREE.Color;
        targetColorGrnd2: THREE.Color;
        targetColorEdge: THREE.Color;
        targetColorPeak: THREE.Color;
    }>;
    shaderUniformsRef: React.MutableRefObject<any>;
    cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>;
};

export function ControlPanel({ visible, colorState, shaderUniformsRef, cameraRef }: ControlPanelProps) {
    const [colGrnd1, setColGrnd1] = useState('#033f35');
    const [colGrnd2, setColGrnd2] = useState('#339eec');
    const [colEdge, setColEdge] = useState('#ff5500');
    const [colPeak, setColPeak] = useState('#ffcc00');
    const [camZ, setCamZ] = useState(44);
    const [turbulence, setTurbulence] = useState(1.0);
    const [height, setHeight] = useState(1.0);

    const userTargetZ = useRef<number | null>(null);

    useEffect(() => {
        colorState.current.targetColorGrnd1.set(colGrnd1);
    }, [colGrnd1, colorState]);

    useEffect(() => {
        colorState.current.targetColorGrnd2.set(colGrnd2);
    }, [colGrnd2, colorState]);

    useEffect(() => {
        colorState.current.targetColorEdge.set(colEdge);
    }, [colEdge, colorState]);

    useEffect(() => {
        colorState.current.targetColorPeak.set(colPeak);
    }, [colPeak, colorState]);

    useEffect(() => {
        if (cameraRef.current && userTargetZ.current !== null) {
            cameraRef.current.position.z = userTargetZ.current;
        }
    }, [camZ, cameraRef]);

    useEffect(() => {
        shaderUniformsRef.current.uTurbulence.value = turbulence;
    }, [turbulence, shaderUniformsRef]);

    useEffect(() => {
        shaderUniformsRef.current.uHeightFactor.value = height;
    }, [height, shaderUniformsRef]);

    const handleCamZChange = (value: number) => {
        setCamZ(value);
        userTargetZ.current = value;
        if (cameraRef.current) {
            cameraRef.current.position.z = value;
        }
    };

    return (
        <div className={`${styles.topLeftControls} ${styles.glassPanel} ${visible ? styles.visible : ''}`}>
            <div className={styles.controlPanel}>
                <h3>Visual Parameters</h3>
                <div className={styles.colorRow}>
                    <span>Ground A</span>
                    <input type="color" value={colGrnd1} onChange={(e) => setColGrnd1(e.target.value)} />
                </div>
                <div className={styles.colorRow}>
                    <span>Ground B</span>
                    <input type="color" value={colGrnd2} onChange={(e) => setColGrnd2(e.target.value)} />
                </div>
                <div className={styles.colorRow}>
                    <span>Edge</span>
                    <input type="color" value={colEdge} onChange={(e) => setColEdge(e.target.value)} />
                </div>
                <div className={styles.colorRow}>
                    <span>Peak</span>
                    <input type="color" value={colPeak} onChange={(e) => setColPeak(e.target.value)} />
                </div>
                <div className={styles.colorRow} style={{ marginTop: '15px' }}>
                    <span>Zoom (Z)</span>
                    <input type="range" min="10" max="100" step="1" value={camZ} onChange={(e) => handleCamZChange(parseFloat(e.target.value))} style={{ flex: 1, minWidth: 0, margin: '0 10px' }} />
                    <span style={{ width: '25px', textAlign: 'right' }}>{camZ}</span>
                </div>
                <div className={styles.colorRow}>
                    <span>Turbulence</span>
                    <input type="range" min="0" max="3" step="0.1" value={turbulence} onChange={(e) => setTurbulence(parseFloat(e.target.value))} style={{ flex: 1, minWidth: 0, margin: '0 10px' }} />
                    <span style={{ width: '25px', textAlign: 'right' }}>{turbulence.toFixed(1)}</span>
                </div>
                <div className={styles.colorRow}>
                    <span>Spore Height</span>
                    <input type="range" min="0.5" max="1.5" step="0.1" value={height} onChange={(e) => setHeight(parseFloat(e.target.value))} style={{ flex: 1, minWidth: 0, margin: '0 10px' }} />
                    <span style={{ width: '25px', textAlign: 'right' }}>{height.toFixed(1)}</span>
                </div>
            </div>
        </div>
    );
}
