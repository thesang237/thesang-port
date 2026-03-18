export const ServerVars = Object.freeze({
    NOINDEX: process.env.NOINDEX || 'true',

    ENVIRONMENT: process.env.APP_ENV || 'development',

    APP_DOMAIN: process.env.APP_DOMAIN || 'http://localhost:3000',
    APP_NAME: process.env.APP_NAME || 'Untitled',

    STRAPI_URL: process.env.STRAPI_URL || 'http://localhost:1337',
    STRAPI_TOKEN: process.env.STRAPI_TOKEN || '',
});
