'use client';

import type { FC, PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AssetProvider } from '@/providers/asset';
import { AuthProvider } from '@/providers/auth';
import { BootstrapProvider } from '@/providers/bootstrap';
import { CursorProvider } from '@/providers/cursor';
import { FontProvider } from '@/providers/font';
import { PageProvider } from '@/providers/page';
import { ThemeProvider } from '@/providers/theme';
import { WindowSizeProvider } from '@/providers/window-size';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
            retry: 3,
        },
        mutations: {
            retry: 3,
        },
    },
});

const MainProviders: FC<PropsWithChildren> = ({ children }) => {
    return (
        <ThemeProvider>
            <BootstrapProvider>
                <WindowSizeProvider>
                    <AssetProvider>
                        <FontProvider>
                            <PageProvider>
                                <CursorProvider>
                                    <QueryClientProvider client={queryClient}>
                                        <AuthProvider>{children}</AuthProvider>
                                    </QueryClientProvider>
                                </CursorProvider>
                            </PageProvider>
                        </FontProvider>
                    </AssetProvider>
                </WindowSizeProvider>
            </BootstrapProvider>
        </ThemeProvider>
    );
};

export default MainProviders;
