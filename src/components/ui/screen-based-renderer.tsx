'use client';

import type { FC, ReactElement } from 'react';

import useWindowScreen from '@/hooks/useWindowScreen';

type Props = {
    laptop?: ReactElement;
    tablet?: ReactElement;
    mobile?: ReactElement;
};

const ScreenBasedRenderer: FC<Props> = ({ laptop, tablet, mobile }) => {
    const { isMobile, isTablet } = useWindowScreen();

    if (isMobile) {
        return mobile;
    }

    if (isTablet) {
        return tablet;
    }

    return laptop;
};

export default ScreenBasedRenderer;
