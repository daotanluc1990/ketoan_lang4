import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  experimental: {
    cpus: 1
  },
  outputFileTracingRoot: path.join(__dirname)
};

export default nextConfig;
