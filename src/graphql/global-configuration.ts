import { gql } from 'graphql-request';

import graphQLClient from '@/app/actions';
import { anchorFields } from '@/graphql/base';
import type { StrapiShareContent } from '@/types/strapi';
import type { StrapiAnchor } from '@/types/strapi/components';

export type GetGlobalConfigurationResponse = {
    globalConfiguration?: {
        socials?: StrapiAnchor[];
        privacy_policy?: StrapiAnchor;
        terms_of_service?: StrapiAnchor;
        navigation?: StrapiAnchor[];
        share_content?: StrapiShareContent;
    };
};

export const getGlobalConfiguration = async (locale: string = 'en'): Promise<GetGlobalConfigurationResponse> => {
    const query = gql`
    query GlobalConfiguration($locale: I18NLocaleCode) {
      globalConfiguration(locale: $locale) {
        socials {
          ${anchorFields}
        }
        privacy_policy {
          ${anchorFields}
        }
        terms_of_service {
          ${anchorFields}
        }
        navigation {
          ${anchorFields}
        }
        share_content {
          content
          hashtags
        }
      }
    }
  `;

    const data = await graphQLClient.request<GetGlobalConfigurationResponse>(query, {
        locale,
    });

    return data;
};
