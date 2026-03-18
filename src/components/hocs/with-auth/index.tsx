'use client';

import type { ComponentType } from 'react';
import { useEffect } from 'react';

import LoaderScreen from '@/components/ui/loader-screen';
import { Router } from '@/constants/router';

type Options = {
    redirectTo: string;
    showLoading: boolean;
    loadingMessage: string;
};

function withAuth<P extends object>(
    WrappedComponent: ComponentType<P>,
    options: Options = {
        redirectTo: Router.LOGIN,
        showLoading: true,
        loadingMessage: 'Authenticating...',
    },
) {
    const AuthenticatedComponent = (props: P) => {
        const isLoading = false;
        const user = null;

        useEffect(() => {
            if (!user && !isLoading) {
                window.location.href = options.redirectTo;
            }
        }, [isLoading, user]);

        if (!user && !isLoading) {
            return null;
        } else if (options.showLoading && isLoading) {
            return <LoaderScreen message={options.loadingMessage} />;
        } else {
            return <WrappedComponent {...props} />;
        }
    };

    return AuthenticatedComponent;
}

export default withAuth;
