'use client';

import { useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';

import { CONFIG } from './gridConfig';
import { calculateGridDimensions, EMPTY_COLORS, matchesFilter } from './gridState';
import type { ShoeData } from './ShoeTile';
import { ShoeTile } from './ShoeTile';

type GridCanvasProps = {
    items: ShoeData[];
    gridVisible: boolean;
    transitionStartTime: number;
    interactive: boolean;
    filter?: string;
    colorFilter?: string[];
};

export function GridCanvas({ items, gridVisible, transitionStartTime, interactive, filter = 'all', colorFilter = EMPTY_COLORS }: GridCanvasProps) {
    const { mappedItems, filteredGridDims } = useMemo(() => {
        const spacing = CONFIG.itemSize + CONFIG.gap;
        const filteredItems = items.filter((item) => matchesFilter(item, filter, colorFilter));
        const filteredCount = filteredItems.length;
        const filteredDims = calculateGridDimensions(filteredCount);
        const maxDelay = gridVisible ? CONFIG.enterStaggerDelay : CONFIG.exitStaggerDelay;
        let filteredIdx = 0;

        const mapped = items.map((shoe, i) => {
            const matches = matchesFilter(shoe, filter, colorFilter);
            let targetPos: { x: number; y: number };

            if (matches) {
                const col = filteredIdx % CONFIG.gridCols;
                const row = Math.floor(filteredIdx / CONFIG.gridCols);
                targetPos = {
                    x: col * spacing - filteredDims.width / 2 + spacing / 2,
                    y: -(row * spacing) + filteredDims.height / 2 - spacing / 2,
                };
                filteredIdx++;
            } else {
                const col = i % CONFIG.gridCols;
                const row = Math.floor(i / CONFIG.gridCols);
                const originalDims = calculateGridDimensions(items.length);
                targetPos = {
                    x: col * spacing - originalDims.width / 2 + spacing / 2,
                    y: -(row * spacing) + originalDims.height / 2 - spacing / 2,
                };
            }

            return { ...shoe, index: i, randomDelay: Math.random() * maxDelay, basePos: targetPos, matchesFilter: matches };
        });

        return { mappedItems: mapped, filteredGridDims: filteredDims };
    }, [items, filter, colorFilter, gridVisible]);

    const [mountedCount, setMountedCount] = useState(gridVisible ? 0 : items.length);

    useFrame(() => {
        if (mountedCount < mappedItems.length) {
            setMountedCount((prev) => Math.min(prev + 5, mappedItems.length));
        }
    });

    return (
        <>
            {mappedItems.map((item, i) => {
                if (i > mountedCount) return null;
                return (
                    <ShoeTile
                        key={item.product_url || String(item.index)}
                        data={item}
                        index={item.index}
                        basePos={item.basePos}
                        gridVisible={gridVisible}
                        transitionStartTime={transitionStartTime}
                        interactive={interactive && item.matchesFilter}
                        matchesFilter={item.matchesFilter}
                        gridHeight={filteredGridDims.height}
                    />
                );
            })}
        </>
    );
}
