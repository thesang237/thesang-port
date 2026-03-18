import { type NextConfig } from 'next';
import withPlugins from 'next-compose-plugins';
import createIntlPlugin from 'next-intl/plugin';
import withPWAInit from '@ducanh2912/next-pwa';
import createBundleAnalyzerPlugin from '@next/bundle-analyzer';

import pwaConfig from './pwa.config';

const isProduction = process.env.NEXT_PUBLIC_APP_ENV === 'production';

const withBundleAnalyzer = createBundleAnalyzerPlugin({
    enabled: process.env.NEXT_PUBLIC_ANALYZE === 'true',
});
const withNextIntl = createIntlPlugin();
const withPwa = withPWAInit({
    dest: 'public',
    ...pwaConfig,
    disable: !isProduction,
    register: !isProduction,
    workboxOptions: {
        disableDevLogs: true,
        cleanupOutdatedCaches: true,
    },
});

const nextConfig: NextConfig = {
    // cacheComponents: true,
    reactCompiler: true,

    images: {
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        minimumCacheTTL: 31536000, // 1 year
        dangerouslyAllowSVG: true,
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'i.pravatar.cc',
            },
            {
                protocol: 'https',
                hostname: 'picsum.photos',
            },
            {
                protocol: 'http',
                hostname: 'localhost',
            },
            {
                protocol: 'https',
                hostname: 'player.vimeo.com',
            },
            {
                protocol: 'https',
                hostname: 'plus.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'test-streams.mux.dev',
            },
            {
                protocol: 'https',
                hostname: 'placehold.co',
            },
            {
                protocol: 'https',
                hostname: 'admin.cresmu.com',
            },
            {
                protocol: 'https',
                hostname: 'cms.cresmu.com',
            },
        ],
    },

    compress: true,
    poweredByHeader: false,
    generateEtags: false,
    trailingSlash: false,
    productionBrowserSourceMaps: false,
    serverExternalPackages: ['sharp'],

    sassOptions: {
        additionalData: `@use "@/styles/tool.scss" as *;`,
    },

    webpack: (config, { dev }) => {
        if (!dev) {
            config.optimization = {
                ...config.optimization,
                moduleIds: 'deterministic',
                sideEffects: false,
            };
        }

        // GLSL shader file loader with glslify for includes
        config.module.rules.push({
            test: /\.(glsl|vert|frag)$/,
            exclude: /node_modules/,
            use: [
                {
                    loader: 'raw-loader',
                },
                {
                    loader: 'glslify-loader',
                    options: {
                        basedir: './src',
                    },
                },
            ],
        });

        // Bundle analyzer (optional, uncomment to enable)
        // if (!isServer) {
        //   config.resolve.fallback = {
        //     ...config.resolve.fallback,
        //     fs: false,
        //   };
        // }

        return config;
    },

    turbopack: {
        rules: {
            '*.glsl': {
                loaders: ['raw-loader'],
                as: '*.js',
            },
            '*.vert': {
                loaders: ['raw-loader'],
                as: '*.js',
            },
            '*.frag': {
                loaders: ['raw-loader'],
                as: '*.js',
            },
        },
    },

    experimental: {
        optimizePackageImports: ['framer-motion', 'lucide-react', 'lodash'],
        scrollRestoration: false,
        serverActions: {
            bodySizeLimit: '2mb',
        },
        gzipSize: true,
        optimizeServerReact: true,
        serverMinification: true,
        optimizeCss: true,
        cssChunking: true,
        webpackMemoryOptimizations: true,
    },
    compiler: {
        removeConsole: isProduction,
        reactRemoveProperties: true,
    },

    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                ],
            },
            {
                source: '/backgrounds/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                source: '/images/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                source: '/icons/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                source: '/logos/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                source: '/masks/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                source: '/toaster/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                source: '/videos/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ];
    },
};

export default withPlugins([withBundleAnalyzer, withNextIntl, withPwa], nextConfig);
