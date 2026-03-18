declare module 'next-compose-plugins' {
    import type { NextConfig } from 'next';

    export default function withPlugins(plugins: any[], config: NextConfig): NextConfig;
}
