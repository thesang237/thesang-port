'use client';

import type { FC, ReactNode } from 'react';
import { createContext, use, useEffect, useRef } from 'react';

import { usePathname } from '@/i18n/navigation';
import { useSubscribeAsset } from '@/providers/asset';
import type { PageInfo } from '@/stores/page';
import usePageStore, { PageState, useSubscribePageStore } from '@/stores/page';
import { createLogger } from '@/utils/logger';

type Data = {
    subscribe: (key: string, handler: PageEventHandler) => void;
    unsubscribe: (key: string) => void;
    navigate: (pageInfo: PageInfo) => void;
};

type Props = {
    children: ReactNode;
};

const Context = createContext<Data | undefined>(undefined);

const logger = createLogger('PageProvider');

export const PageProvider: FC<Props> = ({ children }) => {
    const pathname = usePathname();

    const subscribers = useRef<Record<string, PageEventHandler>>({});

    const subscribe = (subscriptionKey: string, handler: PageEventHandler) => {
        if (!subscribers.current[subscriptionKey]) {
            subscribers.current[subscriptionKey] = handler;
        } else {
            logger.info(`Handler already registered for key: ${subscriptionKey}`);
        }
    };

    const unsubscribe = (subscriptionKey: string) => {
        delete subscribers.current[subscriptionKey];
    };

    const navigate = (targetPageInfo: PageInfo) => {
        usePageStore.getState().actions.setState({
            pageInfo: targetPageInfo,
            pageState: PageState.EXITING,
        });
    };

    useEffect(() => {
        const pageStore = usePageStore.getState();
        const isSamePage = pathname === pageStore.pageInfo.pathname;
        const isNotFirstLoad = !pageStore.isFirstLoad;

        if (isSamePage && isNotFirstLoad) {
            pageStore.actions.setState({
                pageState: PageState.EXITED,
            });
        }
    }, [pathname]);

    useSubscribePageStore((newState) => {
        logger.info('Page state changed:', { pageState: newState.pageState });

        Object.values(subscribers.current).forEach((handler) => {
            handler.onChange?.(newState.pageState, newState.pageInfo);
        });

        if (newState.pageState === PageState.READY) {
            usePageStore.getState().actions.setState({
                pageState: PageState.ENTERING,
            });
        }
    });

    useSubscribeAsset('page-provider', {
        onComplete: () => {
            usePageStore.getState().actions.setState({
                isFirstLoad: false,
                pageState: PageState.READY,
                pageInfo: { pathname: window.location.pathname },
            });
        },
    });

    const value: Data = {
        subscribe,
        unsubscribe,
        navigate,
    };

    return <Context value={value}>{children}</Context>;
};

export const usePage = (): Data => {
    const context = use(Context);

    if (context === undefined) {
        throw new Error('usePageState must be used within a PageStateProvider');
    }

    return context;
};

export const useSubscribePage = (key: string, handler: PageEventHandler) => {
    const { subscribe, unsubscribe } = usePage();

    useEffect(() => {
        subscribe(key, handler);

        return () => unsubscribe(key);
    }, [subscribe, unsubscribe, key, handler]);
};
