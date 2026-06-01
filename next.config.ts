import type {NextConfig} from 'next';
import path from 'path';
import {fileURLToPath} from 'url';

/** Absolute project root — avoids Turbopack picking D:\ when a stray lockfile exists */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  compress: true,
  reactStrictMode: true,
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Cache-Control', value: 'private, no-cache, no-store, must-revalidate' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
      ],
    },
  ],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
    ],
  },
  output: 'standalone',
  transpilePackages: ['motion'],
  turbopack: {
    root: projectRoot,
  },
  webpack: (config: any, {dev}: any) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
