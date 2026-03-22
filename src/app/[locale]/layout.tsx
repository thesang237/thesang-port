import '@/styles/globals.css';
import '@/styles/app.scss';

import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';

import { Toaster } from '@/components/ui/toaster';
import { ServerVars } from '@/constants/server-only';
import { routing } from '@/i18n/routing';
import PageLoader from '@/modules/layouts/PageLoader';
import PageTransition from '@/modules/layouts/PageTransition';
import MainProviders from '@/providers/index';
import { ThemeProvider } from '@/providers/theme';
import type { PagePropsBase } from '@/types/page';
import { extractMetadata } from '@/utils/metadata';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
    weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
});

type Props = PagePropsBase & {
    children: ReactNode;
};

export const generateMetadata = async ({ params }: PagePropsBase): Promise<Metadata> => {
    const { locale } = await params;

    return extractMetadata({
        metadataBase: {
            title: 'Home',
            description: 'Home',
        },
        locale,
    });
};

export default async function RootLayout({ children, params }: Props) {
    const { locale } = await params;

    if (!hasLocale(routing.locales, locale)) {
        notFound();
    }

    setRequestLocale(locale);

    const messages = await getMessages();

    return (
        <html lang={locale} suppressHydrationWarning className={inter.variable}>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

                {ServerVars.NOINDEX === 'true' && (
                    <>
                        <meta name="robots" content="noindex, nofollow" />
                        <meta name="googlebot" content="noindex, nofollow" />
                        <meta name="bingbot" content="noindex, nofollow" />
                        <meta name="yandexbot" content="noindex, nofollow" />
                        <meta name="duckduckbot" content="noindex, nofollow" />
                        <meta name="baidubot" content="noindex, nofollow" />
                        <meta name="naverbot" content="noindex, nofollow" />
                        <meta name="seobot" content="noindex, nofollow" />
                        <meta name="seobot" content="noindex, nofollow" />
                    </>
                )}

                {ServerVars.ENVIRONMENT === 'development' && <script async src="https://unpkg.com/react-scan/dist/auto.global.js" />}
            </head>

            <body suppressHydrationWarning>
                <NextIntlClientProvider messages={messages}>
                    <ThemeProvider>
                        <MainProviders>
                            {children}

                            <PageLoader />
                            <PageTransition />

                            <Toaster position="bottom-right" richColors duration={3000} />
                        </MainProviders>
                    </ThemeProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
