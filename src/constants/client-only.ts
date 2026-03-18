export const ClientVars = Object.freeze({
    ENVIRONMENT: process.env.NEXT_PUBLIC_APP_ENV || 'development',

    APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Untitled',

    APP_DOMAIN: process.env.NEXT_PUBLIC_APP_DOMAIN || 'http://localhost:3000',

    API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',

    STRAPI_URL: process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337',
});
