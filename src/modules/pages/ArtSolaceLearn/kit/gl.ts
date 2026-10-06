import { type RefObject, useEffect, useRef } from 'react';

import { gsap } from './gsap';

/**
 * A tiny raw-WebGL2 harness for full-screen fragment shaders: one triangle that covers the canvas,
 * one program, a few helpers for uniforms and textures. No three.js: what you read in the demo code
 * is all the GPU is told.
 *
 * Every shader gets these for free (declared in HEADER):
 *   uResolution  canvas size in device pixels
 *   uTime        seconds since the demo started
 *   uPointer     pointer in 0..1 (y down, like the art), -1 when outside
 */
export const HEADER = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uPointer;
out vec4 fragColor;
`;

const VERT = /* glsl */ `#version 300 es
// one big triangle covering the screen (cheaper than two)
const vec2 P[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
void main() { gl_Position = vec4(P[gl_VertexID], 0.0, 1.0); }
`;

export type Fragment = {
    gl: WebGL2RenderingContext;
    canvas: HTMLCanvasElement;
    /** Set a uniform by name: numbers → float, [x,y] → vec2, [x,y,z] → vec3, [x,y,z,w] → vec4. */
    set: (name: string, value: number | readonly number[]) => void;
    setInt: (name: string, value: number) => void;
    /** Bind a texture to a sampler uniform (unit = 0, 1, 2…). */
    texture: (name: string, tex: WebGLTexture, unit: number) => void;
    /** A float texture you can texelFetch() exact values from (R = 1 channel, RGBA = 4). */
    dataTexture: (width: number, height: number, data: Float32Array, channels: 1 | 4) => WebGLTexture;
    /** Upload an image/canvas as a smooth (linearly filtered) texture; reuse `tex` to update it. */
    imageTexture: (source: TexImageSource, tex?: WebGLTexture) => WebGLTexture;
    render: () => void;
};

type Options = {
    /** Cap the pixel ratio (shaders cost per pixel). */
    maxDpr?: number;
    /** Keep the last frame so it can be saved as an image. */
    preserve?: boolean;
};

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(sh) ?? 'compile error';
        gl.deleteShader(sh);
        throw new Error(log);
    }
    return sh;
}

/**
 * Mounts a canvas in `host` running `HEADER + body`. `frame(f, time, dt)` sets uniforms; it runs every
 * tick while the demo is on screen when `animate` is true, otherwise only after `invalidate()`.
 * A compile error is printed inside the stage instead of crashing the guide. Returns `invalidate`.
 */
export function useFragment(
    host: RefObject<HTMLElement | null>,
    body: string,
    frame: (f: Fragment, time: number, dt: number) => void,
    { animate = true, maxDpr = 1.5, preserve = false, setup }: Options & { animate?: boolean; setup?: (f: Fragment) => (() => void) | void } = {},
) {
    const frameRef = useRef(frame);
    const setupRef = useRef(setup);
    const animateRef = useRef(animate);
    useEffect(() => {
        frameRef.current = frame;
        setupRef.current = setup;
        animateRef.current = animate;
    });
    const dirty = useRef(true);
    const invalidate = useRef(() => {
        dirty.current = true;
    }).current;

    useEffect(() => {
        const el = host.current;
        if (!el) return;
        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;';
        el.appendChild(canvas);
        const gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: preserve, premultipliedAlpha: false });
        if (!gl) {
            canvas.remove();
            el.insertAdjacentHTML('beforeend', '<p style="padding:24px;font-size:13px;opacity:.6">WebGL2 is not available in this browser.</p>');
            return;
        }

        let program: WebGLProgram | null = null;
        let errorNote: HTMLElement | null = null;
        try {
            const vs = compile(gl, gl.VERTEX_SHADER, VERT);
            const fs = compile(gl, gl.FRAGMENT_SHADER, HEADER + body);
            program = gl.createProgram()!;
            gl.attachShader(program, vs);
            gl.attachShader(program, fs);
            gl.linkProgram(program);
            gl.deleteShader(vs);
            gl.deleteShader(fs);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? 'link error');
        } catch (e) {
            // the shader didn't compile: show the GPU's message in the stage instead of crashing the guide
            program = null;
            const note = document.createElement('pre');
            note.style.cssText = 'position:absolute;inset:0;margin:0;padding:16px;overflow:auto;font:12px/1.5 ui-monospace,monospace;color:#c2412f;background:#fbf5ef;white-space:pre-wrap;';
            note.textContent = `Shader error:\n${(e as Error).message}`;
            el.appendChild(note);
            errorNote = note;
        }
        gl.useProgram(program);
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        const locations = new Map<string, WebGLUniformLocation | null>();
        const loc = (name: string) => {
            if (!locations.has(name)) locations.set(name, program ? gl.getUniformLocation(program, name) : null);
            return locations.get(name)!;
        };
        const textures: WebGLTexture[] = [];
        const f: Fragment = {
            gl,
            canvas,
            set(name, v) {
                const l = loc(name);
                if (!l) return;
                if (typeof v === 'number') gl.uniform1f(l, v);
                else if (v.length === 2) gl.uniform2f(l, v[0], v[1]);
                else if (v.length === 3) gl.uniform3f(l, v[0], v[1], v[2]);
                else gl.uniform4f(l, v[0], v[1], v[2], v[3]);
            },
            setInt(name, v) {
                const l = loc(name);
                if (l) gl.uniform1i(l, v);
            },
            texture(name, tex, unit) {
                gl.activeTexture(gl.TEXTURE0 + unit);
                gl.bindTexture(gl.TEXTURE_2D, tex);
                const l = loc(name);
                if (l) gl.uniform1i(l, unit);
            },
            dataTexture(width, height, data, channels) {
                const tex = gl.createTexture()!;
                textures.push(tex);
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
                // float textures can't be filtered on every GPU: NEAREST + texelFetch reads exact values
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                if (channels === 1) gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, width, height, 0, gl.RED, gl.FLOAT, data);
                else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, data);
                return tex;
            },
            imageTexture(source, existing) {
                const tex = existing ?? gl.createTexture()!;
                if (!existing) textures.push(tex);
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
                return tex;
            },
            render() {
                gl.viewport(0, 0, canvas.width, canvas.height);
                gl.drawArrays(gl.TRIANGLES, 0, 3);
            },
        };
        const cleanupSetup = program ? setupRef.current?.(f) : undefined;

        const pointer = [-1, -1];
        const onMove = (e: PointerEvent) => {
            const r = canvas.getBoundingClientRect();
            pointer[0] = (e.clientX - r.left) / r.width;
            pointer[1] = (e.clientY - r.top) / r.height;
            dirty.current = true;
        };
        const onLeave = () => {
            pointer[0] = pointer[1] = -1;
            dirty.current = true;
        };
        el.addEventListener('pointermove', onMove);
        el.addEventListener('pointerleave', onLeave);

        const resize = () => {
            const r = el.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
            canvas.width = Math.max(1, Math.round(r.width * dpr));
            canvas.height = Math.max(1, Math.round(r.height * dpr));
            dirty.current = true;
        };
        const ro = new ResizeObserver(resize);
        ro.observe(el);
        resize();

        let visible = false;
        const io = new IntersectionObserver(
            ([e]) => {
                visible = e.isIntersecting;
                if (visible) dirty.current = true;
            },
            { rootMargin: '120px' },
        );
        io.observe(el);

        let elapsed = 0;
        const tick = (_t: number, deltaMs: number) => {
            if (!visible || !program) return; // (hidden tabs get no frames at all: the ticker runs on requestAnimationFrame)
            const dt = Math.min(deltaMs / 1000, 1 / 20);
            if (animateRef.current) elapsed += dt;
            else if (!dirty.current) return;
            dirty.current = false;
            gl.useProgram(program);
            f.set('uResolution', [canvas.width, canvas.height]);
            f.set('uTime', elapsed);
            f.set('uPointer', pointer);
            frameRef.current(f, elapsed, dt);
            f.render();
        };
        gsap.ticker.add(tick);

        return () => {
            gsap.ticker.remove(tick);
            io.disconnect();
            ro.disconnect();
            el.removeEventListener('pointermove', onMove);
            el.removeEventListener('pointerleave', onLeave);
            cleanupSetup?.();
            textures.forEach((t) => gl.deleteTexture(t));
            gl.deleteVertexArray(vao);
            if (program) gl.deleteProgram(program);
            // free the context now (browsers keep only ~16 alive)
            gl.getExtension('WEBGL_lose_context')?.loseContext();
            canvas.remove();
            errorNote?.remove();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [host, body]);

    return { invalidate };
}

/** '#RRGGBB' → [r, g, b] in 0..1 (sRGB, used as-is: the canvas shows exactly the CSS colour). */
export function rgb(hex: string): [number, number, number] {
    const s = hex.replace('#', '');
    return [parseInt(s.slice(0, 2), 16) / 255, parseInt(s.slice(2, 4), 16) / 255, parseInt(s.slice(4, 6), 16) / 255];
}
