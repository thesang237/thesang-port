import type { QueryObserverResult, RefetchOptions, useMutation } from '@tanstack/react-query';

import type { ResponseBase } from '@/services/http-client';

// Base hook return type for data fetching
export type DataHookReturn<TResponse = unknown, TFilter = unknown> = {
    response?: TResponse;
    isLoading: boolean;
    refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<TResponse, Error>>;
    filter?: (data: TFilter) => void;
    search?: (searchValue: string) => void;
    navigate?: (page: number) => void;
    clearSort?: () => void;
};

// Hook props types
export type QueryHookProps<TInitialFilter = unknown> = {
    initialFilter?: TInitialFilter;
    enabled?: boolean;
};

export type MutationHookReturn<TResponse, TPayload> = ReturnType<typeof useMutation<ResponseBase<TResponse>, Error, TPayload>>;
