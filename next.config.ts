import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Configure Server Actions
  experimental: {
    serverActions: {
      bodySizeLimit: '30mb', // Increase from default 1mb for file uploads
    },
  },
};

export default nextConfig;
