'use client';

import type { FC, ReactNode } from 'react';
import { useEffect } from 'react';

import { ClientVars } from '@/constants/client-only';
import { isClient } from '@/utils/client-only';

type Props = {
    children: ReactNode;
};

export const BootstrapProvider: FC<Props> = ({ children }) => {
    useEffect(() => {
        if (isClient) {
            if (ClientVars.ENVIRONMENT === 'production') {
                window.addEventListener('beforeinstallprompt', (event) => {
                    event.preventDefault();
                });

                (window as any).workbox?.register();
            }
        }
    }, []);
    return children;
};
