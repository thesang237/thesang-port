/** @type {import('next-pwa').PWAConfig} */
const pwaConfig = {
    dest: 'public',
    disable: process.env.NEXT_PUBLIC_APP_ENV === 'development',
    register: true,
    skipWaiting: true,
    sw: 'sw.js',
    workboxOptions: {
        mode: 'production',
        runtimeCaching: [
            // Standard caching rules (will be merged with default ones)
            {
                urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'google-fonts-webfonts',
                    expiration: {
                        maxEntries: 4,
                        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
                    },
                },
            },

            // Animation FBX files caching - HIGH PRIORITY
            {
                urlPattern: /\.fbx$/i,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'animation-fbx-cache',
                    expiration: {
                        maxEntries: 50, // Support up to 50 animation files
                        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                    },
                    cacheableResponse: {
                        statuses: [0, 200],
                    },
                    plugins: [
                        {
                            // Cache key will include file URL for better cache management
                            cacheKeyWillBeUsed: async ({ request }) => {
                                return `fbx-${request.url}`;
                            },
                        },
                    ],
                },
            },

            // 3D Model files caching
            {
                urlPattern: /\.(gltf|glb|vrm)$/i,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'model-3d-cache',
                    expiration: {
                        maxEntries: 20,
                        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                    },
                    cacheableResponse: {
                        statuses: [0, 200],
                    },
                },
            },

            // Texture and image assets
            {
                urlPattern: /\.(jpg|jpeg|png|gif|webp|svg|ico|bmp|tiff)$/i,
                handler: 'StaleWhileRevalidate',
                options: {
                    cacheName: 'static-image-assets',
                    expiration: {
                        maxEntries: 100,
                        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
                    },
                },
            },

            // Audio files
            {
                urlPattern: /\.(mp3|wav|ogg|m4a|aac|flac)$/i,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'static-audio-assets',
                    expiration: {
                        maxEntries: 50,
                        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                    },
                    plugins: [
                        // Support range requests for audio streaming
                        {
                            requestWillFetch: async ({ request }) => {
                                if (request.headers.get('range')) {
                                    return request;
                                }
                                return request;
                            },
                        },
                    ],
                },
            },

            // CDN resources (for external animation/model files)
            {
                urlPattern: ({ url }) => {
                    return url.origin !== self.location.origin && /\.(fbx|gltf|glb|vrm|jpg|jpeg|png|webp)$/i.test(url.pathname);
                },
                handler: 'CacheFirst',
                options: {
                    cacheName: 'external-assets-cache',
                    expiration: {
                        maxEntries: 100,
                        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
                    },
                    cacheableResponse: {
                        statuses: [0, 200],
                    },
                    plugins: [
                        {
                            cacheWillUpdate: async ({ response }) => {
                                // Only cache successful responses
                                return response.status === 200 ? response : null;
                            },
                        },
                    ],
                },
            },
        ],
    },
};

module.exports = pwaConfig;
