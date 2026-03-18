import type { FC, ReactNode } from 'react';

import LenisScroller from '@/components/animation/lenis';
import type { PagePropsBase } from '@/types/page';

type Props = PagePropsBase & {
    children: ReactNode;
};

const Layout: FC<Props> = ({ children }) => {
    return <LenisScroller>{children}</LenisScroller>;
};

export default Layout;
