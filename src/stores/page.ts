import { useEffect } from 'react';
import { create } from 'zustand';

import { Router } from '@/constants/router';

export enum PageState {
    LOADING = 'loading',
    READY = 'ready',
    ENTERING = 'entering',
    ENTERED = 'entered',
    EXITING = 'exiting',
    EXITED = 'exited',
    ERROR = 'error',
}

export type PageInfo = {
    pathname: string;
};

type State = {
    isFirstLoad: boolean;
    pageState: PageState;
    pageInfo: PageInfo;
};

type Actions = {
    actions: {
        setState: (state: Partial<State>) => void;
        reset: () => void;
    };
};

const initialState: State = {
    isFirstLoad: true,
    pageState: PageState.LOADING,
    pageInfo: {
        pathname: Router.LANDING,
    },
};

const usePageStore = create<State & Actions>((set) => ({
    ...initialState,

    actions: {
        setState: (newState: Partial<State>) => set((oldState) => ({ ...oldState, ...newState })),
        reset: () => set(initialState),
    },
}));

export const useSubscribePageStore = (handler: (newState: State) => void) => {
    useEffect(() => {
        const unsubscribe = usePageStore.subscribe(handler);

        return () => unsubscribe();
    }, [handler]);
};

export default usePageStore;
