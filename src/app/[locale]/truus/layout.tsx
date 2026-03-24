import './truus.css';

import type { FC, ReactNode } from 'react';

import LenisScroller from '@/components/animation/lenis';

const TruusLayout: FC<{ children: ReactNode }> = ({ children }) => {
    return <LenisScroller>{children}</LenisScroller>;
};

export default TruusLayout;
