import type { Ref } from 'react';
import type { ThreeElement } from '@react-three/fiber';
import type * as THREE from 'three';

import type { BentPlaneGeometry, MeshSineMaterial } from '@/modules/pages/R3fCards/utils';
import type { HoloCardMaterialType } from '@/modules/pages/ShoeFinder/HoloCardMaterial';
import type { TopographyMaterialType } from '@/modules/pages/ShoeFinder/TopologyBackground';

declare module '@react-three/fiber' {
    interface ThreeElements {
        // R3fCards
        bentPlaneGeometry: ThreeElement<typeof BentPlaneGeometry>;
        meshSineMaterial: ThreeElement<typeof MeshSineMaterial>;
        // ShoeFinder
        holoCardMaterial: {
            ref?: Ref<HoloCardMaterialType>;
            uTime?: number;
            uTexture?: THREE.Texture;
            uOpacity?: number;
            uActive?: number;
            transparent?: boolean;
            depthWrite?: boolean;
        };
        topographyMaterial: {
            ref?: Ref<TopographyMaterialType>;
            transparent?: boolean;
            depthWrite?: boolean;
        };
    }
}
