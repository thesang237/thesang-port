import { GraphQLClient } from 'graphql-request';

import { ServerVars } from '@/constants/server-only';

const ENDPOINT = ServerVars.STRAPI_URL + '/graphql';

const graphQLClient = new GraphQLClient(ENDPOINT, {
    headers: {
        Authorization: `Bearer ${ServerVars.STRAPI_TOKEN}`,
    },
});

export default graphQLClient;
