'use client';

import type { FC, ReactNode } from 'react';
import { createContext, use, useEffect, useRef } from 'react';

import { createLogger } from '@/utils/logger';

type Data = {
    subscribe: (key: string, handler: WindowSizeEventHandler) => void;
    unsubscribe: (key: string) => void;
};

const Context = createContext<Data | undefined>(undefined);

type Props = {
    children: ReactNode;
};

const logger = createLogger('WindowSizeProvider');

export const WindowSizeProvider: FC<Props> = ({ children }) => {
    const subscribers = useRef<Record<string, WindowSizeEventHandler>>({});
    const debounce = useRef<NodeJS.Timeout | null>(null);

    const subscribe = (key: string, handler: WindowSizeEventHandler) => {
        if (!subscribers.current[key]) {
            subscribers.current[key] = handler;
        } else {
            logger.info(`Handler already registered for key: ${key}`);
        }
    };

    const unsubscribe = (key: string) => {
        delete subscribers.current[key];
    };

    useEffect(() => {
        const listener = () => {
            if (debounce.current) {
                clearTimeout(debounce.current);
            }

            debounce.current = setTimeout(() => {
                logger.info('window.addEventListener resize', {
                    width: window.innerWidth,
                    height: window.innerHeight,
                });

                Object.values(subscribers.current).forEach((handler) => {
                    handler.onChange?.({
                        width: window.innerWidth,
                        height: window.innerHeight,
                    });
                });
            }, 200);
        };

        window.addEventListener('resize', listener);

        return () => {
            if (debounce.current) {
                clearTimeout(debounce.current);
            }

            subscribers.current = {};
            window.removeEventListener('resize', listener);
        };
    }, []);

    const value: Data = {
        subscribe,
        unsubscribe,
    };

    return <Context value={value}>{children}</Context>;
};

export const useWindowSize = (): Data => {
    const context = use(Context);

    if (context === undefined) {
        throw new Error('useWindowSize must be used within a WindowSizeProvider');
    }

    return context;
};

export const useSubscribeWindowSize = (key: string, handler: WindowSizeEventHandler) => {
    const { subscribe, unsubscribe } = useWindowSize();

    useEffect(() => {
        subscribe(key, handler);

        return () => unsubscribe(key);
    }, [subscribe, unsubscribe, key, handler]);
};
