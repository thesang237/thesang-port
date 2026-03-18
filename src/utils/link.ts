import { routing } from '@/i18n/routing';

export const ensureStartWithSlash = (href: string): string => {
    return href.startsWith('/') ? href : `/${href}`;
};

export const isAnchor = (href: string): boolean => {
    return href.startsWith('#');
};

export const getLocaleByPathname = (pathname: string): string => {
    const slugs = pathname.split('/').filter(Boolean);
    const firstSlug = slugs[0];

    return routing.locales.includes(firstSlug as never) ? firstSlug : routing.defaultLocale;
};

export const isExternalLink = (href: string): boolean => {
    return href.startsWith('http');
};

export const mergeSlugs = (slugs: string[]): string => {
    if (!slugs?.length) return '/';

    return (
        '/' +
        slugs
            .filter(Boolean) // Remove empty strings
            .map(
                (slug) => slug.trim().replace(/^\/+|\/+$/g, ''), // Remove leading/trailing slashes
            )
            .filter(Boolean) // Remove any segments that became empty after trimming
            .join('/')
    );
};
