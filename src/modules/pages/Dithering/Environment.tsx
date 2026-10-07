'use client';
import { Environment, Lightformer } from '@react-three/drei';
/** Photographic softboxes baked into a small reflection map.
 * Declarative GPU resources are owned/disposed by R3F.
 */
export function EnvironmentWrapper({ intensity, highlight }: { intensity: number; highlight: string }) {
    return (
        <Environment resolution={256} frames={1} environmentIntensity={intensity}>
            <Lightformer form="rect" position={[-4, 3, 2]} rotation={[0, Math.PI / 3, 0]} scale={[4, 6, 1]} intensity={5} />
            <Lightformer form="rect" position={[4, 1, 1]} rotation={[0, -Math.PI / 3, 0]} scale={[2, 4, 1]} intensity={3} />
            <Lightformer form="ring" position={[0, 3, -3]} scale={5} color={highlight} intensity={8} />
        </Environment>
    );
}
