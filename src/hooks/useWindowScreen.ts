'use client';

import { useMemo } from 'react';

import { Breakpoints } from '@/constants/breakpoints';
import useMediaQuery from '@/hooks/useMediaQuery';

const useWindowScreen = () => {
    const isTablet = useMediaQuery(`(min-width: ${Breakpoints.MIN_TABLET}px) and (max-width: ${Breakpoints.MIN_LAPTOP - 1}px)`, false);
    const isLaptop = useMediaQuery(`(min-width: ${Breakpoints.MIN_LAPTOP}px)`, false);

    const isMobile = useMemo(() => !isTablet && !isLaptop, [isTablet, isLaptop]);

    return {
        isTablet,
        isLaptop,
        isMobile,
    };
};

export default useWindowScreen;
