import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import ExampleApi from '@/api/example';
import type { CreateExampleResponse, GetExampleResponse } from '@/api/example/types';
import type { PaginationQuery } from '@/dtos/base';
import { QUERY_KEYS } from '@/hooks/data/constants';
import type { ResponseBase } from '@/services/http-client';
import type { DataHookReturn, MutationHookReturn, QueryHookProps } from '@/types/data-hook';

type Props = QueryHookProps<PaginationQuery>;

type CreateExampleMutation = MutationHookReturn<CreateExampleResponse, undefined>;

type Return = DataHookReturn<ResponseBase<GetExampleResponse>, PaginationQuery> & {
    createExample: CreateExampleMutation;
};

const useExample = ({ enabled = true, initialFilter }: Props = {}): Return => {
    const queryClient = useQueryClient();

    const [filterData, setFilterData] = useState<PaginationQuery>({
        limit: initialFilter?.limit ?? 10,
        page: initialFilter?.page ?? 1,
        search: initialFilter?.search ?? '',
        filters: initialFilter?.filters ?? [],
    });

    const { data, isLoading, refetch } = useQuery<ResponseBase<GetExampleResponse>>({
        queryKey: [QUERY_KEYS.EXAMPLE, JSON.stringify(filterData)],
        queryFn: async () => {
            const response = await ExampleApi.getExample({ query: filterData });
            return response;
        },
        enabled,
    });

    const filter = (data: Partial<PaginationQuery>) => {
        setFilterData((prev) => ({
            ...prev,
            ...data,
            page: 1,
        }));
    };

    const search = (searchValue: string) => {
        setFilterData((prev) => ({
            ...prev,
            search: searchValue,
            page: 1,
        }));
    };

    const navigate = (page: number) => {
        setFilterData((prev) => ({
            ...prev,
            page,
        }));
    };

    const createExample: CreateExampleMutation = useMutation({
        mutationFn: async (): Promise<ResponseBase<CreateExampleResponse>> => {
            const response = await ExampleApi.createExample();

            await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EXAMPLE] });

            return response;
        },
    });

    return {
        response: data,
        isLoading,
        refetch,
        filter,
        search,
        navigate,
        createExample,
    };
};

export default useExample;
