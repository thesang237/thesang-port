import type { Metadata } from 'next';

import { ServerVars } from '@/constants/server-only';
import type { Locale } from '@/i18n/routing';
import { getCmsAsset } from '@/utils/wrapper';

type MetadataBase = {
    title?: string;
    description?: string;
    keywords?: string[];
    siteUrl?: string;
    ogImage?: string;
};

type OverrideMetadata = {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
};

type ExtractMetadataParams = {
    metadataBase: MetadataBase;
    overrideMetadata?: OverrideMetadata;
    locale: Locale;
};

const getPageTitle = (subfix: string): string => {
    if (subfix === ServerVars.APP_NAME) {
        return subfix;
    }

    return `${ServerVars.APP_NAME}` + (subfix ? ` | ${subfix}` : '');
};

const getOpenGraphImage = (imageUrl?: string): string => {
    return imageUrl ? getCmsAsset(imageUrl) : '/metadata/default.png';
};

export const extractMetadata = (params: ExtractMetadataParams): Metadata => {
    const { metadataBase, overrideMetadata, locale } = params;

    const finalTitle = getPageTitle(overrideMetadata?.title || metadataBase.title || '');
    const finalDescription = overrideMetadata?.description || metadataBase.description || '';
    const finalKeywords = overrideMetadata?.keywords || metadataBase.keywords || [];
    const finalImage = getOpenGraphImage(overrideMetadata?.ogImage || metadataBase.ogImage);

    return {
        applicationName: ServerVars.APP_NAME,
        title: finalTitle,
        description: finalDescription,
        keywords: finalKeywords,
        icons: '/favicon.ico',
        openGraph: {
            title: finalTitle,
            description: finalDescription,
            images: finalImage,
            type: 'website',
            siteName: finalTitle,
            locale: locale,
            url: metadataBase.siteUrl,
        },
        twitter: {
            card: 'summary_large_image',
            title: finalTitle,
            description: finalDescription,
            images: finalImage,
        },
    };
};
