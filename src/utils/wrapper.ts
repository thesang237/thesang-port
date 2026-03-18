import { ClientVars } from '@/constants/client-only';

type EnvBasedValueParams<T> = {
    dev: T;
    prod: T;
};

export const envBasedValue = <T>({ dev, prod }: EnvBasedValueParams<T>): T => {
    return ClientVars.ENVIRONMENT === 'production' ? prod : dev;
};

export const sleep = (ms: number) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, ms);
    });
};

export const getServerAsset = (asset: string) => {
    return `${ClientVars.API_URL}${asset}`;
};

export const getCmsAsset = (asset: string) => {
    return `${ClientVars.STRAPI_URL}${asset}`;
};
