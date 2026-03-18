import type { Locale as LocaleType } from '@/i18n/routing';

export type PagePropsBase = {
    params: Promise<{ locale: LocaleType }>;
};
