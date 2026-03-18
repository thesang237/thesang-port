'use client';

import type { FC, ReactNode } from 'react';
import { createContext, use, useEffect, useLayoutEffect, useRef } from 'react';

import { createLogger } from '@/utils/logger';

type Data = {
    loadAsset: () => void;
    completeAsset: () => void;

    subscribe: (key: string, handler: AssetEventHandler) => void;
    unsubscribe: (key: string) => void;
};

const Context = createContext<Data | undefined>(undefined);

type Props = {
    children: ReactNode;
};

const logger = createLogger('AssetProvider');

export const AssetProvider: FC<Props> = ({ children }) => {
    const subscribers = useRef<Record<string, AssetEventHandler>>({});
    const totalAssets = useRef(0);
    const loadedAssets = useRef(0);

    const loadAsset = () => {
        totalAssets.current++;
    };

    const completeAsset = () => {
        loadedAssets.current++;

        Object.values(subscribers.current).forEach((handler) => {
            logger.info(`${loadedAssets.current} of ${totalAssets.current} assets loaded`);
            handler.onProgress?.(loadedAssets.current / totalAssets.current);
        });

        const progress = loadedAssets.current / totalAssets.current;

        if (progress >= 1) {
            logger.info('All assets loaded');

            Object.values(subscribers.current).forEach((handler) => {
                handler.onComplete?.();
            });
        }
    };

    const subscribe = (key: string, handler: AssetEventHandler) => {
        if (!subscribers.current[key]) {
            subscribers.current[key] = handler;
        } else {
            logger.info(`Handler already registered for key: ${key}`);
        }
    };
    const unsubscribe = (key: string) => {
        delete subscribers.current[key];
    };

    useLayoutEffect(() => {
        logger.info('Loading assets');
        Object.values(subscribers.current).forEach((handler) => {
            handler.onStart?.();
        });

        return () => {
            subscribers.current = {};
            totalAssets.current = 0;
            loadedAssets.current = 0;
        };
    }, []);

    const value: Data = {
        loadAsset,
        completeAsset,

        subscribe,
        unsubscribe,
    };

    return <Context value={value}>{children}</Context>;
};

export const useAsset = (): Data => {
    const context = use(Context);

    if (context === undefined) {
        throw new Error('useAsset must be used within a AssetProvider');
    }

    return context;
};

export const useSubscribeAsset = (key: string, handler: AssetEventHandler) => {
    const { subscribe, unsubscribe } = useAsset();

    useEffect(() => {
        subscribe(key, handler);

        return () => {
            unsubscribe(key);
        };
    }, [subscribe, unsubscribe, key, handler]);
};
