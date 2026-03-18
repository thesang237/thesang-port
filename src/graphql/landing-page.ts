import { gql } from 'graphql-request';

import graphQLClient from '@/app/actions';

export type GetLandingPageDataResponse = unknown;

export const getLandingPageData = async (locale: string = 'en'): Promise<GetLandingPageDataResponse> => {
    const query = gql`
    query LandingPage($locale: I18NLocaleCode, $pagination: PaginationArg) {
    }
  `;

    const data = await graphQLClient.request<GetLandingPageDataResponse>(query, {
        locale,
        pagination: {
            page: 1,
            pageSize: 4,
        },
    });

    return data;
};
