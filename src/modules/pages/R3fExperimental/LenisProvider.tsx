'use client';

import type { FC, PropsWithChildren } from 'react';
import { ReactLenis } from 'lenis/react';

const R3fExperimentalLenis: FC<PropsWithChildren> = ({ children }) => {
    return (
        <ReactLenis root options={{ infinite: true, syncTouch: true }}>
            {children}
        </ReactLenis>
    );
};

export default R3fExperimentalLenis;
