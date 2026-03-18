'use client';

import type { FC, ReactNode } from 'react';
import { createContext, use } from 'react';

import { Router } from '@/constants/router';
import { useRouter } from '@/i18n/navigation';

export const AUTH_TOKEN_KEY = '__s__';

type Data = {
    login: (data: unknown) => Promise<{ success: boolean; message: string }>;
    logout: () => Promise<void>;
};

const Context = createContext<Data | undefined>(undefined);

type Props = {
    children: ReactNode;
};

export const AuthProvider: FC<Props> = ({ children }) => {
    const router = useRouter();

    const login = async () => {
        const accessToken = '';

        if (accessToken) {
            localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(accessToken));

            return {
                success: true,
                message: '',
            };
        }

        return {
            success: false,
            message: 'Login failed',
        };
    };

    const logout = async () => {
        localStorage.removeItem(AUTH_TOKEN_KEY);

        router.push(Router.LOGIN);
    };

    const value: Data = {
        login,
        logout,
    };

    return <Context value={value}>{children}</Context>;
};

export const useAuth = (): Data => {
    const context = use(Context);

    if (context === undefined) {
        throw new Error('useAuth must be used within a AuthProvider');
    }

    return context;
};
