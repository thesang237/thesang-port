'use client';

import type { FC, ReactNode } from 'react';

import { ClientVars } from '@/constants/client-only';

type Props = {
    dev?: ReactNode;
    prod?: ReactNode;
};

const EnvBasedRenderer: FC<Props> = ({ dev, prod }) => {
    const isProduction = ClientVars.ENVIRONMENT === 'production';

    return isProduction ? prod : dev;
};

export default EnvBasedRenderer;
