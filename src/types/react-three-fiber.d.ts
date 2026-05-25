/* eslint-disable @typescript-eslint/consistent-type-definitions */
import type { Ref } from 'react';
import type { ThreeElement } from '@react-three/fiber';
import type * as THREE from 'three';

import type { BentPlaneGeometry, MeshSineMaterial } from '@/modules/pages/R3fCards/utils';
import type { HoloCardMaterialType } from '@/modules/pages/ShoeFinder/HoloCardMaterial';
import type { TopographyMaterialType } from '@/modules/pages/ShoeFinder/TopologyBackground';

declare module '@react-three/fiber' {
    type ThreeElements = {
        // From R3fCards/utils.ts
        bentPlaneGeometry: ThreeElement<typeof BentPlaneGeometry>;
        meshSineMaterial: ThreeElement<typeof MeshSineMaterial>;

        // From ShoeFinder/HoloCardMaterial.ts
        holoCardMaterial: {
            ref?: Ref<HoloCardMaterialType>;
            uTime?: number;
            uTexture?: THREE.Texture;
            uOpacity?: number;
            uActive?: number;
            transparent?: boolean;
            depthWrite?: boolean;
        };

        // From ShoeFinder/TopologyBackground.tsx
        topographyMaterial: {
            ref?: Ref<TopographyMaterialType>;
            transparent?: boolean;
            depthWrite?: boolean;
        };
    };
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            bentPlaneGeometry: any;
            meshSineMaterial: any;
            holoCardMaterial: any;
            topographyMaterial: any;
        }
    }
}

declare module 'react' {
    namespace JSX {
        interface IntrinsicElements {
            bentPlaneGeometry: any;
            meshSineMaterial: any;
            holoCardMaterial: any;
            topographyMaterial: any;
        }
    }
}
