import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Cover images are capped at 4 MB in the action: Netlify functions accept ~4.5 MB of binary
      // upload (6 MB payload limit, base64-encoded). The extra room covers multipart overhead.
      bodySizeLimit: '5mb',
    },
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
