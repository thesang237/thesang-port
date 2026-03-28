'use client';

import { useEffect, useRef, useState } from 'react';

import type { GridConfig } from './gridConfig';
import type { RigState } from './gridState';

type GridDims = {
    width: number;
    height: number;
};

type MiniMapProps = {
    gridDims: GridDims;
    rigState: RigState;
    config: GridConfig;
    totalItems: number;
    isZoomedIn: boolean;
};

export default function MiniMap({ gridDims, rigState, config, totalItems, isZoomedIn }: MiniMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const zoomRef = useRef(1);
    const centerRef = useRef({ x: 0.5, y: 0.5 });
    const opacityRef = useRef(0);
    const [mapWidthPercent, setMapWidthPercent] = useState(8);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    const aspectRatio = gridDims.width / gridDims.height;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

    useEffect(() => {
        const update = () => {
            let pct = 8;
            if (window.innerWidth < 480) pct = 20;
            else if (window.innerWidth < 768) pct = 15;
            setMapWidthPercent(pct);
            const w = (window.innerWidth * pct) / 100;
            setDimensions({ width: w, height: w / aspectRatio });
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, [aspectRatio]);

    const cols = config.gridCols;
    const rows = Math.ceil(totalItems / cols);

    useEffect(() => {
        let rafId: number;
        const draw = () => {
            if (!containerRef.current || !canvasRef.current) {
                rafId = requestAnimationFrame(draw);
                return;
            }

            const isMobile = window.innerWidth < 768;
            const isActive = rigState.isDragging || rigState.activeId !== null;
            const shouldShow = isMobile ? isActive && isZoomedIn : isActive;
            const targetOp = shouldShow ? 1 : 0;
            opacityRef.current += (targetOp - opacityRef.current) * 0.1;
            containerRef.current.style.opacity = String(opacityRef.current);

            if (opacityRef.current < 0.02) {
                rafId = requestAnimationFrame(draw);
                return;
            }

            const isFocused = rigState.activeId !== null;
            const targetZoom = isFocused ? 2.5 : 1;
            let targetCX = 0.5,
                targetCY = 0.5;
            if (isFocused && rigState.activeId !== null) {
                const col = rigState.activeId % cols;
                const row = Math.floor(rigState.activeId / cols);
                targetCX = (col + 0.5) / cols;
                targetCY = (row + 0.5) / rows;
            }

            zoomRef.current += (targetZoom - zoomRef.current) * 0.08;
            centerRef.current.x += (targetCX - centerRef.current.x) * 0.08;
            centerRef.current.y += (targetCY - centerRef.current.y) * 0.08;

            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                rafId = requestAnimationFrame(draw);
                return;
            }
            const w = canvas.width,
                h = canvas.height;
            ctx.clearRect(0, 0, w, h);

            ctx.save();
            const zoom = zoomRef.current;
            const cx = centerRef.current.x * w;
            const cy = centerRef.current.y * h;
            ctx.translate(w / 2, h / 2);
            ctx.scale(zoom, zoom);
            ctx.translate(-cx, -cy);

            const baseDotSize = Math.max(w, h) * 0.015;
            for (let i = 0; i < totalItems; i++) {
                const c = i % cols,
                    r = Math.floor(i / cols);
                const nX = (c + 0.5) / cols,
                    nY = (r + 0.5) / rows;
                const isSelected = rigState.activeId === i;
                const dotSize = isSelected ? baseDotSize * 2 : baseDotSize;
                ctx.beginPath();
                ctx.arc(nX * w, nY * h, dotSize, 0, Math.PI * 2);
                ctx.fillStyle = isSelected ? '#FFB000' : 'rgba(255,255,255,0.4)';
                ctx.fill();
            }

            if (!isFocused) {
                const offPctX = -rigState.current.x / gridDims.width;
                const offPctY = rigState.current.y / gridDims.height;
                const vFov = (45 * Math.PI) / 180;
                const viewHeight = 2 * Math.tan(vFov / 2) * 10;
                const viewWidth = viewHeight * (window.innerWidth / window.innerHeight);
                const rectW = Math.min(viewWidth / gridDims.width, 1) * w;
                const rectH = Math.min(viewHeight / gridDims.height, 1) * h;
                const rectX = (0.5 + offPctX) * w - rectW / 2;
                const rectY = (0.5 + offPctY) * h - rectH / 2;
                ctx.strokeStyle = 'rgba(255,255,255,0.8)';
                ctx.lineWidth = 1.5 / zoom;
                ctx.strokeRect(rectX, rectY, rectW, rectH);
            }
            ctx.restore();
            rafId = requestAnimationFrame(draw);
        };
        rafId = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(rafId);
    }, [gridDims, cols, rows, rigState, config, totalItems, isZoomedIn]);

    return (
        <div
            ref={containerRef}
            style={{
                position: 'fixed',
                bottom: '2vh',
                right: '2vw',
                width: `${mapWidthPercent}vw`,
                aspectRatio: String(aspectRatio),
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(10px)',
                opacity: 0,
                border: '1px solid rgba(255,255,255,0.2)',
                overflow: 'hidden',
                pointerEvents: 'none',
                zIndex: 100,
            }}
        >
            <canvas ref={canvasRef} width={dimensions.width * dpr} height={dimensions.height * dpr} style={{ width: '100%', height: '100%' }} />
        </div>
    );
}
