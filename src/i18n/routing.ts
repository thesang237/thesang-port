import { defineRouting } from 'next-intl/routing';

export const i18n = Object.freeze({
    defaultLocale: 'en',
    locales: ['en'],
});

export type Locale = (typeof i18n)['locales'][number];

export const routing = defineRouting({
    // A list of all locales that are supported
    locales: i18n.locales,

    // Used when no locale matches
    defaultLocale: i18n.defaultLocale,

    localePrefix: 'as-needed',
});
