'use client';

import type { FC, ReactNode } from 'react';
import { createContext, use, useEffect, useRef } from 'react';

import { createLogger } from '@/utils/logger';

type Data = {
    subscribe: (key: string, handler: CursorEventHandler) => void;
    unsubscribe: (key: string) => void;
};

const Context = createContext<Data | undefined>(undefined);

type Props = {
    children: ReactNode;
};

const logger = createLogger('CursorProvider');

export const CursorProvider: FC<Props> = ({ children }) => {
    const subscribers = useRef<Record<string, CursorEventHandler>>({});

    useEffect(() => {
        const listener = (event: MouseEvent) => {
            Object.values(subscribers.current).forEach((handler) => {
                handler.onMove?.({ x: event.clientX, y: event.clientY });
            });
        };

        window.addEventListener('mousemove', listener);

        return () => {
            subscribers.current = {};
            window.removeEventListener('mousemove', listener);
        };
    }, []);

    const subscribe = (key: string, handler: CursorEventHandler) => {
        if (!subscribers.current[key]) {
            subscribers.current[key] = handler;
        } else {
            logger.info(`Handler already registered for key: ${key}`);
        }
    };

    const unsubscribe = (key: string) => {
        delete subscribers.current[key];
    };

    const value: Data = {
        subscribe,
        unsubscribe,
    };

    return <Context value={value}>{children}</Context>;
};

export const useCursor = (): Data => {
    const context = use(Context);

    if (context === undefined) {
        throw new Error('useCursor must be used within a CursorProvider');
    }

    return context;
};

export const useSubscribeCursor = (key: string, handler: CursorEventHandler) => {
    const { subscribe, unsubscribe } = useCursor();

    useEffect(() => {
        subscribe(key, handler);

        return () => unsubscribe(key);
    }, [subscribe, unsubscribe, key, handler]);
};
