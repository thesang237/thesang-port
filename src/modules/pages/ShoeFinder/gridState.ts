import * as THREE from 'three';

import { CONFIG } from './gridConfig';

export type RigState = {
    target: THREE.Vector3;
    current: THREE.Vector3;
    velocity: THREE.Vector3;
    zoom: number;
    isDragging: boolean;
    activeId: number | null;
};

export const rigState: RigState = {
    target: new THREE.Vector3(0, 2, 0),
    current: new THREE.Vector3(0, 2, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    zoom: CONFIG.zoomOut,
    isDragging: false,
    activeId: null,
};

export const calculateGridDimensions = (count: number) => {
    const rows = Math.ceil(count / CONFIG.gridCols);
    const spacing = CONFIG.itemSize + CONFIG.gap;
    return {
        width: CONFIG.gridCols * spacing,
        height: rows * spacing,
    };
};

export const EMPTY_COLORS: string[] = [];

export const matchesFilter = (item: { title: string; primary_color?: string }, filter: string, colorFilter: string[] = EMPTY_COLORS): boolean => {
    let matchesType = true;
    if (filter !== 'all') {
        const title = item.title.toLowerCase();
        if (filter === 'jordan') matchesType = title.includes('jordan');
        else if (filter === 'dunk') matchesType = title.includes('dunk');
    }

    let matchesColor = true;
    if (colorFilter.length > 0) {
        const shoeColor = item.primary_color || '';
        matchesColor = colorFilter.some((c) => {
            if (c === 'gray') return shoeColor.includes('gray');
            return shoeColor === c;
        });
    }

    return matchesType && matchesColor;
};
