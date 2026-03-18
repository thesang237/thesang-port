import type { MetadataRoute } from 'next';

import { ServerVars } from '@/constants/server-only';

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: ServerVars.APP_DOMAIN,
            lastModified: new Date(),
            changeFrequency: 'always',
            priority: 1,
        },
    ];
}
