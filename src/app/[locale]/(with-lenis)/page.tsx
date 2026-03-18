import type { FC } from 'react';
import type { Metadata } from 'next';

import { ServerVars } from '@/constants/server-only';
import { routing } from '@/i18n/routing';
import LandingPage from '@/modules/pages/LandingPage';
import type { PagePropsBase } from '@/types/page';
import { extractMetadata } from '@/utils/metadata';

export const revalidate = 60;

export const generateStaticParams = async () => {
    return routing.locales.map((locale) => ({ locale }));
};

export const generateMetadata = async ({ params }: PagePropsBase): Promise<Metadata> => {
    const { locale } = await params;

    return extractMetadata({
        metadataBase: {
            title: 'Home',
            description: 'Home',
            siteUrl: ServerVars.APP_DOMAIN,
        },
        locale,
    });
};

const Page: FC<PagePropsBase> = async () => {
    return <LandingPage />;
};

export default Page;
