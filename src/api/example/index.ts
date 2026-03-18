import type { CreateExampleResponse, GetExampleResponse } from '@/api/example/types';
import type { PaginationQuery } from '@/dtos/base';
import type { ResponseBase } from '@/services/http-client';
import httpClient from '@/services/http-client';

class ExampleApi {
    private static readonly PREFIX = '/example';

    static async getExample(payload: { query: PaginationQuery }): Promise<ResponseBase<GetExampleResponse>> {
        const response = await httpClient.get<GetExampleResponse>(this.PREFIX, {
            params: payload.query,
        });
        return response;
    }

    static async createExample(): Promise<ResponseBase<CreateExampleResponse>> {
        const response = await httpClient.post<CreateExampleResponse>(this.PREFIX);
        return response;
    }
}

export default ExampleApi;
