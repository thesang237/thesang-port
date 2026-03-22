import type { FC, ReactNode } from 'react';

import LenisScroller from '@/components/animation/lenis';

const ScrollLayout: FC<{ children: ReactNode }> = ({ children }) => {
    return <LenisScroller>{children}</LenisScroller>;
};

export default ScrollLayout;
