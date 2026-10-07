import { createScene } from './scene.js';

export type RenderRequest = { type: 'init'; hash: string; width: number; height: number; animate: boolean } | { type: 'visibility'; visible: boolean } | { type: 'motion'; animate: boolean };
export type RenderReply = { type: 'frame'; bitmap: ImageBitmap; progress: number; buildMs: number; frameMs: number } | { type: 'error'; message: string };

const port = self as unknown as {
    onmessage: (event: MessageEvent<RenderRequest>) => void;
    postMessage: (reply: RenderReply, transfer?: Transferable[]) => void;
};
let scene: ReturnType<typeof createScene> | null = null;
let output: OffscreenCanvas | null = null;
let visible = true;
let animate = true;
let complete = false;
let buildMs = 0;
let timer: ReturnType<typeof setTimeout> | undefined;

function tick() {
    timer = undefined;
    if (!scene || !output || !visible || (complete && !animate)) return;
    try {
        const start = performance.now();
        const progress = scene.frame(animate);
        complete = progress === 1;
        const bitmap = output.transferToImageBitmap();
        port.postMessage({ type: 'frame', bitmap, progress, buildMs, frameMs: performance.now() - start }, [bitmap]);
        // The original living layer advances in fixed 80ms steps. Retain its pace.
        if (!complete || animate) timer = setTimeout(tick, 80);
    } catch (error) {
        port.postMessage({ type: 'error', message: error instanceof Error ? error.message : 'The artwork could not render.' });
    }
}

port.onmessage = ({ data }) => {
    if (data.type === 'init') {
        try {
            if (typeof OffscreenCanvas === 'undefined') throw new Error('This browser needs OffscreenCanvas support to render Cantera.');
            const start = performance.now();
            animate = data.animate;
            const paint = new OffscreenCanvas(data.width, data.height);
            output = new OffscreenCanvas(data.width, data.height);
            scene = createScene(data.hash, paint, output);
            buildMs = performance.now() - start;
            tick();
        } catch (error) {
            port.postMessage({ type: 'error', message: error instanceof Error ? error.message : 'The artwork could not initialize.' });
        }
        return;
    }
    if (data.type === 'visibility') visible = data.visible;
    if (data.type === 'motion') animate = data.animate;
    if (timer) clearTimeout(timer);
    timer = undefined;
    tick();
};
