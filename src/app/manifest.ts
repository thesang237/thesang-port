import type { MetadataRoute } from 'next';

import { Router } from '@/constants/router';
import { ServerVars } from '@/constants/server-only';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: ServerVars.APP_NAME,
        short_name: ServerVars.APP_NAME,
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        start_url: Router.LANDING,
        display: 'standalone',
        background_color: '#19181f',
        theme_color: '#19181f',
        icons: [
            {
                src: '/favicon.ico',
                sizes: '256x256',
                type: 'image/x-icon',
            },
        ],
    };
}
