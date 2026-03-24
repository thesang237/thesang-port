import type { FC, ReactNode } from 'react';

import LenisScroller from '@/components/animation/lenis';

const StickyScrollLayout: FC<{ children: ReactNode }> = ({ children }) => {
    return <LenisScroller>{children}</LenisScroller>;
};

export default StickyScrollLayout;
