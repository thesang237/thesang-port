import type { MetadataRoute } from 'next';

import { ServerVars } from '@/constants/server-only';

export default function robots(): MetadataRoute.Robots {
    if (ServerVars.NOINDEX === 'true') {
        return {
            rules: [
                {
                    userAgent: '*',
                    disallow: '/',
                },
                {
                    userAgent: 'Googlebot',
                    disallow: '/',
                },
                {
                    userAgent: 'Bingbot',
                    disallow: '/',
                },
            ],
        };
    }

    return {
        rules: {
            userAgent: '*',
            disallow: ['/private/*'],
        },
        sitemap: ServerVars.APP_DOMAIN + '/sitemap.xml',
    };
}
