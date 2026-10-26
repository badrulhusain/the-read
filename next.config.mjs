import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: root,
  serverExternalPackages: ['@the-read/backend'],
  outputFileTracingIncludes: {
    '/api/**': ['./packages/backend/dist/**/*'],
  },
  webpack(config, { isServer }) {
    // Keep the compiled workspace package intact, including decorator metadata.
    // Workspace symlinks can otherwise be treated as app source by webpack.
    if (isServer) {
      config.externals.push({ '@the-read/backend': 'commonjs @the-read/backend' });
    }
    return config;
  },
  async rewrites() {
    // Existing React Router URLs share a static shell. API routes and assets win.
    return { fallback: [{ source: '/:path*', destination: '/' }] };
  },
};

export default config;
