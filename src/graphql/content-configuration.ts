import { gql } from 'graphql-request';

import graphQLClient from '@/app/actions';

export type GetContentConfigurationResponse = {
    contentConfiguration?: {
        all_rights_reserved_text?: string;
        copyright_text?: string;
    };
};

export const getContentConfiguration = async (locale: string = 'en'): Promise<GetContentConfigurationResponse> => {
    const query = gql`
        query ContentConfiguration($locale: I18NLocaleCode) {
            contentConfiguration(locale: $locale) {
                all_rights_reserved_text
                copyright_text
            }
        }
    `;

    const data = await graphQLClient.request<GetContentConfigurationResponse>(query, {
        locale,
    });

    return data;
};
