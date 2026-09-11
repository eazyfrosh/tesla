import type { NextConfig } from 'next';
const config: NextConfig = {
  turbopack: { root: process.cwd() },
  // Firebase Admin's jwks-rsa dependency requires ESM-only jose from CommonJS.
  // Bundle this chain so serverless runtimes need no require(ESM) support.
  transpilePackages: ['firebase-admin', 'jwks-rsa', 'jose'],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // The owner editor previews a customer site in a same-origin iframe.
          // SAMEORIGIN keeps third-party embedding blocked while allowing that
          // protected editor preview to render normally.
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};
export default config;
