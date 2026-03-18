'use client';

import type { FC, ReactNode } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

type Props = {
    children: ReactNode;
};

export const ThemeProvider: FC<Props> = ({ children }) => {
    return (
        <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem>
            {children}
        </NextThemesProvider>
    );
};
